import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwtService: JwtService,
  ) {}

  async authenticateWithWallet(
    address: string,
    signature: string,
    message: string,
    walletType: string = 'FREIGHTER',
  ) {
    if (!StrKey.isValidEd25519PublicKey(address)) {
      throw new UnauthorizedException('Invalid Stellar address');
    }

    const keypair = Keypair.fromPublicKey(address);
    const verified = keypair.verify(Buffer.from(message), Buffer.from(signature, 'base64'));

    if (!verified) {
      throw new UnauthorizedException('Invalid signature');
    }

    let wallet = await this.prisma.wallet.findUnique({ where: { address } });

    if (!wallet) {
      const isMobile = walletType === 'MOBILE';
      const user = await this.prisma.user.create({
        data: {
          username: isMobile ? `player_${address.slice(0, 8)}` : `gm_${address.slice(0, 8)}`,
        },
      });

      wallet = await this.prisma.wallet.create({
        data: {
          address,
          userId: user.id,
          roles: isMobile ? ['PLAYER'] : ['PLAYER'],
          walletType: isMobile ? 'MOBILE' : 'FREIGHTER',
          isPrimary: true,
        },
      });

      await this.prisma.playerProgress.create({
        data: { walletId: wallet.id },
      });
    }

    const payload = { sub: wallet.id, address: wallet.address, roles: wallet.roles };
    const token = this.jwtService.sign(payload);
    const refreshToken = uuid();

    await this.prisma.session.create({
      data: {
        userId: wallet.userId,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: token,
      refreshToken,
      wallet: {
        id: wallet.id,
        address: wallet.address,
        roles: wallet.roles,
      },
    };
  }

  async getNonce(address: string): Promise<{ nonce: string; message: string }> {
    const nonce = uuid();
    const message = `TreasureNet Authentication\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

    await this.prisma.nonce.create({
      data: {
        value: nonce,
        walletId: address,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return { nonce, message };
  }

  async refreshToken(refreshToken: string) {
    const session = await this.prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: { userId: session.userId },
    });
    if (!wallet) throw new UnauthorizedException('Wallet not found');

    const newToken = this.jwtService.sign({
      sub: wallet.id,
      address: wallet.address,
      roles: wallet.roles,
    });
    const newRefreshToken = uuid();

    await this.prisma.session.update({
      where: { id: session.id },
      data: { token: newToken, refreshToken: newRefreshToken },
    });

    return { accessToken: newToken, refreshToken: newRefreshToken };
  }
}

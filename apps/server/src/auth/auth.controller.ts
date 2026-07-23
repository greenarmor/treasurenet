import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

class WalletAuthDto {
  @IsString() @IsNotEmpty() address!: string;
  @IsString() @IsNotEmpty() signature!: string;
  @IsString() @IsNotEmpty() message!: string;
  @IsOptional() @IsEnum(['FREIGHTER', 'MOBILE']) walletType?: string;
}

class GetNonceDto {
  @IsString() @IsNotEmpty() address!: string;
}

class RefreshTokenDto {
  @IsString() @IsNotEmpty() refreshToken!: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get authentication nonce' })
  getNonce(@Body() dto: GetNonceDto) {
    return this.authService.getNonce(dto.address);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Stellar wallet signature' })
  login(@Body() dto: WalletAuthDto) {
    return this.authService.authenticateWithWallet(
      dto.address,
      dto.signature,
      dto.message,
      dto.walletType || 'FREIGHTER',
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }
}

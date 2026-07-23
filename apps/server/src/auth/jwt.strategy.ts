import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'treasurenet-secret-change-me',
    });
  }

  async validate(payload: { sub: string; address: string; roles: string[] }) {
    return { id: payload.sub, address: payload.address, roles: payload.roles };
  }
}

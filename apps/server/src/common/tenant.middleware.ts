import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

interface TenantRequest extends Request {
  orgId?: string;
  user?: { id: string; address: string; roles: string[] };
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaClient) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    const orgSlug = req.headers['x-org-slug'] as string;

    if (!orgSlug) {
      // No org context - allowed for auth, platform endpoints
      return next();
    }

    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!org) {
      throw new ForbiddenException('Organization not found');
    }

    req.orgId = org.id;

    // Verify user is a member if authenticated
    if (req.user?.id) {
      const membership = await this.prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: org.id, userId: req.user.id } },
      });

      if (!membership) {
        throw new ForbiddenException('You are not a member of this organization');
      }
    }

    next();
  }
}

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 2. Hash password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Create user with default EMPLOYEE role
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'EMPLOYEE', // Default role from Story 2.1
      },
    });

    // 4. TODO: Add audit logging (Task 2.2.8)
    console.log(`[AUDIT] User registered: ${user.email} (${user.id})`);

    // 5. Return user without password hash
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      // TODO: Log failed attempt for rate limiting (Task 2.3.9)
      console.log(`[AUDIT] Failed login attempt: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Generate JWT tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // 5. Generate refresh token with longer expiry
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      } as any,
    );

    // 6. Update lastLoginAt timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 7. Log successful login
    console.log(`[AUDIT] Successful login: ${user.email} (${user.id})`);

    // 8. Return tokens and user profile (without password hash)
    const { passwordHash: _, ...userProfile } = user;
    
    return {
      accessToken,
      refreshToken,
      user: userProfile,
    };
  }
}

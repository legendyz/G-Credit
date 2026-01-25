import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
}

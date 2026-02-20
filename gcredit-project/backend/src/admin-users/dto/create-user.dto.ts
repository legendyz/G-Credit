/**
 * Create User DTO - Story 12.3b AC #15, #16, #17, #33
 *
 * Validates input for manual local user creation.
 */

import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SanitizeHtml } from '../../common/decorators/sanitize-html.decorator';
import { UserRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @SanitizeHtml()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @SanitizeHtml()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(100)
  department?: string;

  @ApiProperty({
    enum: ['EMPLOYEE', 'ISSUER', 'MANAGER'],
    example: 'EMPLOYEE',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'uuid-of-manager' })
  @IsOptional()
  @IsString()
  managerId?: string;
}

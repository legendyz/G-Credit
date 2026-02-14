import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { SanitizeHtml } from '../../../common/decorators/sanitize-html.decorator';

/**
 * Registration DTO
 *
 * SECURITY: Role field intentionally removed.
 * New users are always assigned EMPLOYEE role.
 * Privilege escalation must go through admin approval.
 *
 * @see SEC-P0-002
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @IsString()
  @SanitizeHtml()
  @MinLength(1, { message: 'First name is required' })
  firstName: string;

  @IsString()
  @SanitizeHtml()
  @MinLength(1, { message: 'Last name is required' })
  lastName: string;
}

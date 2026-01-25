import { IsEmail } from 'class-validator';

export class RequestResetDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

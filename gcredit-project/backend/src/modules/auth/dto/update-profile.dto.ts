import { IsString, IsOptional } from 'class-validator';
import { SanitizeHtml } from '../../../common/decorators/sanitize-html.decorator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  firstName?: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  lastName?: string;
}

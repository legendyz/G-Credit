/**
 * Update User Department DTO
 *
 * Request body for updating a user's department via Admin panel.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { SanitizeHtml } from '../../common/decorators/sanitize-html.decorator';

export class UpdateUserDepartmentDto {
  @ApiProperty({
    description: 'New department for the user',
    maxLength: 100,
    example: 'Engineering',
  })
  @IsString()
  @SanitizeHtml()
  @MaxLength(100)
  department: string;

  @ApiPropertyOptional({
    description: 'Audit note explaining the department change',
    maxLength: 200,
    example: 'Transferred to Engineering team',
  })
  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(200)
  auditNote?: string;
}

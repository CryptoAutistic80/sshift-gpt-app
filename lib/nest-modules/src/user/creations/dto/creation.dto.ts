import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreationType } from '../creation.schema';

export class CreateCreationDto {
  @ApiProperty({
    description: 'URL of the image',
    example: 'https://storage.googleapis.com/bucket/image.png'
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    description: 'Type of creation (original or edit)',
    enum: CreationType,
    example: CreationType.ORIGINAL
  })
  @IsEnum(CreationType)
  @IsNotEmpty()
  type: CreationType;

  @ApiProperty({
    description: 'Prompt used to generate the image',
    example: 'A beautiful sunset over the ocean',
    required: false
  })
  @IsString()
  @IsOptional()
  prompt?: string;

  @ApiProperty({
    description: 'Model used to generate the image',
    example: 'ideogram-1.0',
    required: false
  })
  @IsString()
  @IsOptional()
  model?: string;
}

export class CreationResponseDto extends CreateCreationDto {
  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User ID',
    example: '0x1234567890abcdef'
  })
  userId: string;
} 
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { CreationType, ModelType, AspectRatio, MagicPromptOption, StyleType } from '../creation.schema';

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
    enum: ModelType,
    example: ModelType.V_2_TURBO,
    required: false
  })
  @IsEnum(ModelType)
  @IsOptional()
  model?: ModelType;

  @ApiProperty({
    description: 'Aspect ratio of the generated image',
    enum: AspectRatio,
    example: AspectRatio.ASPECT_1_1,
    required: false
  })
  @IsEnum(AspectRatio)
  @IsOptional()
  aspectRatio?: AspectRatio;

  @ApiProperty({
    description: 'Magic prompt option for generation',
    enum: MagicPromptOption,
    example: MagicPromptOption.AUTO,
    required: false
  })
  @IsEnum(MagicPromptOption)
  @IsOptional()
  magicPromptOption?: MagicPromptOption;

  @ApiProperty({
    description: 'Style type for the generated image',
    enum: StyleType,
    example: StyleType.AUTO,
    required: false
  })
  @IsEnum(StyleType)
  @IsOptional()
  styleType?: StyleType;

  @ApiProperty({
    description: 'Seed used for image generation',
    example: 123456789,
    required: false
  })
  @IsNumber()
  @IsOptional()
  seed?: number;
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
import { ApiProperty } from '@nestjs/swagger';

export class EditDTO {
  @ApiProperty({
    description: 'URL of the image to be edited',
    example: 'https://example.com/image.jpg',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'URL of the mask image',
    example: 'https://example.com/mask.jpg',
  })
  maskUrl: string;

  @ApiProperty({
    description: 'The prompt used to describe the edited result',
    example: 'Replace the background with a beautiful sunset',
  })
  prompt: string;

  @ApiProperty({
    description: 'Model to use for editing the image. Only V_2 and V_2_TURBO are supported.',
    example: 'V_2',
    enum: ['V_2', 'V_2_TURBO'],
  })
  model: string;

  @ApiProperty({
    description: 'Magic prompt option',
    example: 'AUTO',
    enum: ['AUTO'],
    default: 'AUTO',
  })
  magic_prompt_option: string = 'AUTO';

  @ApiProperty({
    description: 'Number of images to generate',
    example: 1,
    default: 1,
  })
  num_images: number = 1;
} 
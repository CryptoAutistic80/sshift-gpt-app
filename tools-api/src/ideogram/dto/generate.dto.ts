import { ApiProperty } from '@nestjs/swagger';
import { ModelType, AspectRatio, MagicPromptOption, StyleType } from '../../../../lib/nest-modules/src/user/creations/creation.schema';

export class GenerateDTO {
  @ApiProperty({
    description:
      'A description of the scene that you want to create. This should be a concise and imaginative sentence that tells a story about the scene. For example, "A serene tropical beach',
    example:
      'A serene tropical beach scene. Dominating the foreground are tall palm trees with lush green leaves, standing tall against a backdrop of a sandy beach. The beach leads to the azure waters of the sea, which gently kisses the shoreline. In the distance, there is an island or landmass with a silhouette of what appears to be a lighthouse or tower. The sky above is painted with fluffy white clouds, some of which are tinged with hues of pink and orange, suggesting either a sunrise or sunset.',
  })
  prompt: string;

  @ApiProperty({
    description:
      'The desired ratio of the generated image. The aspect ratio should be a ratio of width to height, such as 16:9 or 10:16',
    example: AspectRatio.ASPECT_10_16,
    enum: AspectRatio,
  })
  aspect_ratio: AspectRatio;

  @ApiProperty({
    description: 'Model to use for generating the image.',
    example: ModelType.V_2,
    enum: ModelType,
  })
  model: ModelType;

  @ApiProperty({
    description: 'Mode for the magic prompt',
    example: MagicPromptOption.AUTO,
    enum: MagicPromptOption,
  })
  magic_prompt_option: MagicPromptOption;

  @ApiProperty({
    description: 'Style of the generated image',
    example: StyleType.GENERAL,
    enum: StyleType,
  })
  style_type: StyleType;

  @ApiProperty({
    description: 'Seed for generating the image.',
    example: 123456789,
  })
  seed?: number;
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, Schema as SchemaType } from 'mongoose';

export type CreationDocument = HydratedDocument<Creation>;

export enum CreationType {
  ORIGINAL = 'original',
  EDIT = 'edit'
}

export enum ModelType {
  V_1 = 'V_1',
  V_1_TURBO = 'V_1_TURBO',
  V_2 = 'V_2',
  V_2_TURBO = 'V_2_TURBO'
}

export enum MagicPromptOption {
  AUTO = 'AUTO',
  ON = 'ON',
  OFF = 'OFF'
}

export enum StyleType {
  AUTO = 'AUTO',
  GENERAL = 'GENERAL',
  REALISTIC = 'REALISTIC',
  DESIGN = 'DESIGN',
  RENDER_3D = 'RENDER_3D',
  ANIME = 'ANIME'
}

export enum AspectRatio {
  ASPECT_1_1 = 'ASPECT_1_1',
  ASPECT_1_3 = 'ASPECT_1_3',
  ASPECT_3_1 = 'ASPECT_3_1',
  ASPECT_3_4 = 'ASPECT_3_4',
  ASPECT_4_3 = 'ASPECT_4_3',
  ASPECT_16_9 = 'ASPECT_16_9',
  ASPECT_3_2 = 'ASPECT_3_2',
  ASPECT_2_3 = 'ASPECT_2_3',
  ASPECT_9_16 = 'ASPECT_9_16',
  ASPECT_16_10 = 'ASPECT_16_10',
  ASPECT_10_16 = 'ASPECT_10_16'
}

@Schema()
export class Creation {
  @Prop({ type: String, required: true })
  imageUrl: string;

  @Prop({ type: String, required: true, enum: Object.values(CreationType) })
  type: CreationType;

  @Prop({ type: String, required: false })
  prompt: string;

  @Prop({ type: String, required: false, enum: Object.values(ModelType) })
  model: ModelType;

  @Prop({ type: String, required: false, enum: Object.values(AspectRatio) })
  aspectRatio: AspectRatio;

  @Prop({ type: String, required: false, enum: Object.values(MagicPromptOption) })
  magicPromptOption: MagicPromptOption;

  @Prop({ type: String, required: false, enum: Object.values(StyleType) })
  styleType: StyleType;

  @Prop({ type: Number, required: false })
  seed: number;

  @Prop({ type: Date, default: now() })
  createdAt: Date;

  @Prop({ type: String, required: true })
  userId: string;
}

export const CreationSchema = SchemaFactory.createForClass(Creation); 
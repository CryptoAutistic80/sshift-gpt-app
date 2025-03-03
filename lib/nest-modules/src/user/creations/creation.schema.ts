import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, now, Schema as SchemaType } from 'mongoose';

export type CreationDocument = HydratedDocument<Creation>;

export enum CreationType {
  ORIGINAL = 'original',
  EDIT = 'edit'
}

@Schema()
export class Creation {
  @Prop({ type: String, required: true })
  imageUrl: string;

  @Prop({ type: String, required: true, enum: Object.values(CreationType) })
  type: CreationType;

  @Prop({ type: String, required: false })
  prompt: string;

  @Prop({ type: String, required: false })
  model: string;

  @Prop({ type: Date, default: now() })
  createdAt: Date;

  @Prop({ type: String, required: true })
  userId: string;
}

export const CreationSchema = SchemaFactory.createForClass(Creation); 
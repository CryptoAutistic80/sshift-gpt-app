import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Feature } from './feature.schema';

export type AdminConfigDocument = HydratedDocument<AdminConfig>;

@Schema()
export class AdminConfig {
  @Prop({ type: [Feature] })
  models!: Feature[];

  @Prop({ type: [Feature] })
  tools!: Feature[];

  @Prop({ type: String, default: '' })
  systemPrompt!: string;

  @Prop({ type: String, default: '' })
  reasoningPrompt!: string;
}

export const AdminConfigSchema = SchemaFactory.createForClass(AdminConfig);

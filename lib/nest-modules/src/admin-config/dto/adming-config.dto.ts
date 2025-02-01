import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { FeatureDto } from './feature.dto';

export class AdminConfigDto {
  static fromJson(models: FeatureDto[], tools: FeatureDto[], systemPrompt: string, reasoningPrompt: string): AdminConfigDto {
    return new AdminConfigDto(models, tools, systemPrompt, reasoningPrompt);
  }

  @ApiProperty({
    description: 'Set request limit models for subscription',
    type: [FeatureDto],
  })
  @Type(() => FeatureDto)
  @ValidateNested({ each: true })
  models: FeatureDto[];

  @ApiProperty({
    description: 'Set request limit tools for subscription',
    type: [FeatureDto],
  })
  @Type(() => FeatureDto)
  @ValidateNested({ each: true })
  tools: FeatureDto[];

  @ApiProperty({
    description: 'System prompt for the chat',
    type: String,
  })
  systemPrompt: string;

  @ApiProperty({
    description: 'Reasoning prompt for advanced models',
    type: String,
  })
  reasoningPrompt: string;

  constructor(models: FeatureDto[], tools: FeatureDto[], systemPrompt: string, reasoningPrompt: string) {
    this.models = models;
    this.tools = tools;
    this.systemPrompt = systemPrompt;
    this.reasoningPrompt = reasoningPrompt;
  }
}

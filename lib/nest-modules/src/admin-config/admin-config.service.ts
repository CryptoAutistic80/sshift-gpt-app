import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AdminConfig } from './admin-config.schema';
import { AdminConfigDto } from './dto/adming-config.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

// Use require for JSON file since TypeScript needs special config for JSON imports
import defaultPrompt from './defaultPrompt.json';
import defaultReasoningPrompt from './defaultReasoningPrompt.json';

@Injectable()
export class AdminConfigService {
  private readonly CACHE_KEY = 'admin_config';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    @InjectModel(AdminConfig.name)
    private adminConfigModel: Model<AdminConfig>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAdminConfig(): Promise<AdminConfig> {
    // Check cache
    const cached = await this.cacheManager.get<AdminConfig>(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    // First try to find existing config
    const existingConfig = await this.adminConfigModel.findOne({}).exec();
    
    if (existingConfig) {
      await this.cacheManager.set(this.CACHE_KEY, existingConfig, this.CACHE_TTL);
      return existingConfig;
    }
    
    // If no config exists, create new one with defaults
    const newConfig = await this.adminConfigModel.create({
      models: [],
      tools: [],
      systemPrompt: defaultPrompt.content,
      reasoningPrompt: defaultReasoningPrompt.content
    });

    await this.cacheManager.set(this.CACHE_KEY, newConfig, this.CACHE_TTL);
    return newConfig;
  }

  async updateAdmin(adminConfigDto: AdminConfigDto): Promise<AdminConfig> {
    const updated = await this.adminConfigModel.findOneAndUpdate(
      {},
      {
        models: adminConfigDto.models,
        tools: adminConfigDto.tools,
        systemPrompt: adminConfigDto.systemPrompt || defaultPrompt.content,
        reasoningPrompt: adminConfigDto.reasoningPrompt || defaultReasoningPrompt.content
      },
      { upsert: true, new: true }
    ).exec();

    // Update cache
    await this.cacheManager.set(this.CACHE_KEY, updated, this.CACHE_TTL);
    return updated;
  }
}

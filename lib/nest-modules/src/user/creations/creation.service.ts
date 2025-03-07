import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Creation, CreationType } from './creation.schema';
import { CreateCreationDto } from './dto/creation.dto';

@Injectable()
export class CreationService {
  private readonly logger = new Logger(CreationService.name);

  constructor(
    @InjectModel(Creation.name) private creationModel: Model<Creation>
  ) {}

  async createCreation(userId: string, createCreationDto: CreateCreationDto): Promise<Creation> {
    this.logger.log(`[START] Creating creation for user ${userId} with type: ${createCreationDto.type}`);
    this.logger.log(`Creation details - imageUrl: ${createCreationDto.imageUrl.substring(0, 50)}..., model: ${createCreationDto.model}`);
    
    try {
      const creation = new this.creationModel({
        ...createCreationDto,
        userId
      });

      const savedCreation = await creation.save();
      this.logger.log(`[SUCCESS] Creation stored successfully with ID: ${savedCreation._id}`);
      return savedCreation;
    } catch (error) {
      this.logger.error(`[ERROR] Failed to store creation for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getUserCreations(userId: string, page = 1, limit = 10): Promise<{ creations: Creation[], total: number, page: number, limit: number, totalPages: number }> {
    this.logger.log(`[START] Fetching creations for user ${userId} - page: ${page}, limit: ${limit}`);
    
    // Ensure page is at least 1
    page = Math.max(1, page);
    // Ensure limit is between 1 and 100
    limit = Math.min(Math.max(1, limit), 100);

    const skip = (page - 1) * limit;

    try {
      const [creations, total] = await Promise.all([
        this.creationModel
          .find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.creationModel.countDocuments({ userId })
      ]);

      this.logger.log(`[SUCCESS] Found ${creations.length} creations for user ${userId} (total: ${total})`);
      
      return {
        creations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`[ERROR] Failed to fetch creations for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getCreationById(id: string): Promise<Creation> {
    this.logger.log(`[START] Fetching creation with ID: ${id}`);
    
    try {
      const creation = await this.creationModel.findById(id).exec();
      
      if (creation) {
        this.logger.log(`[SUCCESS] Found creation with ID: ${id} for user ${creation.userId}`);
      } else {
        this.logger.warn(`[NOT FOUND] Creation with ID: ${id} not found`);
      }
      
      return creation;
    } catch (error) {
      this.logger.error(`[ERROR] Failed to fetch creation with ID ${id}: ${error.message}`);
      throw error;
    }
  }

  async deleteCreation(id: string): Promise<Creation> {
    this.logger.log(`[START] Deleting creation with ID: ${id}`);
    
    try {
      const deletedCreation = await this.creationModel.findByIdAndDelete(id).exec();
      
      if (deletedCreation) {
        this.logger.log(`[SUCCESS] Deleted creation with ID: ${id} for user ${deletedCreation.userId}`);
      } else {
        this.logger.warn(`[NOT FOUND] Creation with ID: ${id} not found for deletion`);
      }
      
      return deletedCreation;
    } catch (error) {
      this.logger.error(`[ERROR] Failed to delete creation with ID ${id}: ${error.message}`);
      throw error;
    }
  }
} 
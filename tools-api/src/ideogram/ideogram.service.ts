import { Injectable, Logger, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { GenerateDTO } from './dto/generate.dto';
import { BucketService, ConfigService, CreationService, CreationType } from '@nest-modules';
import { ModelType, AspectRatio, MagicPromptOption, StyleType } from '../../../lib/nest-modules/src/user/creations/creation.schema';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EditDTO } from './dto/edit.dto';
import { FormData } from 'formdata-node';

@Injectable()
export class IdeogramService {
  private readonly logger = new Logger(IdeogramService.name);
  private baseUrl: string;
  private apiKey: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly bucketService: BucketService,
    private readonly creationService: CreationService
  ) {
    this.baseUrl = this.configService.get('ideogram.baseUrl');
    this.apiKey = this.configService.get('ideogram.apiKey');
  }

  private validateAndConvertModel(model: string): ModelType {
    if (Object.values(ModelType).includes(model as ModelType)) {
      return model as ModelType;
    }
    throw new BadRequestException(`Invalid model type: ${model}`);
  }

  private validateAndConvertAspectRatio(aspectRatio: string): AspectRatio {
    if (Object.values(AspectRatio).includes(aspectRatio as AspectRatio)) {
      return aspectRatio as AspectRatio;
    }
    throw new BadRequestException(`Invalid aspect ratio: ${aspectRatio}`);
  }

  private validateAndConvertMagicPromptOption(option: string): MagicPromptOption {
    if (Object.values(MagicPromptOption).includes(option as MagicPromptOption)) {
      return option as MagicPromptOption;
    }
    throw new BadRequestException(`Invalid magic prompt option: ${option}`);
  }

  private validateAndConvertStyleType(style: string): StyleType {
    if (Object.values(StyleType).includes(style as StyleType)) {
      return style as StyleType;
    }
    throw new BadRequestException(`Invalid style type: ${style}`);
  }

  async generateIdeogram(generateDto: GenerateDTO, userId?: string) {
    this.logger.log(`[START] Generating ideogram with prompt: "${generateDto.prompt.substring(0, 50)}..." for user: ${userId || 'anonymous'}`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/generate`,
          {
            image_request: generateDto,
          },
          {
            headers: {
              'Api-key': this.apiKey,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      this.logger.log(`[SUCCESS] Received response from Ideogram API for generation`);
      const imageData = response.data?.data?.[0];

      this.logger.log(`[PROCESSING] Uploading generated image to bucket`);
      const { url } = await this.bucketService.uploadImageToBucket(imageData.url);
      this.logger.log(`[SUCCESS] Image uploaded to bucket: ${url.substring(0, 50)}...`);

      // Store the creation if userId is provided
      if (userId) {
        this.logger.log(`[STORING] Saving original creation to database for user: ${userId}`);
        try {
          const creation = await this.creationService.createCreation(userId, {
            imageUrl: url,
            type: CreationType.ORIGINAL,
            prompt: generateDto.prompt,
            model: this.validateAndConvertModel(generateDto.model),
            aspectRatio: this.validateAndConvertAspectRatio(generateDto.aspect_ratio),
            magicPromptOption: this.validateAndConvertMagicPromptOption(generateDto.magic_prompt_option),
            styleType: this.validateAndConvertStyleType(generateDto.style_type),
            seed: generateDto.seed
          });
          this.logger.log(`[SUCCESS] Original creation stored successfully with ID: ${creation['_id']}`);
        } catch (error) {
          this.logger.error(`[ERROR] Failed to store original creation: ${error.message}`);
          // Continue execution even if storage fails
        }
      } else {
        this.logger.warn(`[SKIPPED] No userId provided, skipping creation storage`);
      }

      return {
        ...imageData,
        url,
      };
    } catch (error) {
      this.logger.error(`[ERROR] Failed to generate ideogram: ${error.message}`);
      throw error;
    }
  }

  async editImage(editDto: EditDTO, userId?: string) {
    this.logger.log(`[START] Editing image with prompt: "${editDto.prompt.substring(0, 50)}..." for user: ${userId || 'anonymous'}`);
    
    try {
      const formData = new FormData();
      
      // Download original image
      const imageResponse = await firstValueFrom(
        this.httpService.get(editDto.imageUrl, { responseType: 'arraybuffer' })
      );
      this.logger.log(`[SUCCESS] Original image downloaded`);
      
      // Download mask
      const maskResponse = await firstValueFrom(
        this.httpService.get(editDto.maskUrl, { responseType: 'arraybuffer' })
      );
      this.logger.log(`[SUCCESS] Mask image downloaded`);

      // Create form data
      formData.append('image_file', new Blob([imageResponse.data]), 'image.png');
      formData.append('mask', new Blob([maskResponse.data]), 'mask.png');
      formData.append('prompt', editDto.prompt);
      formData.append('model', editDto.model);
      formData.append('magic_prompt_option', editDto.magic_prompt_option);
      formData.append('num_images', editDto.num_images.toString());

      this.logger.log(`[PROCESSING] Sending edit request to Ideogram API with model: ${editDto.model}`);
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/edit`, formData, {
          headers: {
            'Api-key': this.apiKey,
            'Content-Type': 'multipart/form-data',
          },
        })
      );
      
      this.logger.log('[SUCCESS] Received response from Ideogram API for edit');
      const imageData = response.data?.data?.[0];
      
      this.logger.log(`[PROCESSING] Uploading edited image to bucket`);
      const { url } = await this.bucketService.uploadImageToBucket(imageData.url);
      this.logger.log(`[SUCCESS] Edited image uploaded to bucket: ${url.substring(0, 50)}...`);

      // Store the creation if userId is provided
      if (userId) {
        this.logger.log(`[STORING] Saving edit creation to database for user: ${userId}`);
        try {
          const creation = await this.creationService.createCreation(userId, {
            imageUrl: url,
            type: CreationType.EDIT,
            prompt: editDto.prompt,
            model: editDto.model
          });
          this.logger.log(`[SUCCESS] Edit creation stored successfully with ID: ${creation['_id']}`);
        } catch (error) {
          this.logger.error(`[ERROR] Failed to store edit creation: ${error.message}`);
          // Continue execution even if storage fails
        }
      } else {
        this.logger.warn(`[SKIPPED] No userId provided, skipping creation storage`);
      }

      return {
        ...imageData,
        url,
      };
    } catch (error) {
      this.logger.error(`[ERROR] Error editing image: ${error.message}`);
      throw error;
    }
  }
}

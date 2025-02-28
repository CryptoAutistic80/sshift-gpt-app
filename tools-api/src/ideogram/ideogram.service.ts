import { Injectable } from '@nestjs/common';
import { GenerateDTO } from './dto/generate.dto';
import { BucketService, ConfigService } from '@nest-modules';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EditDTO } from './dto/edit.dto';
import { FormData } from 'formdata-node';

@Injectable()
export class IdeogramService {
  private baseUrl: string;
  private apiKey: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly bucketService: BucketService
  ) {
    this.baseUrl = this.configService.get('ideogram.baseUrl');
    this.apiKey = this.configService.get('ideogram.apiKey');
  }
  async generateIdeogram(generateDto: GenerateDTO) {
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

    const imageData = response.data?.data?.[0];

    const { url } = await this.bucketService.uploadImageToBucket(imageData.url);

    return {
      ...imageData,
      url,
    };
  }

  async editImage(editDto: EditDTO) {
    // Download both images
    try {
      const imageResponse = await firstValueFrom(
        this.httpService.get(editDto.imageUrl, { responseType: 'arraybuffer' })
      );
      const maskResponse = await firstValueFrom(
        this.httpService.get(editDto.maskUrl, { responseType: 'arraybuffer' })
      );

      // Create form data
      const formData = new FormData();
      formData.append(
        'image_file',
        new Blob([imageResponse.data]),
        'image.jpg'
      );
      formData.append('mask', new Blob([maskResponse.data]), 'mask.jpg');
      formData.append('prompt', editDto.prompt);
      formData.append('model', editDto.model);
      formData.append('magic_prompt_option', editDto.magic_prompt_option);
      formData.append('num_images', editDto.num_images.toString());

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/edit`, formData, {
          headers: {
            'Api-key': this.apiKey,
            'Content-Type': 'multipart/form-data',
          },
        })
      );
      const imageData = response.data?.data?.[0];
      const { url } = await this.bucketService.uploadImageToBucket(
        imageData.url
      );

      return {
        ...imageData,
        url,
      };
    } catch (error) {
      console.error(
        'Error editing image:',
        error.response?.data || error.message
      );
      throw new Error('Failed to edit image');
    }
  }
}

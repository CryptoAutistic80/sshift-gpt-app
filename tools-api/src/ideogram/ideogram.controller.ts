import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ToolsGuard } from '../tools/tools.guard';
import { IdeogramService } from './ideogram.service';
import { GenerateDTO } from './dto/generate.dto';
import { GetGeneratedImageDto } from './dto/get-generated-image.dto';
import { EditDTO } from './dto/edit.dto';
import { UserAuth } from '@nest-modules';

@Controller('ideogram')
@ApiBearerAuth('Authorization')
@UseGuards(ToolsGuard('ideogram'))
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal server error' })
export class IdeogramController {
  private readonly logger = new Logger(IdeogramController.name);
  constructor(private readonly ideogramService: IdeogramService) {}

  @Post('generate')
  async generateIdeogram(
    @Body() generateDto: GenerateDTO,
    @UserAuth() user: any
  ): Promise<GetGeneratedImageDto[]> {
    const userId = user.address;
    this.logger.log(`[API] Received generate request from user ${userId} with prompt: "${generateDto.prompt.substring(0, 50)}..."`);
    try {
      const result = await this.ideogramService.generateIdeogram(generateDto, userId);
      this.logger.log(`[API] Successfully generated image for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`[API] Error generating image for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  @Post('edit')
  @ApiResponse({
    status: 200,
    description: 'Image edited successfully',
    type: GetGeneratedImageDto,
  })
  async editImage(
    @Body() editDto: EditDTO,
    @UserAuth() user: any
  ): Promise<GetGeneratedImageDto> {
    const userId = user.address;
    this.logger.log(`[API] Received edit request from user ${userId} with prompt: "${editDto.prompt.substring(0, 50)}..."`);
    try {
      const result = await this.ideogramService.editImage(editDto, userId);
      this.logger.log(`[API] Successfully edited image for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`[API] Error editing image for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}

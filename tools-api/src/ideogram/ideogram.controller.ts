import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ToolsGuard } from '../tools/tools.guard';
import { IdeogramService } from './ideogram.service';
import { GenerateDTO } from './dto/generate.dto';
import { GetGeneratedImageDto } from './dto/get-generated-image.dto';
import { EditDTO } from './dto/edit.dto';

@Controller('ideogram')
@ApiBearerAuth('Authorization')
@UseGuards(ToolsGuard('ideogram'))
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 500, description: 'Internal server error' })
export class IdeogramController {
  private readonly logger = new Logger(IdeogramController.name);
  constructor(private readonly ideogramService: IdeogramService) {}

  @Post('generate')
  generateIdeogram(
    @Body() generateDto: GenerateDTO
  ): Promise<GetGeneratedImageDto[]> {
    return this.ideogramService.generateIdeogram(generateDto);
  }

  @Post('edit')
  @ApiResponse({
    status: 200,
    description: 'Image edited successfully',
    type: GetGeneratedImageDto,
  })
  editImage(@Body() editDto: EditDTO): Promise<GetGeneratedImageDto> {
    return this.ideogramService.editImage(editDto);
  }
}

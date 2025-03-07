import { Body, Controller, Delete, Get, Logger, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreationService } from './creation.service';
import { CreateCreationDto, CreationResponseDto } from './dto/creation.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { UserAuth } from '../../auth/auth.decorator';
import { Creation } from './creation.schema';

@ApiTags('creations')
@Controller('creations')
@ApiBearerAuth('Authorization')
export class CreationController {
  private readonly logger = new Logger(CreationController.name);

  constructor(private readonly creationService: CreationService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a new creation' })
  @ApiResponse({ status: 201, description: 'Creation created successfully', type: CreationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCreation(
    @UserAuth() user: any,
    @Body() createCreationDto: CreateCreationDto
  ): Promise<Creation> {
    const userId = user.address;
    this.logger.log(`[API] Creating creation for user ${userId} with type: ${createCreationDto.type}`);
    const result = await this.creationService.createCreation(userId, createCreationDto);
    this.logger.log(`[API] Creation successfully created with ID: ${result['_id']}`);
    return result;
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all creations for the authenticated user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Creations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserCreations(
    @UserAuth() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userId = user.address;
    this.logger.log(`[API] Getting creations for user ${userId} - page: ${page || 1}, limit: ${limit || 10}`);
    const result = await this.creationService.getUserCreations(userId, page, limit);
    this.logger.log(`[API] Retrieved ${result.creations.length} creations for user ${userId} (total: ${result.total})`);
    return result;
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get a creation by ID' })
  @ApiResponse({ status: 200, description: 'Creation retrieved successfully', type: CreationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Creation not found' })
  async getCreationById(@Param('id') id: string): Promise<Creation> {
    this.logger.log(`[API] Getting creation with ID: ${id}`);
    const result = await this.creationService.getCreationById(id);
    if (result) {
      this.logger.log(`[API] Retrieved creation with ID: ${id}`);
    } else {
      this.logger.warn(`[API] Creation with ID: ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete a creation' })
  @ApiResponse({ status: 200, description: 'Creation deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Creation not found' })
  async deleteCreation(@Param('id') id: string): Promise<Creation> {
    this.logger.log(`[API] Deleting creation with ID: ${id}`);
    const result = await this.creationService.deleteCreation(id);
    if (result) {
      this.logger.log(`[API] Deleted creation with ID: ${id}`);
    } else {
      this.logger.warn(`[API] Creation with ID: ${id} not found for deletion`);
    }
    return result;
  }
} 
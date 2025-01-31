import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Get,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { Public, UserAuth } from '../auth/auth.decorator';
import { IUserAuth } from '@helpers';
import { AdminConfigDto } from './dto/adming-config.dto';
import { AdminConfigService } from './admin-config.service';
import { FeatureDto } from './dto/feature.dto';

@Controller('admin-config')
export class AdminConfigController {
  logger = new Logger(AdminConfigController.name);
  constructor(
    private readonly adminConfigService: AdminConfigService,
    private readonly userService: UserService
  ) {}

  @Put()
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Admin config id',
  })
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Update admin configuration',
  })
  @ApiResponse({
    status: 201,
    description: 'Admin configuration updated successfully',
    type: AdminConfigDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async updateAdminConfig(
    @Body() adminConfigDto: AdminConfigDto,
    @UserAuth() userAuth: IUserAuth
  ) {
    if (!userAuth.config.isAdmin) {
      throw new UnauthorizedException('Unauthorized access');
    }

    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exits`
      );
    }

    await this.adminConfigService.updateAdmin(adminConfigDto);

    return adminConfigDto;
  }

  @Get()
  @Public()
  @ApiOperation({
    description: 'Get user chat history',
  })
  @ApiResponse({
    status: 200,
    description: 'Response of user chat history',
    type: AdminConfigDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getConfigAdmin() {
    const adminConfig = await this.adminConfigService.findAdminConfig();

    return AdminConfigDto.fromJson(
      adminConfig?.models?.map((m) => FeatureDto.fromJson(m)) || [],
      adminConfig?.tools?.map((t) => FeatureDto.fromJson(t)) || [],
      adminConfig?.systemPrompt || '',
      adminConfig?.reasoningPrompt || ''
    );
  }
}

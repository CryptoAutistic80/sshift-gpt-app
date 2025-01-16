import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Get,
  Put,
  Query,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { GetUserDto } from '../user/dto/get-user.dto';
import { UserAuth } from '../auth/auth.decorator';
import { IUserAuth } from '@helpers';
import { ChatHistoryDto } from './dto/chat-history.dto';
import { Chat } from './chat.schema';

@Controller('history')
export class ChatController {
  logger = new Logger(ChatController.name);
  constructor(private readonly userService: UserService) {}

  @Put()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Update user chat history',
  })
  @ApiResponse({
    status: 201,
    description: 'User chat history update',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async updateUserChatHistory(
    @Body() chats: ChatHistoryDto[],
    @UserAuth() userAuth: IUserAuth
  ) {
    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exits`
      );
    }

    await this.userService.updateUser(
      userAuth.address.toLocaleLowerCase(),
      chats
    );

    return GetUserDto.fromJson({
      ...user,
      chats: chats as Chat[],
    });
  }

  @Get()
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Get user chat history',
  })
  @ApiResponse({
    status: 200,
    description: 'Response of user chat history',
    type: GetUserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getUserChatHistory(@UserAuth() userAuth: IUserAuth) {
    const user = await this.userService.findUserByAddress(userAuth.address);

    return GetUserDto.fromJson(user);
  }

  @Get(':chatId/messages')
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    description: 'Get paginated messages for a specific chat',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated chat messages',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Number of messages per page' })
  async getChatMessages(
    @Param('chatId') chatId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @UserAuth() userAuth: IUserAuth
  ) {
    const user = await this.userService.findUserByAddress(userAuth.address);

    if (!user) {
      throw new NotFoundException(
        `User with address ${userAuth.address} does not exits`
      );
    }

    return this.userService.getChatMessages(
      userAuth.address.toLowerCase(),
      chatId,
      page,
      limit
    );
  }
} 
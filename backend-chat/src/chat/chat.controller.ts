import {
  Body,
  Controller,
  Logger,
  NotFoundException,
  Get,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
} 
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model, UpdateWriteOpResult } from 'mongoose';
import { ChatHistoryDto } from '../chat/dto/chat-history.dto';
import { Activity } from './activity/activity.schema';
import { FeatureActivityDto } from './dto/credits-used.dto';
import { FeatureActivity } from './activity/feature-used.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>
  ) {}

  async findUserByAddress(address: string): Promise<User> {
    const user = await this.userModel.findOne({ address });

    if (user?.activity) {
      user.activity = await this.activityModel.findOne({ _id: user.activity });
    }

    return user;
  }

  async addUser(address: string): Promise<User> {
    const activityModel = await new this.activityModel({
      models: [],
      tools: [],
    });

    const activity = await activityModel.save();

    const user = await new this.userModel({
      address,
    });

    user.activity = activity;

    return user.save();
  }

  async updateFeatureActivity(
    address: string,
    creditsUsed: FeatureActivityDto
  ): Promise<FeatureActivityDto> {
    const user = await this.userModel.findOne({ address });

    const userActivity = await this.activityModel.findOne({
      _id: user.activity,
    });

    let creditType: FeatureActivity = userActivity[
      creditsUsed.creditType.toLocaleLowerCase()
    ]?.find((r) => r.name === creditsUsed.name);

    if (creditType) {
      userActivity[creditsUsed.creditType.toLocaleLowerCase()] = [
        ...userActivity[creditsUsed.creditType.toLocaleLowerCase()].map((a) => {
          if (a.name === creditsUsed.name) {
            return { ...a, creditsUsed: a.creditsUsed + 1 };
          }
          return a;
        }),
      ];
    } else {
      creditType = {
        name: creditsUsed.name,
        creditsUsed: 1,
      };

      userActivity[creditsUsed.creditType.toLocaleLowerCase()] = [
        ...userActivity[creditsUsed.creditType.toLocaleLowerCase()],
        creditType,
      ];
    }

    await this.activityModel.updateOne(
      {
        _id: userActivity._id,
      },
      userActivity
    );

    creditsUsed.creditsUsed = creditType.creditsUsed;

    return creditsUsed;
  }

  async updateUser(
    address: string,
    chats: ChatHistoryDto[]
  ): Promise<UpdateWriteOpResult> {
    // First get the current user to compare message counts
    const currentUser = await this.userModel.findOne({ address: address.toLowerCase() });
    const currentChats = currentUser?.chats || [];

    return this.userModel.updateOne(
      { address: address.toLowerCase() },
      {
        chats: [...chats.map((newChat) => {
          const existingChat = currentChats.find(c => c.id === newChat.id);
          const hasNewMessages = existingChat ? newChat.messages.length > existingChat.messages.length : true;
          
          return {
            ...newChat,
            lastUpdated: hasNewMessages ? Date.now() : (newChat.lastUpdated || Date.now())
          };
        })]
      }
    );
  }

  async getChatMessages(address: string, chatId: string, page = 1, limit = 20) {
    const user = await this.userModel.findOne({ 
      address: address.toLowerCase()
    });

    const chat = user?.chats?.find(c => c.id === chatId);
    
    if (!user || !chat) {
      return {
        messages: [],
        hasMore: false,
        total: 0
      };
    }

    // Sort messages by createdAt in ascending order (oldest to newest)
    const sortedMessages = [...chat.messages].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });

    const total = sortedMessages.length;
    
    // Calculate pagination starting from the newest messages
    const startIndex = Math.max(0, total - (page * limit));
    const endIndex = Math.min(total, total - ((page - 1) * limit));
    
    // Get messages for current page
    const messages = sortedMessages.slice(startIndex, endIndex);

    return {
      messages,
      // Only have more messages if we haven't reached the beginning
      hasMore: startIndex > 0,
      total
    };
  }
}

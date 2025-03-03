import {
  AdminConfigModule,
  BucketModule,
  ConfigModule,
  CreationModule,
  UserModule,
} from '@nest-modules';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { IdeogramService } from './ideogram.service';
import { IdeogramController } from './ideogram.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    BucketModule,
    AdminConfigModule,
    UserModule,
    CreationModule,
  ],
  providers: [IdeogramService],
  controllers: [IdeogramController],
})
export class IdeogramModule {}

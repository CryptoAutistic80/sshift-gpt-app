import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Creation, CreationSchema } from './creation.schema';
import { CreationService } from './creation.service';
import { CreationController } from './creation.controller';
import { ConfigModule } from '../../config/config.module';
import { AuthModule } from '../../auth/auth.module';
import { UserModule } from '../user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Creation.name, schema: CreationSchema }
    ]),
    ConfigModule,
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule)
  ],
  providers: [CreationService],
  controllers: [CreationController],
  exports: [CreationService, MongooseModule]
})
export class CreationModule {} 
import { AdminConfigModule, ConfigModule, UserModule } from '@nest-modules';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ElfaService } from './elfa.service';
import { ElfaController } from './elfa.controller';

@Module({
  imports: [ConfigModule, HttpModule, AdminConfigModule, UserModule],
  providers: [ElfaService],
  controllers: [ElfaController],
  exports: [],
})
export class ElfaModule {}

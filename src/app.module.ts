import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { config } from 'dotenv';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
config();

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: +process.env.DATABASE_PORT,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      ssl: process.env.NODE_ENV == 'production',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true, // models will be loaded automatically (you don't have to explicitly specify the entities: [] array)
      synchronize: true, // your entities will be synced with the database (ORM will map entities definitions to corresponding SQL tabled), every time you run the application (recommended: disable in the production)
    }),
    UsersModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from "./users/users.service";
import { config } from 'dotenv';
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const usersService = app.get(UsersService);

  // Call the method from the service
  await usersService.cypher();
  await app.listen(process.env.PORT || 3000);
}
bootstrap();


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from "./users/users.service";
import { config } from 'dotenv';
import { initializeDatabase } from './scripts/seed';
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const userDto = {
    firstName: 'John',
    lastName: 'Doe',
    text: 'Hello World'
  }

  const usersService = app.get(UsersService);
  await usersService.create(userDto);
  await usersService.cypher();

  // Call the method from the service
  await initializeDatabase(app);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();


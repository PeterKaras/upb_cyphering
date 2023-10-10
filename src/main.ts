import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from "./users/users.service";
import { config } from 'dotenv';
import { initializeDatabase } from './scripts/seed';
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Call the method from the service
  await initializeDatabase(app);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();


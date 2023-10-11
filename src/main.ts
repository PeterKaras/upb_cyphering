import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { initializeDatabase } from './scripts/seed';
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await initializeDatabase(app);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();


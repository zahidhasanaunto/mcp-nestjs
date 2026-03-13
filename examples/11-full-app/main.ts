import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Full example running on http://localhost:3000');
  console.log('Playground: http://localhost:3000/mcp-playground');
  console.log('SSE:        GET  http://localhost:3000/sse');
  console.log('HTTP:       POST http://localhost:3000/mcp');
}
bootstrap();

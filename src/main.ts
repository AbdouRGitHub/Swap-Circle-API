import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
  .setTitle('API GPE')
  .setDescription('Test des différentes routes de l\'API du projet GPE')
  .setVersion('1.0')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
  }, 'access-token')
  .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('gpe', app, document);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.use(bodyParser.json({ limit: '100mb' }));
  await app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  await app.listen(3000, '0.0.0.0');
}
bootstrap();

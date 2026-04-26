import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpErrorFilter } from './common/filter/http-error.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { useContainer } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Feature Flag API')
    .setDescription('Sistema de controle de funcionalidades para o Back-Office')
    .setVersion('1.0')
    .addTag('Public')
    .addTag('Internal')
    .addBearerAuth()
    .addApiKey({
      type: 'apiKey',
      name: 'authorization',
      in: 'header',
      description: 'Put your token here'
    }, 'STS-Token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();

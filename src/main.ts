import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpErrorFilter } from './common/filter/http-error.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalInterceptors(new TransformInterceptor());
  // Request logging interceptor is now registered via APP_INTERCEPTOR in AppModule
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpErrorFilter } from './modules/common/filter/http-error.filter';
import { TransformInterceptor } from './modules/common/interceptors/transform.interceptor';
import { useContainer } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FeatureFlagModule } from './modules/feature-flag/feature-flag.module';
import { UXResearchModule } from './modules/ux-research/ux-research.module';

function buildOpenApiBase(title: string, description: string) {
  return new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion('1.0')
    .addTag('Public')
    .addTag('Internal')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'authorization',
        in: 'header',
        description: 'Put your token here',
      },
      'STS-Token',
    )
    .build();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const documentFeatureFlag = SwaggerModule.createDocument(
    app,
    buildOpenApiBase(
      'Feature Flag API — Feature flags',
      'Apenas endpoints do domínio de feature flags.',
    ),
    {
      include: [FeatureFlagModule],
    },
  );
  SwaggerModule.setup('api/docs/feature-flag', app, documentFeatureFlag);

  const documentUxResearch = SwaggerModule.createDocument(
    app,
    buildOpenApiBase(
      'Feature Flag API — UX Research',
      'Apenas endpoints do domínio de UX research.',
    ),
    {
      include: [UXResearchModule],
    },
  );
  SwaggerModule.setup('api/docs/ux-research', app, documentUxResearch);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();

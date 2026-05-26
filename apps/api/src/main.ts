import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import {
  ValidationPipe,
  HttpExceptionFilter,
  ResponseInterceptor,
} from './common';
import { AppConfigService } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log', 'warn', 'verbose'],
  });

  // Get config service
  const configService = app.get(AppConfigService);
  const port = configService.port;

  // Security middleware
  app.use(
    require('helmet')() as (
      req: any,
      res: any,
      next: () => void,
    ) => void,
  );
  app.use(
    require('compression')() as (
      req: any,
      res: any,
      next: () => void,
    ) => void,
  );

  // API prefix and versioning
  app.setGlobalPrefix('api/v1');
  app.enableVersioning();

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('InterVu AI API')
    .setDescription('Interview preparation AI platform - REST API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'jwt-auth',
    )
    .addServer(
      `http://localhost:${port}`,
      configService.isDevelopment ? 'Development' : 'Production',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      deepLinking: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(port, '0.0.0.0');

  const baseUrl = `http://localhost:${port}`;
  console.log(`\n✅ API running on ${baseUrl}`);
  console.log(`📚 Swagger documentation: ${baseUrl}/api/docs`);
  console.log(`💚 Health check: ${baseUrl}/api/v1/health\n`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
import { Logger } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import helmet from "helmet";
import compression from "compression";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import {
  ZodValidationPipe,
  GlobalExceptionFilter,
  ResponseInterceptor,
  ResponseValidationInterceptor,
} from "@intervu/shared";
import { ObservabilityInterceptor } from "./common/monitoring/observability.interceptor";
import { RedisConnectionManager } from "./cache";
import { AppConfigService } from "./config";

async function bootstrap() {
  const bootstrapLogger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule, {
    logger: ["debug", "error", "log", "warn", "verbose"],
  });

  // Get config service
  const configService = app.get(AppConfigService);
  const port = configService.port;

  try {
    await RedisConnectionManager.connect(configService.redisUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Redis error";
    bootstrapLogger.warn(
      `Redis unavailable at startup; continuing in degraded mode. ${message}`,
    );
  }

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // API prefix and versioning
  app.setGlobalPrefix("api/v1");

  // Global pipes

  app.useGlobalPipes(new ZodValidationPipe());

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Interceptors
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ResponseValidationInterceptor(reflector),
    new ObservabilityInterceptor(),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("InterVu AI API")
    .setDescription("Interview preparation AI platform - REST API")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "jwt-auth",
    )
    .addServer(
      `http://localhost:${port}`,
      configService.isDevelopment ? "Development" : "Production",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      docExpansion: "list",
      defaultModelsExpandDepth: 1,
      deepLinking: true,
    },
    customCss: ".swagger-ui .topbar { display: none }",
  });

  await app.listen(port, "0.0.0.0");

  const baseUrl = `http://localhost:${port}`;
  console.log(`\n✅ API running on ${baseUrl}`);
  console.log(`📚 Swagger documentation: ${baseUrl}/api/docs`);
  console.log(`💚 Health check: ${baseUrl}/api/v1/health\n`);
}

bootstrap().catch((err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});

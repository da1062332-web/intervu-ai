import { Logger } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import helmet from "helmet";
import compression from "compression";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import {
  ZodValidationPipe,
  ResponseInterceptor,
  ResponseValidationInterceptor,
} from "@intervu/shared";
import { GlobalErrorFilter } from "./modules/platform/middleware/global-error.middleware";
import { ObservabilityInterceptor } from "./common/monitoring/observability.interceptor";
import { RedisConnectionManager } from "./cache";
import { AppConfigService } from "./config";

async function bootstrap() {
  const bootstrapLogger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule, {
    logger: ["debug", "error", "log", "warn", "verbose"],
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

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
  app.useGlobalFilters(new GlobalErrorFilter());

  // Global Interceptors
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new ResponseValidationInterceptor(reflector),
    new ObservabilityInterceptor(),
  );

  // CORS configuration
  const defaultAllowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://intervu-frontend.vercel.app",
    "https://*.vercel.app",
  ];

  const envOrigins = configService.corsAllowedOrigins;
  const allowedOrigins = Array.from(
    new Set([...defaultAllowedOrigins, ...envOrigins]),
  );

  const isOriginAllowed = (origin: string): boolean => {
    return allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      if (allowed === origin) return true;
      if (allowed.includes("*")) {
        const pattern = new RegExp(
          "^" +
            allowed
              .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
              .replace(/\\\*/g, ".*") +
            "$",
        );
        return pattern.test(origin);
      }
      return false;
    });
  };

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || configService.isDevelopment || isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        bootstrapLogger.warn(
          `Blocked CORS request from disallowed origin: ${origin}`,
        );
        callback(null, false);
      }
    },
    credentials: true,
  });

  // Swagger documentation
  const configBuilder = new DocumentBuilder()
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
    );

  if (configService.isDevelopment) {
    configBuilder.addServer(`http://localhost:${port}`, "Development");
  } else {
    configBuilder.addServer("/", "Production");
  }

  const config = configBuilder.build();

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

// Trigger restart to flush stale Prisma connections

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../apps/api/src/app.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log("App context created");
  await app.close();
}

bootstrap().catch(console.error);

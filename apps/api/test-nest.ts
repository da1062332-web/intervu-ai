import { NestFactory } from "@nestjs/core";
import { AppModule } from "./src/app.module";
import { ConfigPublisherService } from "./src/modules/admin-config/publishing/config-publisher.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const publisher = app.get(ConfigPublisherService);

  try {
    console.log("Running validateOnly...");
    const result = await publisher.validateOnly("cmqmbu6w40000mo2om5xgh07c");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("ERROR CAUGHT:", err);
  }

  await app.close();
  process.exit(0);
}
bootstrap();

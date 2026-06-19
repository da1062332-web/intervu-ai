import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { TopicSectionMappingService } from "./modules/topic-section-mapping/services/topic-section-mapping.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(TopicSectionMappingService);

  try {
    const res = await service.getMappings("cmqjdmp4w0004ps999fzfylts");
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }

  await app.close();
}
bootstrap();

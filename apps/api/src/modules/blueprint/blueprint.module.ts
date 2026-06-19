import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ConceptMappingModule } from "../concept-mapping/concept-mapping.module";
import { TemplateLibraryModule } from "../template-library/template-library.module";

import { StyleProfileController } from "./controllers/style-profile.controller";
import { BlueprintController } from "./controllers/blueprint.controller";

import { StyleProfileService } from "./services/style-profile.service";
import { BlueprintService } from "./services/blueprint.service";

import { StyleProfileRepository } from "./repositories/style-profile.repository";
import { BlueprintRepository } from "./repositories/blueprint.repository";

@Module({
  imports: [PrismaModule, ConceptMappingModule, TemplateLibraryModule],
  controllers: [StyleProfileController, BlueprintController],
  providers: [
    StyleProfileService,
    BlueprintService,
    StyleProfileRepository,
    BlueprintRepository,
  ],
  exports: [
    StyleProfileService,
    BlueprintService,
    StyleProfileRepository,
    BlueprintRepository,
  ],
})
export class BlueprintModule {}

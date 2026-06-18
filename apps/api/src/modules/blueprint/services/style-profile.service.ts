import { Injectable, OnModuleInit, NotFoundException } from "@nestjs/common";
import { StyleProfileRepository } from "../repositories/style-profile.repository";
import { CreateStyleProfileDto, UpdateStyleProfileDto } from "@intervu/shared";

@Injectable()
export class StyleProfileService implements OnModuleInit {
  constructor(private readonly repository: StyleProfileRepository) {}

  async onModuleInit() {
    await this.seedDefaultProfiles();
  }

  async seedDefaultProfiles() {
    const defaultProfiles = [
      {
        name: "Campus Placement",
        description: "Standard entry-level assessment for college placement",
        profileType: "campus" as const,
        characteristics: [
          { name: "questionLength", value: "short" },
          { name: "complexity", value: "low" },
          { name: "scenarioUsage", value: 0.1 },
          { name: "codeIntensity", value: 0.4 },
          { name: "theoryWeight", value: 60 },
          { name: "practicalWeight", value: 40 },
          { name: "difficultyBias", value: { easy: 60, medium: 30, hard: 10 } },
        ],
      },
      {
        name: "Experienced Hiring",
        description: "Lateral assessment for senior or lead engineers",
        profileType: "lateral" as const,
        characteristics: [
          { name: "questionLength", value: "long" },
          { name: "complexity", value: "high" },
          { name: "scenarioUsage", value: 0.7 },
          { name: "codeIntensity", value: 0.8 },
          { name: "theoryWeight", value: 20 },
          { name: "practicalWeight", value: 80 },
          { name: "difficultyBias", value: { easy: 20, medium: 50, hard: 30 } },
        ],
      },
      {
        name: "Leadership Hiring",
        description: "Assessment for managers, directors, or architects",
        profileType: "executive" as const,
        characteristics: [
          { name: "questionLength", value: "long" },
          { name: "complexity", value: "high" },
          { name: "scenarioUsage", value: 0.8 },
          { name: "codeIntensity", value: 0.2 },
          { name: "theoryWeight", value: 75 },
          { name: "practicalWeight", value: 25 },
          { name: "difficultyBias", value: { easy: 10, medium: 40, hard: 50 } },
        ],
      },
      {
        name: "Certification Exam",
        description: "Standardized certification testing profiles",
        profileType: "certification" as const,
        characteristics: [
          { name: "questionLength", value: "medium" },
          { name: "complexity", value: "medium" },
          { name: "scenarioUsage", value: 0.2 },
          { name: "codeIntensity", value: 0.5 },
          { name: "theoryWeight", value: 80 },
          { name: "practicalWeight", value: 20 },
          { name: "difficultyBias", value: { easy: 30, medium: 50, hard: 20 } },
        ],
      },
    ];

    for (const profile of defaultProfiles) {
      const existing = await this.repository.findByName(profile.name);
      if (!existing) {
        const { characteristics, ...data } = profile;
        await this.repository.createWithCharacteristics(data, characteristics);
        console.log(`Seeded Style Profile: ${profile.name}`);
      }
    }
  }

  async create(dto: CreateStyleProfileDto) {
    const { characteristics, ...data } = dto;
    return this.repository.createWithCharacteristics(data, characteristics);
  }

  async findAll() {
    return this.repository.findAllWithCharacteristics();
  }

  async findOne(id: string) {
    const profile = await this.repository.findByIdWithCharacteristics(id);
    if (!profile) {
      throw new NotFoundException(`Style profile with ID ${id} not found`);
    }
    return profile;
  }

  async update(id: string, dto: UpdateStyleProfileDto) {
    await this.findOne(id);
    const { characteristics, ...data } = dto;
    return this.repository.updateWithCharacteristics(id, data, characteristics);
  }
}

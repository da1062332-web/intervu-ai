import { Injectable, NotFoundException } from "@nestjs/common";
import { CandidateProfileRepository } from "../repositories/candidate-profile.repository";
import {
  CandidateProfileResponseDto,
  UpdateCandidateProfileDto,
} from "../dto/candidate-profile.dto";

@Injectable()
export class CandidateProfileService {
  constructor(private readonly profileRepository: CandidateProfileRepository) {}

  async getProfile(userId: string): Promise<CandidateProfileResponseDto> {
    const user = await this.profileRepository.findById(userId);

    if (!user) {
      throw new NotFoundException("Profile not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.fullName,
      phone: user.phone,
      college: user.college,
      graduationYear: user.graduationYear,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<CandidateProfileResponseDto> {
    const user = await this.profileRepository.findById(userId);

    if (!user) {
      throw new NotFoundException("Profile not found");
    }

    const updatedUser = await this.profileRepository.updateProfile(userId, {
      fullName: dto.name,
      email: dto.email,
      phone: dto.phone,
      college: dto.college,
      graduationYear: dto.graduationYear,
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.fullName,
      phone: updatedUser.phone,
      college: updatedUser.college,
      graduationYear: updatedUser.graduationYear,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt.toISOString(),
    };
  }
}

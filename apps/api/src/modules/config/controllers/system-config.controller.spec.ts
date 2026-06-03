import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from '../services/system-config.service';

describe('SystemConfigController', () => {
  let controller: SystemConfigController;
  let service: jest.Mocked<SystemConfigService>;

  const mockConfigDto = {
    difficultyLevels: [],
    generationRules: { defaultModel: 'gpt-4', temperature: 0.7, maxTokens: 1000, temperaturePresets: {}, retryCount: 3 },
    validationRules: { strictMode: true, maxValidationErrors: 5, allowedTypes: [], allowUnknownFields: false },
    queueSettings: { concurrency: {}, jobTimeoutMs: 30000, maxAttempts: 3, backoffDelayMs: 5000 },
    environmentFlags: { maintenanceMode: false, enableWorker: true, debugMode: false, enableCaching: true }
  };

  beforeEach(async () => {
    const mockConfigService = {
      getSystemConfig: jest.fn(),
      updateSystemConfig: jest.fn(),
      getTemplates: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemConfigController],
      providers: [
        { provide: SystemConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<SystemConfigController>(SystemConfigController);
    service = module.get(SystemConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSystemConfig', () => {
    it('should call service.getSystemConfig and return results', async () => {
      service.getSystemConfig.mockResolvedValue(mockConfigDto as never);

      const result = await controller.getSystemConfig();

      expect(service.getSystemConfig).toHaveBeenCalled();
      expect(result).toEqual(mockConfigDto);
    });
  });

  describe('updateSystemConfig', () => {
    it('should call service.updateSystemConfig with payload and return results', async () => {
      const payload = { generationRules: { defaultModel: 'claude-3-opus' } };
      const updatedMock = { ...mockConfigDto, generationRules: { ...mockConfigDto.generationRules, defaultModel: 'claude-3-opus' } };
      service.updateSystemConfig.mockResolvedValue(updatedMock as never);

      const result = await controller.updateSystemConfig(payload);

      expect(service.updateSystemConfig).toHaveBeenCalledWith(payload);
      expect(result).toEqual(updatedMock);
    });
  });

  describe('getTemplates', () => {
    it('should call service.getTemplates and return list of templates', async () => {
      const mockTemplates = [{ id: 't1', name: 'Standard Template', isSystem: true, config: {} }] as never;
      service.getTemplates.mockResolvedValue(mockTemplates);

      const result = await controller.getTemplates();

      expect(service.getTemplates).toHaveBeenCalled();
      expect(result).toEqual(mockTemplates);
    });
  });
});

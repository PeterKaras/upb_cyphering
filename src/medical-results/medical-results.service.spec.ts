import { Test, TestingModule } from '@nestjs/testing';
import { MedicalResultsService } from './medical-results.service';

describe('MedicalResultsService', () => {
  let service: MedicalResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalResultsService],
    }).compile();

    service = module.get<MedicalResultsService>(MedicalResultsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

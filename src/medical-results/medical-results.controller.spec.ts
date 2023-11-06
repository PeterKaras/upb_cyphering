import { Test, TestingModule } from '@nestjs/testing';
import { MedicalResultsController } from './medical-results.controller';

describe('MedicalResultsController', () => {
  let controller: MedicalResultsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalResultsController],
    }).compile();

    controller = module.get<MedicalResultsController>(MedicalResultsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

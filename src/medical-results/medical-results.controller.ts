import { Controller } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('medical-results')
export class MedicalResultsController {}

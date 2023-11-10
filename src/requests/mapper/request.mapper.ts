import { RequestEntity } from "../entities/request.entity";
import { GetRequestDto } from "../dto/get-request.dto";

export const mapRequestToGetRequestDto = (request: RequestEntity): GetRequestDto => {
  return {
    id: request.id,
    birthId: request.birthId,
    reason: request.reason,
    notes: request.notes,
    status: request.status,
    date: request.date,
    doctorId: request.doctorId,
  }
}

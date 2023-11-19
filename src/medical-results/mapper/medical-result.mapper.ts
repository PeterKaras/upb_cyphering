import { mapPatientToGetReducedPatientDto } from "src/patient/mapper/patient.mapper";
import { GetMedicalResultsDto } from "../dto/get-medical-results.dto";
import { mapUserToGetUserNoPublicDto } from "src/users/mapper/user.mapper";
import { MedicalResults } from "../entities/medical-results.entity";

export const mapMedicalResultToGetMedicalResultDto = (medicalResult: MedicalResults): GetMedicalResultsDto => {
    return {
        id: medicalResult.id,
        title: medicalResult.title,
        text: medicalResult.text,
        date: medicalResult.date,
        birthId: medicalResult.birthId,
    }
}
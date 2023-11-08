import { mapUserToGetUserNoPublicDto } from "src/users/mapper/user.mapper"
import { Patient } from "../entities/patient.entity"
import { User } from "src/users/entities/user.entity"
import { mapMedicalResultToGetMedicalResultDto } from "src/medical-results/mapper/medical-result.mapper"
import { MedicalResults } from "src/medical-results/entities/medical-results.entity"
import { GetPatientDto } from "../dto/get-patient.dto"
import { GetReducedPatientDto } from "../dto/get-reduced-patient.dto"

export const mapPatientToGetPatientDto = (patient: Patient): GetPatientDto => {
    return {
        firstName: patient.firstName,
        lastName: patient.lastName,
        birthId: patient.birthId,
        address: patient.address,
        diagnosis: JSON.parse(patient.diagnosis),
        allergies: JSON.parse(patient.allergies),
        doctors: patient.doctors.map((doctor: User) => mapUserToGetUserNoPublicDto(doctor)),
        medicalResults: patient.medicalResults.map((result: MedicalResults) => mapMedicalResultToGetMedicalResultDto(result)),
    }
}

export const mapPatientToGetReducedPatientDto = (patient: Patient): GetReducedPatientDto => {
  return {
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthId: patient.birthId,
      address: patient.address,
      diagnosis: JSON.parse(patient.diagnosis),
      allergies: JSON.parse(patient.allergies),
      medicalResults: patient.medicalResults.map((result: MedicalResults) => mapMedicalResultToGetMedicalResultDto(result)),
  }
}
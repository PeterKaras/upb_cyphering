import { Patient } from "src/patient/entities/patient.entity";
import { GetUserNoPublicDto } from "../dto/get-user-no-public.dto";
import { GetUserDto } from "../dto/get-user.dto";
import { User } from "../entities/user.entity";
import { mapPatientToGetPatientDto, mapPatientToGetReducedPatientDto } from "src/patient/mapper/patient.mapper";

export const mapUserToGetUserDto = (user: User): GetUserDto => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    text: user.text,
    publicKey: user.publicKey,
    patients: user.patients.map((patient: Patient) => mapPatientToGetReducedPatientDto(patient)),
  }
}

export const mapUserToGetUserNoPublicDto = (user: User): GetUserNoPublicDto => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    text: user.text,
  }
}
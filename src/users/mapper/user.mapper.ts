import { GetUserDto } from "../dto/get-user.dto";
import { User } from "../entities/user.entity";

export const mapUserToGetUserDto = (user: User): GetUserDto => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    text: user.text,
    publicKey: user.publicKey,
  }
}
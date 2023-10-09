import { UsersService } from 'src/users/users.service';

export async function initializeDatabase(app: any) {
  const usersService = app.get(UsersService);
  for(let i = 0; i < 10; i++) {
    await usersService.create({
      firstName: `firstName${i}`,
      lastName: `lastName${i}`,
      text: `text${i}`,
    });
  }
}

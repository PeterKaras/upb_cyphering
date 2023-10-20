import { UsersService } from 'src/users/users.service';
import * as fs from 'fs';
import * as path from 'path';

export async function initializeDatabase(app: any) {
  const usersService = app.get(UsersService);
  const existingData = [];
  const filePath = path.join(__dirname, '../../output.json');

  console.log("CREATE JSON FILE TO ENCRYPT/DECRYPT");
  for (let i = 0; i < 10; i++) {
    const data = {
      firstName: `firstName${i}`,
      lastName: `lastName${i}`,
      text: `text${i}`,
    };
    await usersService.create(data);

    // Append the new data to the existing data
    existingData.push(data);
  }
  // Write the updated data back to the file
  fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

  await usersService.cypher();
}

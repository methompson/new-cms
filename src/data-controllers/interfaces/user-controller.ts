import { User, UserType } from '@dataTypes';


interface UserController {
  getUserByUsername: (username: string) => Promise<User | null>
  getUserById: (userId: number) => Promise<User | null>

  addUser: (username: string, email: string, password: string, firstName: string, lastName: string, userType: UserType) => Promise<void>
  logUserIn: (username: string, password: string) => Promise<string>
}

export default UserController;
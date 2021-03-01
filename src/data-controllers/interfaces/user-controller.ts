import { User, NewUser } from '@dataTypes';


interface UserController {
  getUserByUsername: (username: string) => Promise<User | null>
  getUserById: (userId: number) => Promise<User | null>

  addUser: (user: NewUser) => Promise<User>
  logUserIn: (username: string, password: string) => Promise<string>
}

export default UserController;
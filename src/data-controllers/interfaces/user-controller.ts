import { User, UserType } from '../../data-types';


interface UserController {
  getUserByUsername: (username: string) => Promise<User> | Promise<null>
  getUserById: (userId: number) => Promise<User> | Promise<null>

  addUser: (username: string, email: string, password: string, firstName: string, lastName: string, userType: UserType) => Promise<void>
  logUserIn: (username: string, password: string) => Promise<string>
}

export default UserController;
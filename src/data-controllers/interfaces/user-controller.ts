import { User, NewUser } from '@dataTypes';


interface UserController {
  getUserByUsername: (username: string) => Promise<User | null>;
  getUserById: (userId: string) => Promise<User | null>;

  addUser: (user: NewUser) => Promise<User>;
  logUserIn: (username: string, password: string) => Promise<string>;
  editUser: (user: User) => Promise<User>;
  updatePassword: (userId: string, password: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export default UserController;
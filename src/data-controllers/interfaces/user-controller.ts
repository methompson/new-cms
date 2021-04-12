import { User, NewUser } from '@dataTypes';


interface UserController {
  getUserByUsername: (username: string) => Promise<User>;
  getUserById: (userId: string) => Promise<User>;

  addUser: (user: NewUser) => Promise<User>;
  editUser: (user: User) => Promise<User>;
  updatePassword: (userId: string, password: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  /**
   * Returns a boolean indicating if there are no users. True means that
   * there are no users in the data controller and the default users need
   * to be added
   */
  isNoUsers: () => Promise<boolean>;
}

export default UserController;
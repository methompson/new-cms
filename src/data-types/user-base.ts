import { UserTypeMap } from '@dataTypes';
import UserType from './usertype';

class UserBase {
  constructor(
    public username: string,
    public email: string,
    public firstName: string,
    public lastName: string,
    public userType: UserType,
  ) {};
}

export default UserBase;
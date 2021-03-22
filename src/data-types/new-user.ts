import { UserTypeMap } from '@dataTypes';
import UserType from './usertype';
import UserBase from './user-base';

class NewUser extends UserBase {
  constructor(
    username: string,
    email: string,
    firstName: string,
    lastName: string,
    userType: UserType,
    public password: string,
  ) {
    super(username, email, firstName, lastName, userType);
  }

  static fromJson(rawJson: any, userTypeMap: UserTypeMap): NewUser {
    const isUser = (val: any): boolean => {
      if (typeof val === 'object'
        && 'username' in val
        && typeof val.username === 'string'
        && 'email' in val
        && typeof val.email === 'string'
        && 'password' in val
        && typeof val.password === 'string'
      ) {
        return true;
      }

      return false;
    }

    if (!isUser(rawJson)) {
      throw new Error('Invalid Data');
    }

    const user = new NewUser(
      rawJson.username,
      rawJson.email ?? '',
      rawJson.firstName ?? '',
      rawJson.lastName ?? '',
      userTypeMap.getUserType(rawJson.userType),
      rawJson.password,
    );

    return user;
  }
}

export default NewUser;
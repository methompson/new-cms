import { UserTypeMap, UserType } from '@dataTypes';

class NewUser {
  constructor(
    public username: string,
    public email: string,
    public firstName: string,
    public lastName: string,
    public userType: UserType,
    public passwordHash: string,
  ) {}

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
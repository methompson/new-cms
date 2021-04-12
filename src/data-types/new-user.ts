import { UserTypeMap, UserType } from '@dataTypes';

class NewUser {
  constructor(
    public username: string,
    public email: string,
    public firstName: string,
    public lastName: string,
    public userType: UserType,
    public passwordHash: string,
    public userMeta: {[key: string]: any},
    public enabled: boolean,
  ) {}

  static fromJson(rawJson: any, userTypeMap: UserTypeMap): NewUser {
    const isUser = (val: any): boolean => {
      if ( typeof val?.username === 'string'
        && typeof val?.email === 'string'
        && typeof val?.password === 'string'
      ) {
        return true;
      }

      return false;
    }

    if (!isUser(rawJson)) {
      throw new Error('Invalid Data');
    }

    const userMeta = typeof rawJson.userMeta === 'object' ? rawJson.userMeta : {};
    const enabled = typeof rawJson.enabled === 'boolean' ? rawJson.enabled : true;

    const user = new NewUser(
      rawJson.username,
      rawJson.email,
      rawJson.firstName ?? '',
      rawJson.lastName ?? '',
      userTypeMap.getUserType(rawJson.userType),
      rawJson.password,
      userMeta,
      enabled,
    );

    return user;
  }
}

export default NewUser;
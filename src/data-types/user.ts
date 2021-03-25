import UserTypeMap from './usertype-map';
import NewUser from './new-user';
import UserType from './usertype';

class User extends NewUser {
  constructor(
    public id: string,
    username: string,
    email: string,
    firstName: string,
    lastName: string,
    userType: UserType,
    passwordHash: string,
  ) {
    super(username, email, firstName, lastName, userType, passwordHash);
  }

  static fromJson(rawJson: any, userTypeMap: UserTypeMap): User {
    const isUser = (val: any): boolean => {
      if (typeof val === 'object'
        && 'username' in val
        && typeof val.username === 'string'
        && 'email' in val
        && typeof val.email === 'string'
        && 'userType' in val
        && typeof val.userType === 'string'
        && 'passwordHash' in val
        && typeof val.passwordHash === 'string'
        && 'id' in val
        && typeof val.id === 'string'
      ) {
        return true;
      }

      return false;
    }

    if (!isUser(rawJson)) {
      throw new Error('Invalid Data');
    }

    const user = new User(
      rawJson.id,
      rawJson.username,
      rawJson.email,
      rawJson.firstName ?? '',
      rawJson.lastName ?? '',
      userTypeMap.getUserType(rawJson.userType),
      rawJson.passwordHash,
    );

    return user;
  }
}

export default User;
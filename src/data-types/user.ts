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
      if (typeof val?.username === 'string'
        && typeof val?.email === 'string'
        && typeof val?.userType === 'string'
        && typeof val?.passwordHash === 'string'
        && typeof val?.id === 'string'
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
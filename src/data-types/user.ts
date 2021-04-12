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
    userMeta: {[key: string]: any},
    enabled: boolean,
    public passwordResetToken: string,
    public passwordResetDate: number,
    public dateAdded: number,
    public dateUpdated: number,
  ) {
    super(
      username,
      email,
      firstName,
      lastName,
      userType,
      passwordHash,
      userMeta,
      enabled,
    );
  }

  static fromJson(rawJson: any, userTypeMap: UserTypeMap): User {
    const isUser = (val: any): boolean => {
      if (typeof val?.username === 'string'
        && typeof val?.email === 'string'
        && typeof val?.userType === 'string'
        && typeof val?.passwordHash === 'string'
        && typeof val?.id === 'string'
        && typeof val?.passwordResetToken === 'string'
        && (
          typeof val?.passwordResetDate === 'number'
          || val?.passwordResetDate instanceof Date)
        && typeof val?.userMeta === 'object'
        && (typeof val?.dateAdded === 'number' || val?.dateAdded instanceof Date)
        && (typeof val?.dateUpdated === 'number' || val?.dateUpdated instanceof Date)
        && typeof val?.enabled === 'boolean'
      ) {
        return true;
      }

      return false;
    }

    if (!isUser(rawJson)) {
      throw new Error('Invalid Data');
    }

    const passwordResetDate = rawJson.passwordResetDate instanceof Date ? rawJson.passwordResetDate.getTime() : rawJson.passwordResetDate;
    const dateAdded = rawJson.dateAdded instanceof Date ? rawJson.dateAdded.getTime() : rawJson.dateAdded;
    const dateUpdated = rawJson.dateUpdated instanceof Date ? rawJson.dateUpdated.getTime() : rawJson.dateUpdated;

    const user = new User(
      rawJson.id,
      rawJson.username,
      rawJson.email,
      rawJson.firstName ?? '',
      rawJson.lastName ?? '',
      userTypeMap.getUserType(rawJson.userType),
      rawJson.passwordHash,
      rawJson.userMeta,
      rawJson.enabled,
      rawJson.passwordResetToken,
      passwordResetDate,
      dateAdded,
      dateUpdated,
    );

    return user;
  }
}

export default User;
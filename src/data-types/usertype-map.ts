import UserType from './usertype';
import UserMap from './user-map';

import defaultUserTypes from './default-user-types';

class UserTypeMap {
  private userMap: UserMap;

  constructor() {
    this.userMap = {
      ...defaultUserTypes,
    };
  }

  get userTypes(): UserMap {
    return this.userMap;
  }

  get noneUser(): UserType {
    return new UserType('none', 0);
  }

  getUserType(type: string) {
    if (Object.keys(this.userMap).includes(type) ) {
      return this.userMap[type];
    } else {
      return this.noneUser;
    }
  }

  /**
   * This method will add a UserMap to the existing usermap.
   * This method enforces the default userTypes, so that we don't override the
   * Admin or SuperAdmin users.
   *
   * @param map A UserMap to be added to the existing user map.
   */
  addUserTypes(map: UserMap) {
    this.userMap = {
      ...this.userMap,
      ...map,
      ...defaultUserTypes,
    };
  }

  /**
   * This allows a user to add a single user type. I don't know if adding individual
   * users or a group is preferrable, but currently, this method just uses the
   * addUserTypes method as a shortcut.
   *
   * @param type A single usertype
   */
  addUserType(type: UserType) {
    const map: UserMap = {};
    map[type.name] = type;

    this.addUserTypes(map);
  }
}

export default UserTypeMap;
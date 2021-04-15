import { open, writeFile, mkdir } from 'fs/promises';
import * as path from 'path';

import { UserController } from '@root/data-controllers/interfaces';
import BasicDataControllerBase from './basic-controller-base';
import {
  UserExistsException,
  InvalidUsernameException,
  EmailExistsException,
  InvalidUserIdException,
  UserDoesNotExistException,
} from '@root/exceptions/user-exceptions';
import {
  User,
  NewUser,
} from '@dataTypes';


class BasicUserController extends BasicDataControllerBase implements UserController {
  protected _userFileName = 'users.json';
  protected _userWriteLock: boolean = false;
  protected _userWriteAgain: boolean = false;

  protected _users: {[key: number]: User} = {};

  constructor(dataLocation: string) {
    super();
    this.dataLocation = dataLocation;
  }

  get users() {
    return this._users;
  }

  protected getUserByEmail(email: string) {
    for (const user of Object.values(this._users)) {
      if (user.email === email) {
        return user;
      }
    }

    return null;
  }

  async getUserByUsername(username: string): Promise<User> {
    for (const user of Object.values(this._users)) {
      if (user.username === username) {
        return user;
      }
    }

    throw new InvalidUsernameException();
  }

  async getUserById(userId: string): Promise<User> {
    const id = parseInt(userId, 10);

    if (Number.isNaN(id)) {
      throw new InvalidUserIdException();
    }

    const user = this._users[userId];

    if (typeof(user) === 'undefined') {
      throw new InvalidUserIdException();
    }

    return user;
  }

  async addUser(user: NewUser): Promise<User> {
    if (this.containsUser(user.username, user.email)) {
      throw new UserExistsException();
    }

    const id = this.getNextUserId();

    const now = Date.now();

    const u = new User(
      `${id}`,
      user.username,
      user.email,
      user.firstName,
      user.lastName,
      user.userType,
      user.passwordHash,
      user.userMeta,
      user.enabled,
      '',
      now,
      now,
      now,
    );

    this._users[id] = u;

    // We don't need to await this.
    this.writeUserData();

    return u;
  }

  async editUser(user: User): Promise<User> {
    if (!(user.id in this._users)) {
      throw new UserDoesNotExistException();
    }

    // Check if username or email already exist
    const emailUser = this.getUserByEmail(user.email);

    if (emailUser !== null && emailUser?.id !== user.id) {
      throw new EmailExistsException();
    }

    const usernameUser = await this.getUserByUsername(user.username);

    if (usernameUser !== null && usernameUser?.id !== user.id) {
      throw new UserExistsException();
    }

    this._users[user.id] = user;

    this.writeUserData();

    return user;
  }

  async makePasswordResetToken(userId: string, token: string): Promise<void> {
    const user = this._users[userId];

    if (user === null || typeof user === 'undefined') {
      throw new UserDoesNotExistException();
    }

    user.passwordResetToken = token;
    user.passwordResetDate = Date.now();
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = this._users[userId];

    if (user === null || typeof user === 'undefined') {
      throw new UserDoesNotExistException();
    }

    user.hashPassword = newPassword;

    return;
  }

  async deleteUser(id: string): Promise<void> {
    if (!(id in this._users)) {
      throw new Error('User Does Not Exist');
    }

    delete this._users[id];

    this.writeUserData();
  }

  /**
   * Returns a boolean indicating whether the user list has any users. If there
   * are no users, this function returns true. It returns false otherwise.
   *
   * @returns Promises<boolean>
   */
  async isNoUsers(): Promise<boolean> {
    return Object.keys(this._users).length === 0;
  }

  protected containsUser(username: string, email: string): boolean {
    for (const user of Object.values(this._users)) {
      if (user.username === username || user.email === email) {
        return true;
      }
    }

    return false;
  }

  protected getNextUserId(): number {
    let largestId = 0;

    Object.keys(this._users).forEach((idString) => {
      const id = parseInt(idString, 10);
      if (id > largestId) {
        largestId = id;
      }
    });

    return largestId > 0 ? largestId + 1 : 1;
  }

  // TODO create a lock and queue to prevent bad things from happening.
  protected async writeUserData(): Promise<void> {
    if (this._userWriteLock === true) {
      console.log("user writelock hit");
      this._userWriteAgain = true;
      return;
    }

    this._userWriteLock = true;

    const userObj: any = {};
    Object.keys(this._users).forEach((key) => {
      const user = this._users[key];
      userObj[key] = {
        ...user,
        userType: user.userType.name,
      };
    });

    const loc = path.join(this.dataLocation, this._userFileName);
    const handle = await open(loc, 'w+');
    await writeFile(handle, JSON.stringify(userObj));

    await handle.close();
    this._userWriteLock = false;

    if (this._userWriteAgain === true) {
      console.log("write user again");
      this._userWriteAgain = false;
      this.writeUserData();
    }
  }

  /**
   * This method will read the data from the user file using the user data handle.
   * It will parse the contents of the file and insert the value into the _users variable.
   */
   protected async readUserData(): Promise<void> {
    await mkdir(this.dataLocation, { recursive: true });

    // We have to use a+ to create the file if it doesn't exist.
    // r will throw an exception if the file doesn't exist.
    // w+ will truncate the file if it already exists.
    const loc = path.join(this.dataLocation, this._userFileName);
    const handle = await open(loc, 'a+');
    const userDataString = await handle.readFile('utf-8');

    handle.close();

    const rawUserData = JSON.parse(userDataString);

    if (typeof rawUserData !== 'object') {
      throw new Error('Invalid JSON format');
    }

    const userData: {[key: string]: User} = {};

    Object.keys(rawUserData).forEach((key) => {
      const rawUser = rawUserData[key];
      try {
        const user = User.fromJson(rawUser, this.cmsContext.userTypeMap);
        userData[user.id] = user;
      } catch(e) {
        // Do nothing
      }
    });

    // const userData = this.parseUserData(rawUserData);

    this._users = userData;
  }
}

export default BasicUserController;
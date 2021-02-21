import * as jwt from 'jsonwebtoken';

import { DataController } from './interfaces';
import { InvalidPasswordException, UserExistsException, InvalidUsernameException } from '@root/exceptions/user-exceptions';
import { BlogPost, User, UserToken, UserType, CMSContext } from '@dataTypes';

class BasicDataController implements DataController {
  private _blogPosts: {[key: number]: BlogPost } = {};
  private _users: {[key: number]: User} = {};
  cmsContext: CMSContext;

  get blogPosts() {
    return this._blogPosts;
  }

  get users() {
    return this._users;
  }

  async init(cmsContext: CMSContext) {
    this.cmsContext = cmsContext;

    this._users[1] = {
      id: '1',
      username: 'admin',
      email: 'admin@admin.admin',
      firstName: 'admin',
      lastName: 'admin',
      userType: this.cmsContext.userTypeMap.getUserType('SuperAdmin'),
      passwordHash: 'password',
    };

    return;
  }

  async getBlogPostBySlug(slug: string) {
    return null;
  }

  async getBlogPostById(id: number) {
    return null;
  }

  async getUserByUsername(username: string) {
    for (const user of Object.values(this._users)) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  async getUserById(userId: number) {
    const user = this._users[userId];

    if (typeof(user) === 'undefined') {
      return null;
    }

    return user;
  }

  async addUser(username: string, email: string, password: string, firstName: string, lastName: string, userType: UserType) {
    if (this.containsUser(username)) {
      throw new UserExistsException();
    }

    const id = this.getNextUserId();

    this._users[id] = {
      id: `$id`,
      username,
      email,
      firstName,
      lastName,
      passwordHash: password,
      userType,
    };
  }

  async logUserIn(username: string, password: string): Promise<string> {
    const user = await this.getUserByUsername(username);

    if (user == null) {
      throw new InvalidUsernameException();
    }

    if (password !== user.passwordHash) {
      throw new InvalidPasswordException();
    }

    const secret = process.env.jwt_secret ?? 'default_secret';

    console.log('login secret', secret);

    const claims: UserToken = {
      username: user.username,
      userType: user.userType.name,
      userId: user.id,
    };

    return jwt.sign(
      claims,
      secret,
      {
        algorithm: 'HS256',
        expiresIn: '12h',
      },
    );
  }

  private containsUser(username: string): boolean {
    for (const user of Object.values(this._users)) {
      if (user.username === username) {
        return true;
      }
    }

    return false;
  }

  private getNextUserId(): number {
    let largestId = 0;

    Object.keys(this._users).forEach((idString) => {
      const id = parseInt(idString, 10);
      if (id > largestId) {
        largestId = id;
      }
    });

    return largestId > 0 ? largestId + 1 : 1;
  }
}

export default BasicDataController;
import * as jwt from 'jsonwebtoken';

import { DataController } from './interfaces';
import { BlogPost, User, UserType } from '../data-types';
import { PasswordInvalidException, UserExistsException, UsernameInvalidException } from '../exceptions/user-exceptions';

class BasicDataController implements DataController {
  private _blogPosts: {[key: number]: BlogPost } = {};
  private _users: {[key: number]: User} = {};

  get blogPosts() {
    return this._blogPosts;
  }

  get users() {
    return this._users;
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
    // tslint:disable-next-line:prefer-const
    let undef;
    const user = this._users[userId];

    if (typeof(user) === typeof(undef)) {
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
      username,
      email,
      firstName,
      lastName,
      passwordHash: password,
      userType,
    };
  }

  async logUserIn(username: string, password: string) {
    const user = await this.getUserByUsername(username);

    if (user == null) {
      throw new UsernameInvalidException();
    }

    if (password !== user.passwordHash) {
      throw new PasswordInvalidException();
    }

    const secret = process.env.jwt_secret ?? 'default_secret';

    return jwt.sign({username: user.username}, secret, { algorithm: 'HS256' });
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
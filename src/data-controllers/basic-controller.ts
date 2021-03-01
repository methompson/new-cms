import * as jwt from 'jsonwebtoken';

import { DataController } from './interfaces';
import { InvalidPasswordException, UserExistsException, InvalidUsernameException } from '@root/exceptions/user-exceptions';
import { BlogPost, User, UserToken, UserType, CMSContext, NewUser, NewBlogPost } from '@dataTypes';
import { BlogDoesNotExistException } from '@root/exceptions/blog-exceptions';

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

    this._users[2] = {
      id: '1',
      username: 'writer',
      email: 'writer@admin.admin',
      firstName: 'writer',
      lastName: 'writer',
      userType: this.cmsContext.userTypeMap.getUserType('Writer'),
      passwordHash: 'password',
    };

    return;
  }

  async getBlogPostBySlug(slug: string) {
    for (const index in this.blogPosts) {
      const post = this.blogPosts[index];
      if (slug === post.titleSlug) {
        return post;
      }
    }

    return null;
  }

  async getBlogPostById(id: string) {
    if (!this.blogPostExists(id)) {
      throw new BlogDoesNotExistException();
    }

    const idInt = parseInt(id, 10);
    return this.blogPosts[idInt];
  }

  async addBlogPost(blogPost: NewBlogPost) {
    const id = this.getNextBlogId();

    const newBlogPost: BlogPost = {
      ...blogPost,
      id: `${id}`,
    };

    this._blogPosts[id] = newBlogPost;

    return newBlogPost;
  }

  async editBlogPost(blogPost: BlogPost) {
    if (!this.blogPostExists(blogPost.id)) {
      throw new BlogDoesNotExistException();
    }

    const id = parseInt(blogPost.id, 10);
    this._blogPosts[id] = blogPost;

    return blogPost;
  }

  async deleteBlogPost(id: string) {
    if (!this.blogPostExists(id)) {
      throw new BlogDoesNotExistException();
    }

    const idInt = parseInt(id, 10);
    delete this._blogPosts[idInt];
  }

  blogPostExists(id: string): boolean {
    return Object.keys(this._blogPosts).includes(id);
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

  async addUser(user: NewUser) {
    if (this.containsUser(user.username, user.email)) {
      throw new UserExistsException();
    }

    const id = this.getNextUserId();

    this._users[id] = {
      id: `${id}`,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.passwordHash,
      userType: user.userType,
    };

    const u: User = {
      ...user,
      id: `${id}`,
    };

    return u;
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

  private containsUser(username: string, email: string): boolean {
    for (const user of Object.values(this._users)) {
      if (user.username === username || user.email === email) {
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

  private getNextBlogId(): number {
    let largestId = 0;

    Object.keys(this._blogPosts).forEach((idString) => {
      const id = parseInt(idString, 10);
      if (id > largestId) {
        largestId = id;
      }
    });

    return largestId > 0 ? largestId + 1 : 1;
  }
}

export default BasicDataController;
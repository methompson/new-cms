import { open, writeFile, mkdir } from 'fs/promises';
import * as path from 'path';

import { DataController } from '@root/data-controllers/interfaces';
import { InvalidPasswordException, UserExistsException, InvalidUsernameException, EmailExistsException } from '@root/exceptions/user-exceptions';
import { BlogPost, User, UserToken, CMSContext, NewUser, NewBlogPost } from '@dataTypes';
import { BlogDoesNotExistException } from '@root/exceptions/blog-exceptions';

class BasicDataController implements DataController {
  private _blogPosts: {[key: number]: BlogPost } = {};
  private _users: {[key: number]: User} = {};
  cmsContext: CMSContext;

  initialized = false;
  private _dataLocation: string;
  private _userWriteLock: boolean = false;
  private _userWriteAgain: boolean = false;

  private _constructionOptions: any;

  get blogPosts() {
    return this._blogPosts;
  }

  get users() {
    return this._users;
  }

  set dataLocation(loc: string) {
    this._dataLocation = loc;
  }

  get dataLocation(): string {
    const output = this._dataLocation ?? './';

    return output;
  }

  constructor(options?: any) {
    this._constructionOptions = options ?? {};
  }

  async init(cmsContext: CMSContext) {
    this.cmsContext = cmsContext;

    this._dataLocation = this._constructionOptions?.dataLocation ?? './';

    try {
      await this.readUserData();
    } catch(e) {
      console.log('Read error');
    }

    this.initialized = true;

    return;
  }

  private getUserByEmail(email: string) {
    for (const user of Object.values(this._users)) {
      if (user.email === email) {
        return user;
      }
    }

    return null;
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

  async getUserById(userId: string) {
    const id = parseInt(userId, 10);

    if (Number.isNaN(id)) {
      return null;
    }
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

    const u = new User(
      `${id}`,
      user.username,
      user.email,
      user.firstName,
      user.lastName,
      user.userType,
      user.passwordHash,
    );

    this._users[id] = u;

    // We don't need to await this.
    this.writeUserData();

    return u;
  }

  async editUser(user: User): Promise<User> {

    if (!(user.id in this._users)) {
      throw new Error('User Does Not Exist');
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

  async updatePassword(userId: string, password: string) {
    return;
  }

  async deleteUser(id: string) {
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

  // TODO create a lock and queue to prevent bad things from happening.
  private async writeUserData(): Promise<void> {
    if (this._userWriteLock === true) {
      console.log("writelock hit");
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

    const loc = path.join(this.dataLocation, 'users.json');
    const handle = await open(loc, 'w+');
    await writeFile(handle, JSON.stringify(userObj));

    await handle.close();
    this._userWriteLock = false;

    if (this._userWriteAgain === true) {
      console.log("write again");
      this._userWriteAgain = false;
      this.writeUserData();
    }
  }

  // TODO Where do I put the users file?
  private async writeBlogData(): Promise<void> {
    const loc = path.join(this.dataLocation, 'blog-posts.json');
    const handle = await open(loc, 'w+');
    await writeFile(handle, JSON.stringify(this._users));

    handle.close();
  }

  /**
   * This method will read the data from the user file using the user data handle.
   * It will parse the contents of the file and insert the value into the _users variable.
   */
  private async readUserData(): Promise<void> {

    await mkdir(this.dataLocation, { recursive: true });

    // We have to use a+ to create the file if it doesn't exist.
    // r will throw an exception if the file doesn't exist.
    // w+ will truncate the file if it already exists.
    const loc = path.join(this.dataLocation, 'users.json');
    const handle = await open(loc, 'a+');
    const userDataString = await handle.readFile('utf-8');

    handle.close();

    const rawUserData = JSON.parse(userDataString);

    const userData: {[key: number]: User} = {};

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

export default BasicDataController;
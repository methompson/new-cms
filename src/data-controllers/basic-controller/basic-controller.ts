import { open, writeFile, mkdir } from 'fs/promises';
import * as path from 'path';

import { DataController } from '@root/data-controllers/interfaces';
import {
  UserExistsException,
  InvalidUsernameException,
  EmailExistsException,
  InvalidUserIdException
} from '@root/exceptions/user-exceptions';
import {
  BlogPost,
  User,
  CMSContext,
  NewUser,
  NewBlogPost
} from '@dataTypes';
import {
  BlogDoesNotExistException,
  BlogSlugExistsException,
  BlogAlreadyExistsException
} from '@root/exceptions/blog-exceptions';

class BasicDataController implements DataController {
  private _blogPosts: {[key: string]: BlogPost } = {};

  private _users: {[key: number]: User} = {};
  cmsContext: CMSContext;

  initialized = false;
  private _dataLocation: string;

  private _userFileName = 'users.json';
  private _blogFileName = 'blog.json';

  private _userWriteLock: boolean = false;
  private _userWriteAgain: boolean = false;

  private _blogWriiteLock: boolean = false;
  private _blogWriteAgain: boolean = false;

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

  get slugMap():{[key: string]: BlogPost} {
    const slugMap: {[key: string]: BlogPost} = {};

    Object.keys(this._blogPosts).forEach((key) => {
      const post = this._blogPosts[key];
      slugMap[post.titleSlug] = post;
    });

    return slugMap;
  }

  constructor(options?: any) {
    this._constructionOptions = options ?? {};
  }

  async init(cmsContext: CMSContext) {
    this.cmsContext = cmsContext;

    this._dataLocation = this._constructionOptions?.dataLocation ?? './';

    try {
      await this.readUserData();
      await this.readBlogData();
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

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    for (const index in this.blogPosts) {
      const post = this.blogPosts[index];
      if (slug === post.titleSlug) {
        return post;
      }
    }

    return null;
  }

  async getBlogPostById(id: string): Promise<BlogPost | null> {
    const post = this.blogPosts[id];

    return post ?? null;
  }

  async addBlogPost(blogPost: NewBlogPost): Promise<BlogPost> {
    if (this.blogSlugExists(blogPost.titleSlug)) {
      throw new BlogSlugExistsException();
    }

    const id = this.getNextBlogId();

    const newBlogPost: BlogPost = {
      ...blogPost,
      id,
    };

    this.saveBlogPost(newBlogPost);

    return newBlogPost;
  }

  async editBlogPost(editedBlogPost: BlogPost): Promise<BlogPost> {
    const post = this._blogPosts[editedBlogPost.id];

    if (typeof post === 'undefined') {
      throw new BlogDoesNotExistException();
    }

    const slugMap = this.slugMap;
    const postFromSlug = slugMap[editedBlogPost.titleSlug];

    // If the post from the slug exist (i.e. not undefined) and the IDs don't
    // match, that means another post already has the slug, which must be unique.
    if (typeof postFromSlug?.id !== 'undefined' && postFromSlug?.id !== editedBlogPost.id) {
      throw new BlogAlreadyExistsException();
    }

    this.saveBlogPost(editedBlogPost);

    return editedBlogPost;
  }

  async deleteBlogPost(id: string) {
    if (this.blogPostDoesNotExists(id)) {
      throw new BlogDoesNotExistException();
    }

    const idInt = parseInt(id, 10);
    const post = this._blogPosts[idInt];

    delete this._blogPosts[idInt];

    this.writeBlogData();
  }

  // Saves the post and writes it to a file
  saveBlogPost(blogPost: BlogPost) {
    this._blogPosts[blogPost.id] = blogPost;

    this.writeBlogData();
  }

  blogPostDoesNotExists(id: string): boolean {
    const idInt = parseInt(id, 10);
    const post = this._blogPosts[idInt];

    return typeof post === 'undefined';
  }

  blogSlugExists(slug: string): boolean {
    const post = this.slugMap[slug];

    return typeof post !== 'undefined';
  }

  async getUserByUsername(username: string) {
    for (const user of Object.values(this._users)) {
      if (user.username === username) {
        return user;
      }
    }

    throw new InvalidUsernameException();
  }

  async getUserById(userId: string) {
    const id = parseInt(userId, 10);

    if (Number.isNaN(id)) {
      throw new InvalidUserIdException()
    }

    const user = this._users[userId];

    if (typeof(user) === 'undefined') {
      throw new InvalidUserIdException()
    }

    return user;
  }

  async addUser(user: NewUser) {
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

  async editUser(user: User) {
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

  private getNextBlogId(): string {
    let largestId = 0;

    Object.keys(this._blogPosts).forEach((idString) => {
      const id = parseInt(idString, 10);
      if (id > largestId) {
        largestId = id;
      }
    });

    const newId = largestId > 0 ? largestId + 1 : 1;

    return `${newId}`;
  }

  // TODO create a lock and queue to prevent bad things from happening.
  private async writeUserData(): Promise<void> {
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

  // TODO Where do I put the users file?
  private async writeBlogData(): Promise<void> {
    if (this._blogWriiteLock === true) {
      console.log("blog writelock hit");
      this._blogWriteAgain = true;
      return;
    }

    this._blogWriiteLock = true;

    const loc = path.join(this.dataLocation, this._blogFileName);
    const handle = await open(loc, 'w+');
    await writeFile(handle, JSON.stringify(this._blogPosts));

    await handle.close();
    this._blogWriiteLock = false;

    if (this._blogWriteAgain === true) {
      console.log("write blog again");
      this._blogWriteAgain = false;
      this.writeBlogData();
    }
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

  private async readBlogData(): Promise<void> {
    await mkdir(this.dataLocation, { recursive: true });

    // We have to use a+ to create the file if it doesn't exist.
    // r will throw an exception if the file doesn't exist.
    // w+ will truncate the file if it already exists.
    const loc = path.join(this.dataLocation, this._blogFileName);
    const handle = await open(loc, 'a+');
    const blogDataString = await handle.readFile('utf-8');

    handle.close();

    const rawBlogData = JSON.parse(blogDataString);

    if (typeof rawBlogData !== 'object') {
      throw new Error('Invalid JSON format');
    }

    const blogPosts: {[key: string]: BlogPost} = {};

    Object.keys(rawBlogData).forEach((key) => {
      const rawBlog = rawBlogData[key];
      try {
        const blog = BlogPost.fromJson(rawBlog);
        blogPosts[blog.id] = blog;
      } catch(e) {
        // Do nothing
      }
    });

    this._blogPosts = blogPosts;
  }
}

export default BasicDataController;
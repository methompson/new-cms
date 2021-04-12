import { Pool, createPool, ResultSetHeader } from 'mysql2';
// import * as mysql from 'mysql2';

import migrations from './db-migrations';
import {
  BlogPost,
  NewBlogPost,
  CMSContext,
  NewUser,
  User,
} from "@dataTypes";
import { DataController } from "../interfaces";
import {
  InvalidDataControllerConfigException,
  UnimplementedMethodException
} from '@root/exceptions/cms-exceptions';
import { InvalidResultException } from '@root/exceptions/data-controller-exceptions';
import {
  InvalidUserIdException,
  UserDoesNotExistException,
} from '@root/exceptions/user-exceptions';

class MySQLDataController implements DataController {
  initialized: boolean = false;
  cmsContext: CMSContext;
  private dbConnectionPool: Pool;

  private _constructionOptions: any;

  constructor(options?: any) {
    this._constructionOptions = options ?? {};
  }

  async init(cmsContext: CMSContext): Promise<void> {
    this.cmsContext = cmsContext;

    const host = this._constructionOptions.host;
    const dbName = this._constructionOptions.dbName;
    const user = this._constructionOptions.user;
    const password = this._constructionOptions.password;
    const port = this._constructionOptions.port;

    if (typeof host !== 'string' || typeof dbName !== 'string' || typeof user !== 'string'|| typeof password !== 'string' || typeof port !== 'number') {
      throw new InvalidDataControllerConfigException();
    }

    this.dbConnectionPool = createPool({
      host,
      database: dbName,
      user,
      password,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });


    for (const m of migrations) {
      await m.doMigration(this.dbConnectionPool);
      console.log('Done');
    }

    this.initialized = true;
  }

  async getUserByUsername(username: string): Promise<User> {
    const query = `
      SELECT
        id,
        username,
        email,
        firstName,
        lastName,
        userType,
        password,
        userMeta,
        enabled,
        passwordResetToken,
        passwordResetDate,
        dateAdded,
        dateUpdated
      FROM users
      WHERE username = ?
    `;

    const queryParams = [username];

    const promisePool = this.dbConnectionPool.promise();

    const [results] = await promisePool.execute(query, queryParams);

    if (!Array.isArray(results) || results.length === 0) {
      throw new UserDoesNotExistException();
    }

    const u = results[0] as any;

    const user = User.fromJson({
      id: `${u.id}`,
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      userType: u.userType,
      passwordHash: u.password,
      userMeta: u.userMeta,
      enabled: u.enabled === 1,
      passwordResetToken: u.passwordResetToken,
      passwordResetDate: u.passwordResetDate,
      dateAdded: u.dateAdded,
      dateUpdated: u.dateUpdated,
    }, this.cmsContext.userTypeMap);

    return user;
  }

  async getUserById(userId: string): Promise<User> {
    const id = parseInt(userId, 10);

    if (Number.isNaN(id)) {
      throw new InvalidUserIdException()
    }

    const query = `
      SELECT
        id,
        username,
        email,
        firstName,
        lastName,
        userType,
        password,
        userMeta,
        enabled,
        passwordResetToken,
        passwordResetDate,
        dateAdded,
        dateUpdated
      FROM users
      WHERE id = ?
    `;

    const queryParams = [id];

    const promisePool = this.dbConnectionPool.promise();

    const [results] = await promisePool.execute(query, queryParams);

    if (!Array.isArray(results) || results.length === 0) {
      throw new UserDoesNotExistException();
    }

    const u = results[0] as any;

    const user = User.fromJson({
      id: `${u.id}`,
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      userType: u.userType,
      passwordHash: u.password,
      userMeta: u.userMeta,
      enabled: u.enabled === 1,
      passwordResetToken: u.passwordResetToken,
      passwordResetDate: u.passwordResetDate,
      dateAdded: u.dateAdded,
      dateUpdated: u.dateUpdated,
    }, this.cmsContext.userTypeMap);

    return user;
  }

  async addUser(newUser: NewUser): Promise<User> {
    const query = `
      INSERT INTO users (
        firstName,
        lastName,
        username,
        email,
        userType,
        password,
        userMeta,
        enabled
      )
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;

    const queryParams = [
      newUser.firstName,
      newUser.lastName,
      newUser.username,
      newUser.email,
      newUser.userType.toString(),
      newUser.passwordHash,
      newUser.userMeta,
      newUser.enabled,
    ];

    console.log('Getting promise Pool');
    const promisePool = this.dbConnectionPool.promise();

    console.log('executing');

    const [results] = await promisePool.execute(query, queryParams);
    console.log('executed');

    if (!this.isResult(results)) {
      throw new InvalidResultException();
    }

    if (results.affectedRows === 0) {
      throw new InvalidResultException();
    }

    console.log('Exceptions done');

    const id = results.insertId;

    console.log('getting user by id');
    const user = await this.getUserById(id.toString());
    console.log('got user by id');

    return user;
  }

  isResult(result: ResultSetHeader | any): result is ResultSetHeader {
    const rAsR = result as ResultSetHeader;

    return rAsR?.affectedRows !== undefined
      && rAsR?.insertId !== undefined;
  }

  async editUser(user: User): Promise<User> {
    throw new UnimplementedMethodException();
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    throw new UnimplementedMethodException();
  }

  async deleteUser(id: string): Promise<void> {
    throw new UnimplementedMethodException();
  }

  async isNoUsers(): Promise<boolean> {
    const query = `SELECT id FROM users`;
    const poolPromise = this.dbConnectionPool.promise();

    const [results] = await poolPromise.execute(query);

    if (Array.isArray(results) && results.length > 0) {
      return false;
    }

    return true;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    throw new UnimplementedMethodException();
  }

  async getBlogPostById(id: string): Promise<BlogPost | null> {
    throw new UnimplementedMethodException();
  }

  async addBlogPost(blogPost: NewBlogPost): Promise<BlogPost> {
    throw new UnimplementedMethodException();
  }

  async editBlogPost(blogPost: BlogPost): Promise<BlogPost> {
    throw new UnimplementedMethodException();
  }

  async deleteBlogPost(id: string): Promise<void> {
    throw new UnimplementedMethodException();
  }

}

export default MySQLDataController;
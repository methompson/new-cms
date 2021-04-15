import { Pool, createPool, ResultSetHeader } from 'mysql2';
// import * as mysql from 'mysql2';

import migrations from './db-migrations';
import {
  BlogPost,
  NewBlogPost,
  CMSContext,
  NewUser,
  User,
  NewPage,
  Page,
} from "@dataTypes";
import { DataController } from "../interfaces";
import {
  InvalidDataControllerConfigException,
  UnimplementedMethodException,
} from '@root/exceptions/cms-exceptions';
import { InvalidResultException } from '@root/exceptions/data-controller-exceptions';
import {
  EmailExistsException,
  InvalidUserIdException,
  UserDoesNotExistException,
  UserExistsException,
  InvalidPasswordTokenException,
} from '@root/exceptions/user-exceptions';
import MySQLUserController from './mysql-user-controller';
import MySQLBlogController from './mysql-blog-controller';
import MySQLPageController from './mysql-page.controller';

class MySQLDataController extends DataController {
  private _constructionOptions: any;
  private dbConnectionPool: Pool;

  constructor(options?: any) {
    super();
    this._constructionOptions = options ?? {};
  }

  async init(cmsContext: CMSContext) {
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

    this._userController = new MySQLUserController(this.dbConnectionPool, cmsContext, this._constructionOptions);
    this._blogController = new MySQLBlogController(this.dbConnectionPool, cmsContext, this._constructionOptions);
    this._pageController = new MySQLPageController(this.dbConnectionPool, cmsContext, this._constructionOptions);
  }
}

export default MySQLDataController;
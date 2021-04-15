import { Pool, createPool, ResultSetHeader } from 'mysql2';
// import * as mysql from 'mysql2';

import MySQLDataControllerBase from './myqsl-controller-base';

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
import { DataController, PageController } from "../interfaces";
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

class MySQLPageController extends MySQLDataControllerBase implements PageController {
  async getPageBySlug(slug: string): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async getPageById(id: string): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async addPage(page: NewPage): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async editPage(page: Page): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async deletePage(id: string): Promise<void> {
    throw new UnimplementedMethodException();
  }

}

export default MySQLPageController;
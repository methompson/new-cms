import { Pool, createPool, ResultSetHeader } from 'mysql2';

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
import { SlugExistsException } from '@root/exceptions/page-exceptions';
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
    const query = `
      INSERT INTO pages (
        title,
        titleSlug,
        published,
        content,
        meta,
        authorId,
        lastUpdatedBy,
        dateAdded,
        dateUpdated
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;

    const dateAdded = new Date(page.dateAdded);
    const dateUpdated = new Date(page.dateUpdated);

    const queryParams = [
      page.title,
      page.titleSlug,
      page.published,
      page.content,
      page.meta,
      page.authorId,
      page.authorId,
      dateAdded,
      dateUpdated,
    ];

    const promisePool = this.dbConnectionPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query, queryParams);
    } catch(e) {
      if (e.code === 'ER_DUP_ENTRY') {
        if (e.message.includes('titleSlug')) {
          throw new SlugExistsException();
        }
      }

      throw new Error('MySQL Error');
    }

    if (!this.isResult(results)) {
      throw new InvalidResultException();
    }

    if (results.affectedRows === 0) {
      throw new InvalidResultException();
    }

    const id = results.insertId;

    return Page.fromNewPage(page, `${id}`);
  }

  async editPage(page: Page): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async deletePage(id: string): Promise<void> {
    throw new UnimplementedMethodException();
  }

}

export default MySQLPageController;
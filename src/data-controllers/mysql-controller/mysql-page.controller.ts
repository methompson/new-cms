
import MySQLDataControllerBase from './myqsl-controller-base';
import {
  NewPage,
  Page,
  PageMeta,
} from "@dataTypes";
import { PageController } from "../interfaces";

import {
  SlugExistsException,
  PageDoesNotExistException,
} from '@root/exceptions/page-exceptions';
import { InvalidResultException } from '@root/exceptions/data-controller-exceptions';


class MySQLPageController extends MySQLDataControllerBase implements PageController {
  async getPageBySlug(slug: string): Promise<Page> {
    const query = `
      SELECT
        id,
        title,
        titleSlug,
        published,
        content,
        meta,
        authorId,
        lastUpdatedBy,
        dateAdded,
        dateUpdated
      FROM pages
      WHERE titleSlug = ?
    `;

    const queryParams = [slug];

    const promisePool = this.dbConnectionPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query, queryParams);
    } catch (e) {
      throw new InvalidResultException(e.message);
    }

    console.log();

    if (!Array.isArray(results)) {
      throw new InvalidResultException();
    }

    if (results.length === 0) {
      throw new PageDoesNotExistException();
    }

    const p = results[0] as any;

    const post = Page.fromJson({
      ...p,
      id: `${p.id}`,
      authorId: `${p.authorId}`,
      lastUpdatedBy: `${p.lastUpdatedBy}`,
      published: p.published === 1,
      dateAdded: (p.dateAdded as Date).getTime(),
      dateUpdated: (p.dateUpdated as Date).getTime(),
    });

    console.log();

    return post;
  }

  async getPageById(id: string): Promise<Page> {
    const query = `
      SELECT
        id,
        title,
        titleSlug,
        published,
        content,
        meta,
        authorId,
        lastUpdatedBy,
        dateAdded,
        dateUpdated
      FROM pages
      WHERE id = ?
    `;

    const queryParams = [id];

    const promisePool = this.dbConnectionPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query, queryParams);
    } catch (e) {
      throw new InvalidResultException(e.message);
    }

    console.log();

    if (!Array.isArray(results)) {
      throw new InvalidResultException();
    }

    if (results.length === 0) {
      throw new PageDoesNotExistException();
    }

    const p = results[0] as any;

    const post = Page.fromJson({
      ...p,
      id: `${p.id}`,
      authorId: `${p.authorId}`,
      lastUpdatedBy: `${p.lastUpdatedBy}`,
      published: p.published === 1,
      dateAdded: (p.dateAdded as Date).getTime(),
      dateUpdated: (p.dateUpdated as Date).getTime(),
    });

    console.log();

    return post;
  }

  async getPageMeta(): Promise<PageMeta[]> {
    const query = `
      SELECT
        id,
        title,
        titleSlug,
        published,
        content,
        meta,
        authorId,
        lastUpdatedBy,
        dateAdded,
        dateUpdated
      FROM pages
    `;

    const promisePool = this.dbConnectionPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query);
    } catch (e) {
      throw new InvalidResultException(e.message);
    }

    console.log();

    if (!Array.isArray(results)) {
      throw new InvalidResultException();
    }

    if (results.length === 0) {
      throw new PageDoesNotExistException();
    }

    const meta: PageMeta[] = [];

    results.forEach((el) => {
      try {
        const page = Page.fromJson({
          ...el,
          id: `${el.id}`,
          authorId: `${el.authorId}`,
          lastUpdatedBy: `${el.lastUpdatedBy}`,
          published: el.published === 1,
          dateAdded: (el.dateAdded as Date).getTime(),
          dateUpdated: (el.dateUpdated as Date).getTime(),
        });

        meta.push(page.pageMeta);
      } catch(_) {}

    });

    console.log();

    return meta;
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
    const query = `
      UPDATE pages
      SET
        title = ?,
        titleSlug = ?,
        published = ?,
        content = ?,
        meta = ?,
        authorId = ?,
        lastUpdatedBy = ?,
        dateAdded = ?,
        dateUpdated = ?
      WHERE id = ?
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
      page.lastUpdatedBy,
      dateAdded,
      dateUpdated,
      page.id,
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

    // TODO Return new error (Page Doesn't Exist)
    if (results.affectedRows === 0) {
      throw new InvalidResultException();
    }

    return page;
  }

  async deletePage(id: string): Promise<void> {
    const query = 'DELETE FROM pages WHERE id = ?';
    const queryParams = [id];

    const promisePool = this.dbConnectionPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query, queryParams);
    } catch(e) {
      throw new Error('MySQL Error');
    }

    if (!this.isResult(results)) {
      throw new InvalidResultException();
    }

    if (results.affectedRows === 0) {
      throw new InvalidResultException();
    }

    console.log();
  }

}

export default MySQLPageController;
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
import { DataController, BlogController } from "../interfaces";
import {
  InvalidDataControllerConfigException,
  UnimplementedMethodException,
} from '@root/exceptions/cms-exceptions';
import { InvalidResultException } from '@root/exceptions/data-controller-exceptions';
import {
  BlogDoesNotExistException, BlogSlugExistsException,
} from '@root/exceptions/blog-exceptions';

class MySQLBlogController extends MySQLDataControllerBase implements BlogController {
  async getBlogPosts(pagination: number, page: number, admin: boolean = false): Promise<BlogPost[]> {
    let query = `
      SELECT
        id,
        title,
        titleSlug,
        preview,
        published,
        content,
        meta,
        authorId,
        dateAdded,
        dateUpdated
      FROM blogPosts
    `;

    if (!admin) {
      query += 'WHERE published = TRUE';
    }

    query += `
      ORDER BY dateAdded
      LIMIT ?,?
    `;

    // The offset is where the search starts. The first entry starts at 0. You find
    // the value by taking the page number, subtracting 1 and multiplying by the
    // pagination value.
    // e.g. page 1 is 10 * (1 - 1), i.e. 0
    // e.g. page 2 is 10 * (2 - 1), i.e. 10
    const offset = pagination * (page - 1);

    const queryParams = [`${offset}`, `${pagination}`];

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

    const posts: BlogPost[] = [];

    results.forEach((p) => {

      try {
        const post = BlogPost.fromJson({
          ...p,
          id: `${p.id}`,
          author: `${p.author}`,
          published: p.published === 1,
          dateAdded: (p.dateAdded as Date).getTime(),
          dateUpdated: (p.dateUpdated as Date).getTime(),
        });

        posts.push(post);
      } catch(_) {}
    });

    console.log();

    return posts;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost> {
    const query = `
      SELECT
        id,
        title,
        titleSlug,
        preview,
        published,
        content,
        meta,
        authorId,
        dateAdded,
        dateUpdated
      FROM blogPosts
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
      throw new BlogDoesNotExistException();
    }

    const p = results[0] as any;

    const post = BlogPost.fromJson({
      ...p,
      id: `${p.id}`,
      authorId: `${p.author}`,
      published: p.published === 1,
      dateAdded: (p.dateAdded as Date).getTime(),
      dateUpdated: (p.dateUpdated as Date).getTime(),
    });

    console.log();

    return post;
  }

  async getBlogPostById(id: string): Promise<BlogPost> {
    const query = `
      SELECT
        id,
        title,
        titleSlug,
        preview,
        published,
        content,
        meta,
        authorId,
        dateAdded,
        datedUpdated
      FROM blogPosts
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
      throw new BlogDoesNotExistException();
    }

    const p = results[0] as any;

    const post = BlogPost.fromJson({
      ...p,
      id: `${p.id}`,
      author: `${p.author}`,
      published: p.published === 1,
      dateAdded: (p.dateAdded as Date).getTime(),
      dateUpdated: (p.dateUpdated as Date).getTime(),
    });

    console.log();

    return post;
  }

  async addBlogPost(blogPost: NewBlogPost): Promise<BlogPost> {
    const query = `
      INSERT INTO blogPosts (
        title,
        titleSlug,
        content,
        preview,
        authorId,
        meta,
        published,
        dateAdded,
        dateUpdated
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;

    const dateAdded = new Date(blogPost.dateAdded);
    const dateUpdated = new Date(blogPost.dateUpdated);

    const queryParams = [
      blogPost.title,
      blogPost.titleSlug,
      blogPost.content,
      blogPost.preview,
      blogPost.authorId,
      blogPost.meta,
      blogPost.published,
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
          throw new BlogSlugExistsException();
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

    return BlogPost.fromNewBlogPost(blogPost, `${id}`);
  }

  async editBlogPost(blogPost: BlogPost): Promise<BlogPost> {
    const query = `
      UPDATE blogPosts
      SET
        title = ?,
        titleSlug = ?,
        content = ?,
        preview = ?,
        authorId = ?,
        meta = ?,
        published = ?,
        dateAdded = ?,
        dateUpdated = ?
      WHERE id = ?
    `;

    const dateAdded = new Date(blogPost.dateAdded);
    const dateUpdated = new Date(blogPost.dateUpdated);

    const queryParams = [
      blogPost.title,
      blogPost.titleSlug,
      blogPost.content,
      blogPost.preview,
      blogPost.authorId,
      blogPost.meta,
      blogPost.published,
      dateAdded,
      dateUpdated,
      blogPost.id,
    ];

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

    return blogPost;
  }

  async deleteBlogPost(id: string): Promise<void> {
    const query = 'DELETE FROM blogPosts WHERE id = ?';
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

export default MySQLBlogController;
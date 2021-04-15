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
  EmailExistsException,
  InvalidUserIdException,
  UserDoesNotExistException,
  UserExistsException,
  InvalidPasswordTokenException,
} from '@root/exceptions/user-exceptions';

class MySQLBlogController extends MySQLDataControllerBase implements BlogController {
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

export default MySQLBlogController;
import { open, writeFile, mkdir } from 'fs/promises';
import * as path from 'path';

import BasicDataControllerBase from './basic-controller-base';
import { BlogController } from '@root/data-controllers/interfaces';
import {
  BlogPost,
  NewBlogPost,
} from '@dataTypes';
import {
  BlogDoesNotExistException,
  BlogSlugExistsException,
  BlogAlreadyExistsException,
} from '@root/exceptions/blog-exceptions';
import { UnimplementedMethodException } from '@root/exceptions/cms-exceptions';

class BasicBlogController extends BasicDataControllerBase implements BlogController {
  protected _blogPosts: {[key: string]: BlogPost } = {};

  protected _blogFileName = 'blog.json';
  protected _blogWriteLock: boolean = false;
  protected _blogWriteAgain: boolean = false;

  get blogPosts() {
    return this._blogPosts;
  }

  get slugMap():{[key: string]: BlogPost} {
    const slugMap: {[key: string]: BlogPost} = {};

    Object.values(this._blogPosts).forEach((post) => {
      slugMap[post.titleSlug] = post;
    });

    return slugMap;
  }

  constructor(dataLocation: string) {
    super();
    this.dataLocation = dataLocation;
  }

  async getBlogPosts(pagination: number, page: number): Promise<BlogPost[]> {
    throw new UnimplementedMethodException();
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost> {
    for (const index in this.blogPosts) {
      const post = this.blogPosts[index];
      if (slug === post.titleSlug) {
        return post;
      }
    }

    throw new BlogDoesNotExistException();
  }

  async getBlogPostById(id: string): Promise<BlogPost> {
    const post = this.blogPosts[id];

    if (post === null || typeof post === 'undefined') {
      throw new BlogDoesNotExistException();
    }

    return post;
  }

  async addBlogPost(blogPost: NewBlogPost): Promise<BlogPost> {
    if (this.blogSlugExists(blogPost.titleSlug)) {
      throw new BlogSlugExistsException();
    }

    const id = this.getNextBlogId();

    const newBlogPost: BlogPost = BlogPost.fromNewBlogPost(blogPost, id);

    this.saveBlogPost(newBlogPost);

    return newBlogPost;
  }

  async editBlogPost(blogPost: BlogPost): Promise<BlogPost> {
    const post = this._blogPosts[blogPost.id];

    if (typeof post === 'undefined') {
      throw new BlogDoesNotExistException();
    }

    const slugMap = this.slugMap;
    const postFromSlug = slugMap[blogPost.titleSlug];

    // If the post from the slug exist (i.e. not undefined) and the IDs don't
    // match, that means another post already has the slug, which must be unique.
    if (typeof postFromSlug?.id !== 'undefined' && postFromSlug?.id !== blogPost.id) {
      throw new BlogAlreadyExistsException();
    }

    this.saveBlogPost(blogPost);

    return blogPost;
  }

  async deleteBlogPost(id: string): Promise<void> {
    if (this.blogPostDoesNotExists(id)) {
      throw new BlogDoesNotExistException();
    }

    const idInt = parseInt(id, 10);
    const post = this._blogPosts[idInt];

    delete this._blogPosts[idInt];

    this.writeBlogData();
  }

  // Saves the post and writes it to a file
  protected saveBlogPost(blogPost: BlogPost) {
    this._blogPosts[blogPost.id] = blogPost;

    this.writeBlogData();
  }

  protected blogPostDoesNotExists(id: string): boolean {
    const idInt = parseInt(id, 10);
    const post = this._blogPosts[idInt];

    return typeof post === 'undefined';
  }

  protected blogSlugExists(slug: string): boolean {
    const post = this.slugMap[slug];

    return typeof post !== 'undefined';
  }

  protected getNextBlogId(): string {
    let largestId = 0;

    Object.keys(this._blogPosts).forEach((idString) => {
      const id = parseInt(idString, 10);
      if (id > largestId) {
        largestId = id;
      }
    });

    return `${largestId + 1}`;
  }

  // TODO Where do I put the users file?
  async writeBlogData(): Promise<void> {
    if (this._blogWriteLock === true) {
      console.log("blog writelock hit");
      this._blogWriteAgain = true;
      return;
    }

    this._blogWriteLock = true;

    const loc = path.join(this.dataLocation, this._blogFileName);
    const handle = await open(loc, 'w+');
    await writeFile(handle, JSON.stringify(this._blogPosts));

    await handle.close();
    this._blogWriteLock = false;

    if (this._blogWriteAgain === true) {
      console.log("write blog again");
      this._blogWriteAgain = false;
      this.writeBlogData();
    }
  }

  async readBlogData(): Promise<void> {
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

export default BasicBlogController;
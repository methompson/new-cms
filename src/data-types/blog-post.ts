// tslint:disable:max-classes-per-file
import { InvalidJSONException } from '@root/exceptions/data-controller-exceptions';
import { InvalidSlugException } from '@root/exceptions/blog-exceptions';
import PageSection from './page-section';
import {
  slugify,
  validSlug,
} from '@root/utilities/slug';

// Meta should be JSON serializable.
class BlogBase {
  constructor(
    public title: string,
    public titleSlug: string,
    public content: PageSection[],
    public preview: string,
    public authorId: string,
    public meta: {[key: string]: any},
    public published: boolean,
  ) {}

  static fromJson(rawJson: any): BlogBase {
    if (typeof rawJson?.title !== 'string'
      || typeof rawJson?.preview !== 'string'
      || typeof rawJson?.authorId !== 'string'
      || typeof rawJson?.published !== 'boolean'
      || !Array.isArray(rawJson?.content)
    ) {
      throw new InvalidJSONException();
    }

    let titleSlug: string;

    if (typeof rawJson?.titleSlug === 'string') {
      if (validSlug(rawJson.titleSlug)) {
        titleSlug = rawJson.titleSlug;
      } else {
        throw new InvalidSlugException();
      }
    } else {
      titleSlug = slugify(rawJson.title);
    }

    const content: PageSection[] = [];

    rawJson.content.forEach((el) => {
      let section: PageSection;
      try {
        section = PageSection.fromJson(el);
        content.push(section);
      } catch(_) {}
    });

    let meta;
    try {
      meta = JSON.parse(JSON.stringify(rawJson?.meta));
    } catch(_) {
      meta = {};
    }

    return new BlogBase(
      rawJson.title,
      titleSlug,
      content,
      rawJson.preview,
      rawJson.authorId,
      meta,
      rawJson.published,
    );
  }
}

class NewBlogPost extends BlogBase {
  constructor(
    title: string,
    titleSlug: string,
    content: PageSection[],
    preview: string,
    authorId: string,
    meta: {[key: string]: any},
    published: boolean,
    public dateAdded: number,
    public dateUpdated: number,
  ) {
    super(title, titleSlug, content, preview, authorId, meta, published);
  }

  static fromJson(rawJson: any): NewBlogPost {
    const blogBase = BlogBase.fromJson(rawJson);

    const now = Date.now();

    const dateAdded = typeof rawJson?.dateAdded === 'number'
      ? rawJson.dateAdded
      : now;

    const dateUpdated = typeof rawJson?.dateUpdated === 'number'
      ? rawJson.dateUpdated
      : now;

    const newPost = new NewBlogPost(
      blogBase.title,
      blogBase.titleSlug,
      blogBase.content,
      blogBase.preview,
      blogBase.authorId,
      blogBase.meta,
      blogBase.published,
      dateAdded,
      dateUpdated,
    );

    return newPost;
  }
}

class BlogPost extends NewBlogPost {
  constructor(
    public id: string,
    title: string,
    titleSlug: string,
    content: PageSection[],
    preview: string,
    authorId: string,
    meta: {[key: string]: any},
    published: boolean,
    dateAdded: number,
    dateUpdated: number,
  ) {
    super(title, titleSlug, content, preview, authorId, meta, published, dateAdded, dateUpdated);
  }

  get blogMeta(): BlogMeta {
    return BlogMeta.fromBlogPost(this);
  }

  static fromJson(rawJson: any): BlogPost {
    if (typeof rawJson?.id !== 'string'
      && typeof rawJson?.id !== 'number'
    ) {
      throw new InvalidJSONException();
    }

    const newPost = NewBlogPost.fromJson(rawJson);

    const blog = new BlogPost(
      rawJson.id,
      newPost.title,
      newPost.titleSlug,
      newPost.content,
      newPost.preview,
      newPost.authorId,
      newPost.meta,
      newPost.published,
      newPost.dateAdded,
      newPost.dateUpdated,
    );

    return blog;
  }

  static fromNewBlogPost(blog: NewBlogPost, id: string) {
    return new BlogPost(
      id,
      blog.title,
      blog.titleSlug,
      blog.content,
      blog.preview,
      blog.authorId,
      blog.meta,
      blog.published,
      blog.dateAdded,
      blog.dateUpdated,
    );
  }

  /**
   * The big difference in this method is that it will throw an InvalidJSONException
   * if datedAdded does not exist, whereas the NewBlogPost will simply auto-fill
   * that field. This enforces a datedAdded having existed before submitting.
   *
   * @param rawJson any
   * @returns BlogPost
   */
  static fromEditJson(rawJson: any): BlogPost {
    if (typeof rawJson?.id !== 'string'
      || typeof rawJson?.dateAdded !== 'number'
    ) {
      throw new InvalidJSONException();
    }

    const newBlog = NewBlogPost.fromJson(rawJson);

    const blog = new BlogPost(
      rawJson.id,
      newBlog.title,
      newBlog.titleSlug,
      newBlog.content,
      newBlog.preview,
      newBlog.authorId,
      newBlog.meta,
      newBlog.published,
      newBlog.dateAdded,
      newBlog.dateUpdated,
    );

    return blog;
  }
}

class BlogMeta {
  constructor(
    public id: string,
    public title: string,
    public titleSlug: string,
    public preview: string,
    public authorId: string,
    public meta: {[key: string]: any},
    public published: boolean,
    public dateAdded: number,
    public dateUpdated: number,
  ) {}

  static fromBlogPost(post: BlogPost) {
    return new BlogMeta(
      post.id,
      post.title,
      post.titleSlug,
      post.preview,
      post.authorId,
      post.meta,
      post.published,
      post.dateAdded,
      post.dateUpdated,
    );
  }
}

export {
  BlogPost,
  NewBlogPost,
  BlogMeta,
};
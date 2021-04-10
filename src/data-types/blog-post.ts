// tslint:disable:max-classes-per-file

class BlogBase {
  constructor(
    public title: string,
    public titleSlug: string,
    public content: string,
    public preview: string,
    public author: string,
  ) {}
}

class NewBlogPost extends BlogBase {
  constructor(
    title: string,
    titleSlug: string,
    content: string,
    preview: string,
    author: string,
    public publishDate: number,
    public updateDate: number,
  ) {
    super(title, titleSlug, content, preview, author);
  }

  static fromJson(rawJson: any) {
    const isNewBlog = (val: any): boolean => {
      if (typeof val?.title === 'string'
        && typeof val?.titleSlug === 'string'
        && typeof val?.content === 'string'
        && typeof val?.preview === 'string'
        && typeof val?.author === 'string'
      ) {
        return true;
      }

      return false;
    };

    if (!isNewBlog(rawJson)) {
      throw new Error('Invalid Data');
    }

    const publishDate = rawJson?.publishDate ?? Date.now();
    const updateDate = rawJson?.updateDate ?? Date.now();

    const newPost = new NewBlogPost(
      rawJson.title,
      rawJson.titleSlug,
      rawJson.content,
      rawJson.preview,
      publishDate,
      updateDate,
      rawJson.author,
    );

    return newPost;
  }
}

class BlogPost extends NewBlogPost {
  constructor(
    public id: string,
    title: string,
    titleSlug: string,
    content: string,
    preview: string,
    author: string,
    publishDate: number,
    updateDate: number,
  ) {
    super(title, titleSlug, content, preview, author, publishDate, updateDate);
  }

  static fromJson(rawJson: any): BlogPost {
    const isBlog = (val: any): boolean => {
      if (typeof val === 'object'
        && typeof val?.id === 'string'
        && typeof val?.title === 'string'
        && typeof val?.titleSlug === 'string'
        && typeof val?.content === 'string'
        && typeof val?.preview === 'string'
        && typeof val?.publishDate === 'number'
        && typeof val?.updateDate === 'number'
        && typeof val?.author === 'string'
      ) {
        return true;
      }

      return false;
    };

    if (!isBlog(rawJson)) {
      throw new Error('Invalid Data');
    }

    const blog = new BlogPost(
      rawJson.id,
      rawJson.title,
      rawJson.titleSlug,
      rawJson.content,
      rawJson.preview,
      rawJson.author,
      rawJson.publishDate,
      rawJson.updateDate,
    );

    return blog;
  }
}

class EditBlogPost extends BlogPost {
  constructor(
    id: string,
    title: string,
    titleSlug: string,
    content: string,
    preview: string,
    author: string,
    publishDate: number,
    updateDate: number,
  ) {
    super(id, title, titleSlug, content, preview, author, publishDate, updateDate);
  }

  static fromJson(rawJson: any): EditBlogPost {
    const isBlog = (val: any): boolean => {
      if (typeof val === 'object'
        && typeof val?.id === 'string'
        && typeof val?.title === 'string'
        && typeof val?.titleSlug === 'string'
        && typeof val?.content === 'string'
        && typeof val?.preview === 'string'
        && typeof val?.publishDate === 'number'
        && typeof val?.author === 'string'
      ) {
        return true;
      }

      return false;
    };

    if (!isBlog(rawJson)) {
      throw new Error('Invalid Data');
    }

    const updateDate = rawJson?.updateDate ?? Date.now();

    const blog = new EditBlogPost(
      rawJson.id,
      rawJson.title,
      rawJson.titleSlug,
      rawJson.content,
      rawJson.preview,
      rawJson.author,
      rawJson.publishDate,
      updateDate,
    );

    return blog;
  }
}

export {
  BlogPost,
  NewBlogPost,
  EditBlogPost,
};
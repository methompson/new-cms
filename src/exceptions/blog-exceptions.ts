/**
 * This exception is meant to be thrown when attempting to edit a blog post and the blog
 * post doesn't exist already.
 */
class BlogDoesNotExistException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, BlogDoesNotExistException.prototype);
  }
}

export {
  BlogDoesNotExistException,
}
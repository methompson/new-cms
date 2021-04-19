// tslint:disable:max-classes-per-file

/**
 * This exception is meant to be thrown when attempting to edit a blog post and the blog
 * post doesn't exist already.
 */
class BlogDoesNotExistException extends Error {
  constructor(...params) {
    super(...params);
    Object.setPrototypeOf(this, BlogDoesNotExistException.prototype);
  }
}

class BlogAlreadyExistsException extends Error {
  constructor(...params) {
    super(...params);
    Object.setPrototypeOf(this, BlogAlreadyExistsException.prototype);
  }
}

class BlogSlugExistsException extends Error {
  constructor(...params) {
    super(...params);
    Object.setPrototypeOf(this, BlogSlugExistsException.prototype);
  }
}

class InvalidSlugException extends Error {
  constructor(...params) {
    super(...params);
    Object.setPrototypeOf(this, InvalidSlugException.prototype);
  }
}

export {
  BlogDoesNotExistException,
  BlogAlreadyExistsException,
  BlogSlugExistsException,
  InvalidSlugException,
};
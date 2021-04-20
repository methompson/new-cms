// tslint:disable:max-classes-per-file

class SlugExistsException extends Error {
  constructor(...params) {
    super(...params);
    Object.setPrototypeOf(this, SlugExistsException.prototype);
  }
}

class PageDoesNotExistException extends Error {
  constructor(...params) {
    super(...params);
    Object.setPrototypeOf(this, PageDoesNotExistException.prototype);
  }
}


export {
  SlugExistsException,
  PageDoesNotExistException,
};
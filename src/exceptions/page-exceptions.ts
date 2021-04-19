// tslint:disable:max-classes-per-file

class SlugExistsException extends Error {
  constructor(...params) {
    super(...params);
    Object.setPrototypeOf(this, SlugExistsException.prototype);
  }
}


export {
  SlugExistsException,
};
// tslint:disable:max-classes-per-file

class InvalidResultException extends Error {
  constructor() {
    super();

    Object.setPrototypeOf(this, InvalidResultException.prototype);
  }
}

export {
  InvalidResultException,
};
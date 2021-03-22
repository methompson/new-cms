/**
 * This exception is meant to be thrown when attempting to add a user with a username
 * that already exists.
 */
class UserExistsException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, UserExistsException.prototype);
  }
}

// tslint:disable-next-line:max-classes-per-file
class EmailExistsException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, EmailExistsException.prototype);
  }
}

// tslint:disable-next-line:max-classes-per-file
class InvalidUsernameException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, InvalidUsernameException.prototype);
  }
}

// tslint:disable-next-line:max-classes-per-file
class InvalidPasswordException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, InvalidPasswordException.prototype);
  }
}

// tslint:disable-next-line:max-classes-per-file
class InsufficientPermissionsException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, InsufficientPermissionsException.prototype);
  }
}

export {
  UserExistsException,
  EmailExistsException,
  InvalidUsernameException,
  InvalidPasswordException,
  InsufficientPermissionsException,
}
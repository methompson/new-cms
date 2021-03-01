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
class InvalidUsernameException extends Error {}

// tslint:disable-next-line:max-classes-per-file
class InvalidPasswordException extends Error {}

// tslint:disable-next-line:max-classes-per-file
class InsufficientPermissionsException extends Error {}

export {
  UserExistsException,
  InvalidUsernameException,
  InvalidPasswordException,
  InsufficientPermissionsException,
}
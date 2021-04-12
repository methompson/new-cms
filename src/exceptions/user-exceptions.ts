// tslint:disable:max-classes-per-file

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

class UserDoesNotExistException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, UserDoesNotExistException.prototype);
  }
}

class EmailExistsException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, EmailExistsException.prototype);
  }
}

class InvalidUsernameException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, InvalidUsernameException.prototype);
  }
}

class InvalidUserIdException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, InvalidUserIdException.prototype);
  }
}

class InvalidPasswordException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, InvalidPasswordException.prototype);
  }
}

class InsufficientPermissionsException extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, InsufficientPermissionsException.prototype);
  }
}

export {
  UserExistsException,
  UserDoesNotExistException,
  EmailExistsException,
  InvalidUsernameException,
  InvalidUserIdException,
  InvalidPasswordException,
  InsufficientPermissionsException,
}
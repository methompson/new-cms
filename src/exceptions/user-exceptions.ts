/**
 * This exception is meant to be thrown when attempting to add a user with a username
 * that already exists.
 */
class UserExistsException extends Error {}

// tslint:disable-next-line:max-classes-per-file
class UsernameInvalidException extends Error {}

// tslint:disable-next-line:max-classes-per-file
class PasswordInvalidException extends Error {}

export {
  UserExistsException,
  UsernameInvalidException,
  PasswordInvalidException,
}
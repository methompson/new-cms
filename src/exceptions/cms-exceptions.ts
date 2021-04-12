// tslint:disable:max-classes-per-file

class InvalidDataControllerException extends Error {
  constructor() {
    super();

    Object.setPrototypeOf(this, InvalidDataControllerException.prototype);
  }
}

class InvalidDataControllerConfigException extends Error {
  constructor() {
    super();

    Object.setPrototypeOf(this, InvalidDataControllerConfigException.prototype);
  }
}

class UnimplementedMethodException extends Error {
  constructor() {
    super();

    Object.setPrototypeOf(this, InvalidDataControllerConfigException.prototype);
  }
}

export {
  InvalidDataControllerException,
  InvalidDataControllerConfigException,
  UnimplementedMethodException,
};
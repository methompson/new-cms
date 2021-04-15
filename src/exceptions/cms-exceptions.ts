// tslint:disable:max-classes-per-file

class InvalidDataControllerException extends Error {
  constructor(...params) {
    super(...params);

    Object.setPrototypeOf(this, InvalidDataControllerException.prototype);
  }
}

class InvalidDataControllerConfigException extends Error {
  constructor(...params) {
    super(...params);

    Object.setPrototypeOf(this, InvalidDataControllerConfigException.prototype);
  }
}

class UnimplementedMethodException extends Error {
  constructor(...params) {
    super(...params);

    Object.setPrototypeOf(this, InvalidDataControllerConfigException.prototype);
  }
}

export {
  InvalidDataControllerException,
  InvalidDataControllerConfigException,
  UnimplementedMethodException,
};
class InvalidDataControllerException extends Error {
  constructor() {
    super();

    Object.setPrototypeOf(this, InvalidDataControllerException.prototype);
  }
}

export {
  InvalidDataControllerException,
};
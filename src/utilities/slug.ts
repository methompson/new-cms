// tslint:disable:max-classes-per-file

class InvalidSlugLengthException extends Error {
  constructor(...params) {
    super(...params);
    Object.setPrototypeOf(this, InvalidSlugLengthException.prototype);
  }
}

class InvalidSlugCharacterException extends Error {
  constructor(...params) {
    super(...params);
    Object.setPrototypeOf(this, InvalidSlugCharacterException.prototype);
  }
}

function slugify(title: string): string {
  const lowerCase = title.toLowerCase().trim();

  let newName = "";
  const regex = RegExp(/[a-z0-9-]/);

  for (let x = 0; x < lowerCase.length; ++x) {
    const char = lowerCase.substring(x, x + 1);
    const result = regex.test(char);
    if (char === " ") {
      newName += "-";
    } else if (result) {
      newName += char;
    }
  }

  if (newName.length > 512) {
    newName = newName.substring(0, 512);
  }

  return newName;
}

function validSlug(slug: any): boolean {
  if (typeof slug !== 'string') {
    return false;
  }

  if (slug.length < 1 || slug.length > 512) {
    return false;
  }

  // The hat character indicates that we are checking if there are characters
  // NOT in the regex list.
  const regex = RegExp(/[^a-z0-9-]+/g);

  // We don't return regex.test directly.
  const test = !regex.test(slug);

  return test;
}

export {
  slugify,
  validSlug,
};
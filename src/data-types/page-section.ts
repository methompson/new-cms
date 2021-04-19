import { InvalidJSONException } from '@root/exceptions/data-controller-exceptions';

class PageSection {
  constructor(
    public name: string,
    public classes: string[],
    public contentType: string,
    public content: string,
  ) {}

  static fromJson(rawJson: any): PageSection {
    if (typeof rawJson?.name === 'string'
      && Array.isArray(rawJson?.classes)
      && rawJson?.classes.every((item) => typeof item === 'string')
      && typeof rawJson?.contentType === 'string'
      && typeof rawJson?.content === 'string'
    ) {
      return new PageSection(
        rawJson.name,
        rawJson.classes,
        rawJson.contentType,
        rawJson.content,
      );
    }

    throw new InvalidJSONException();
  }

  toJSON(): string {
    return JSON.stringify({
      name: this.name,
      classes: this.classes,
      contentType: this.contentType,
      content: this.content,
    });
  }
}

export default PageSection;

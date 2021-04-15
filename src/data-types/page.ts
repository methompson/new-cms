// tslint:disable:max-classes-per-file

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

class NewPage {
  constructor(
    public name: string,
    public slug: string,
    public published: boolean,
    public content: PageSection[],
    public meta: {[key: string]: any},
    public authorId: string,
  ) {}

  static fromJson(rawJson: any): NewPage {
    if (typeof rawJson?.name !== 'string'
      || typeof rawJson?.slug !== 'string'
      || typeof rawJson?.published !== 'boolean'
      || typeof rawJson?.authorId !== 'string'
      || !Array.isArray(rawJson?.content)
    ) {
      throw new InvalidJSONException();
    }

    const content: PageSection[] = [];
    rawJson.content.forEach((el) => {
      let section: PageSection;
      try {
        section = PageSection.fromJson(el);
        content.push(section);
      } catch(_) {}
    });

    return new NewPage(
      rawJson.name,
      rawJson.slug,
      rawJson.published,
      content,
      rawJson.meta,
      rawJson.authorId,
    );
  }
}

class Page extends NewPage {
  constructor(
    public id: string,
    name: string,
    slug: string,
    published: boolean,
    content: PageSection[],
    meta: {[key: string]: any},
    authorId: string,
    public lastUpdatedBy: string,
    public dateAdded: number,
    public dateUpdated: number,
  ) {
    super(name, slug, published, content, meta, authorId);
  }

  static fromJson(rawJson): Page {
    // Should throw an error if this is invalid
    const newPage = NewPage.fromJson(rawJson);

    if (typeof rawJson?.id !== 'string'
      || typeof rawJson?.lawUpdatedBy !== 'string'
      || typeof rawJson?.dateAdded !== 'number'
      || typeof rawJson?.dateUpdated !== 'number'
    ) {
      throw new InvalidJSONException();
    }

    return new Page(
      rawJson.id,
      newPage.name,
      newPage.slug,
      newPage.published,
      newPage.content,
      newPage.meta,
      newPage.authorId,
      rawJson.lastUpdatedBy,
      rawJson.dateAdded,
      rawJson.dateUpdated,
    );
  }
}

export {
  PageSection,
  NewPage,
  Page,
};
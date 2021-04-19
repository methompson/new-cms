// tslint:disable:max-classes-per-file

import { InvalidJSONException } from '@root/exceptions/data-controller-exceptions';
import { InvalidSlugException } from '@root/exceptions/blog-exceptions';
import PageSection from './page-section';
import {
  slugify,
  validSlug,
} from '@root/utilities/slug';

class NewPage {
  constructor(
    public title: string,
    public titleSlug: string,
    public published: boolean,
    public content: PageSection[],
    public meta: {[key: string]: any},
    public authorId: string,
    public dateAdded: number,
    public dateUpdated: number,
  ) {}

  static fromJson(rawJson: any): NewPage {
    if (typeof rawJson?.title !== 'string'
      || typeof rawJson?.published !== 'boolean'
      || typeof rawJson?.authorId !== 'string'
      || !Array.isArray(rawJson?.content)
    ) {
      throw new InvalidJSONException();
    }

    let titleSlug: string;

    if (typeof rawJson?.titleSlug === 'string') {
      if (validSlug(rawJson.titleSlug)) {
        titleSlug = rawJson.titleSlug;
      } else {
        throw new InvalidSlugException();
      }
    } else {
      titleSlug = slugify(rawJson.title);
    }

    const content: PageSection[] = [];
    rawJson.content.forEach((el) => {
      let section: PageSection;
      try {
        section = PageSection.fromJson(el);
        content.push(section);
      } catch(_) {}
    });

    let meta;
    try {
      meta = JSON.parse(JSON.stringify(rawJson?.meta));
    } catch(_) {
      meta = {};
    }

    const now = Date.now();

    const publishDate = typeof rawJson?.publishDate === 'number'
      ? rawJson.publishDate
      : now;

    const updateDate = typeof rawJson?.updateDate === 'number'
      ? rawJson.updateDate
      : now;

    return new NewPage(
      rawJson.title,
      rawJson.titleSlug,
      rawJson.published,
      content,
      meta,
      rawJson.authorId,
      publishDate,
      updateDate,
    );
  }
}

class Page extends NewPage {
  constructor(
    public id: string,
    title: string,
    titleSlug: string,
    published: boolean,
    content: PageSection[],
    meta: {[key: string]: any},
    authorId: string,
    dateAdded: number,
    dateUpdated: number,
    public lastUpdatedBy: string,
  ) {
    super(title, titleSlug, published, content, meta, authorId, dateAdded, dateUpdated);
  }

  static fromJson(rawJson): Page {
    // Should throw an error if this is invalid
    const newPage = NewPage.fromJson(rawJson);

    if (typeof rawJson?.id !== 'string'
      || typeof rawJson?.lastUpdatedBy !== 'string'
      || typeof rawJson?.dateAdded !== 'number'
      || typeof rawJson?.dateUpdated !== 'number'
    ) {
      throw new InvalidJSONException();
    }

    return new Page(
      rawJson.id,
      newPage.title,
      newPage.titleSlug,
      newPage.published,
      newPage.content,
      newPage.meta,
      newPage.authorId,
      rawJson.lastUpdatedBy,
      rawJson.dateAdded,
      rawJson.dateUpdated,
    );
  }

  static fromNewPage(newPage: NewPage, id: string): Page {
    return new Page(
      id,
      newPage.title,
      newPage.titleSlug,
      newPage.published,
      newPage.content,
      newPage.meta,
      newPage.authorId,
      newPage.dateAdded,
      newPage.dateUpdated,
      newPage.authorId,
    );
  }
}

export {
  PageSection,
  NewPage,
  Page,
};
import BasicDataControllerBase from './basic-controller-base';

import { open, writeFile, mkdir } from 'fs/promises';
import * as path from 'path';

import { PageController } from '@root/data-controllers/interfaces';
import { UnimplementedMethodException } from '@root/exceptions/cms-exceptions';
import {
  SlugExistsException,
  PageDoesNotExistException,
} from '@root/exceptions/page-exceptions';
import {
  NewPage,
  Page,
  PageMeta,
} from '@dataTypes';

class BasicPageController extends BasicDataControllerBase implements PageController {
  protected _pages: {[key: string]: Page } = {};

  protected _pagesFileName = 'pages.json';
  protected _pagesWriteLock: boolean = false;
  protected _pagesWriteAgain: boolean = false;

  constructor(dataLocation: string) {
    super();
    this.dataLocation = dataLocation;
  }

  get slugMap():{[key: string]: Page} {
    const slugMap: {[key: string]: Page} = {};

    Object.values(this._pages).forEach((page) => {
      slugMap[page.titleSlug] = page;
    });

    return slugMap;
  }

  async getPageBySlug(slug: string): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async getPageById(id: string): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async getPageMeta(): Promise<PageMeta[]> {
    throw new UnimplementedMethodException();
  }

  async addPage(newPage: NewPage): Promise<Page> {
    if (this.pageSlugExists(newPage.titleSlug)) {
      throw new SlugExistsException();
    }

    const id = this.getNextPageId();

    const page: Page = Page.fromNewPage(newPage, id);
    this.savePage(page);

    return page;
  }

  async editPage(page: Page): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async deletePage(id: string): Promise<void> {
    throw new UnimplementedMethodException();
  }

  protected savePage(page: Page) {
    this._pages[page.id] = page;

    this.writePageData();
  }

  protected pageSlugExists(slug: string): boolean {
    const page = this.slugMap[slug];

    return typeof page !== 'undefined';
  }

  protected getNextPageId(): string {
    let largestId = 0;

    Object.keys(this._pages).forEach((idString) => {
      const id = parseInt(idString, 10);
      if (id > largestId) {
        largestId = id;
      }
    });

    return `${largestId + 1}`;
  }

  // TODO Where do I put the users file?
  async writePageData(): Promise<void> {
    if (this._pagesWriteLock === true) {
      console.log("blog writelock hit");
      this._pagesWriteAgain = true;
      return;
    }

    this._pagesWriteLock = true;

    const loc = path.join(this.dataLocation, this._pagesFileName);
    const handle = await open(loc, 'w+');
    await writeFile(handle, JSON.stringify(this._pages));

    await handle.close();
    this._pagesWriteLock = false;

    if (this._pagesWriteAgain === true) {
      console.log("write page again");
      this._pagesWriteAgain = false;
      this.writePageData();
    }
  }

  async readPageData(): Promise<void> {
    await mkdir(this.dataLocation, { recursive: true });

    // We have to use a+ to create the file if it doesn't exist.
    // r will throw an exception if the file doesn't exist.
    // w+ will truncate the file if it already exists.
    const loc = path.join(this.dataLocation, this._pagesFileName);
    const handle = await open(loc, 'a+');
    const pageDataString = await handle.readFile('utf-8');

    handle.close();

    const rawPageData = JSON.parse(pageDataString);

    if (typeof rawPageData !== 'object') {
      throw new Error('Invalid JSON format');
    }

    const pages: {[key: string]: Page} = {};

    Object.keys(rawPageData).forEach((key) => {
      const rawPage = rawPageData[key];
      try {
        const page = Page.fromJson(rawPage);
        pages[page.id] = page;
      } catch(e) {
        // Do nothing
      }
    });

    this._pages = pages;
  }
}

export default BasicPageController;
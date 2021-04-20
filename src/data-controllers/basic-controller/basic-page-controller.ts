import BasicDataControllerBase from './basic-controller-base';

import { open, writeFile, mkdir } from 'fs/promises';
import * as path from 'path';

import { PageController } from '@root/data-controllers/interfaces';
import {
  UnimplementedMethodException,
} from '@root/exceptions/cms-exceptions';
import {
  NewPage,
  Page,
  PageMeta,
} from '@dataTypes';

class BasicPageController extends BasicDataControllerBase implements PageController {
  constructor(dataLocation: string) {
    super();
    this.dataLocation = dataLocation;
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

  async addPage(page: NewPage): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async editPage(page: Page): Promise<Page> {
    throw new UnimplementedMethodException();
  }

  async deletePage(id: string): Promise<void> {
    throw new UnimplementedMethodException();
  }
}

export default BasicPageController;
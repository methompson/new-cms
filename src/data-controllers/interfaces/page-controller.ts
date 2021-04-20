import {Page, NewPage, PageMeta} from '@dataTypes';

interface PageController {
  getPageBySlug: (slug: string) => Promise<Page>;
  getPageById: (id: string) => Promise<Page>;
  getPageMeta: () => Promise<PageMeta[]>;

  addPage: (page: NewPage) => Promise<Page>;
  editPage: (page: Page) => Promise<Page>;
  deletePage: (id: string) => Promise<void>;
}

export default PageController;
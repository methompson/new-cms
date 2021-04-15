import {Page, NewPage} from '@dataTypes';

interface PageController {
  getPageBySlug: (slug: string) => Promise<Page>;
  getPageById: (id: string) => Promise<Page>;

  addPage: (page: NewPage) => Promise<Page>;
  editPage: (page: Page) => Promise<Page>;
  deletePage: (id: string) => Promise<void>;
}

export default PageController;
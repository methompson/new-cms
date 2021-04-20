import { DataController } from '@root/data-controllers/interfaces';
import { CMSContext } from '@dataTypes';

import BasicBlogController from './basic-blog-controller';
import BasicPageController from './basic-page-controller';
import BasicUserController from './basic-user-controller';

class BasicDataController extends DataController {
  initialized = false;

  private _constructionOptions: any;

  constructor(options?: any) {
    super();
    this._constructionOptions = options ?? {};
  }

  async init(cmsContext: CMSContext) {
    this.cmsContext = cmsContext;

    const dataLocation = this._constructionOptions?.dataLocation ?? './';

    const userController = new BasicUserController(dataLocation);
    const blogController = new BasicBlogController(dataLocation);
    const pageController = new BasicPageController(dataLocation);

    try {
      await userController.readUserData();
      await blogController.readBlogData();
      await pageController.readPageData();

    } catch(e) {
      console.log('Read error');
    }

    this._userController = userController;
    this._blogController = blogController;
    this._pageController = pageController;

    console.log('initialized');

    this.initialized = true;

    return;
  }
}

export default BasicDataController;
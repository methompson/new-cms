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

    this._userController = new BasicUserController(dataLocation);
    this._blogController = new BasicBlogController(dataLocation);
    this._pageController = new BasicPageController(dataLocation);

    try {
      // await this.readUserData();
      // await this.readBlogData();
    } catch(e) {
      console.log('Read error');
    }

    console.log('initialized');

    this.initialized = true;

    return;
  }
}

export default BasicDataController;
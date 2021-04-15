import UserController from './user-controller';
import BlogController from './blog-controller';
import PageController from './page-controller';
import { CMSContext } from '@dataTypes';

abstract class DataController {
  initialized: boolean;
  cmsContext: CMSContext;

  protected _userController: UserController;
  protected _blogController: BlogController;
  protected _pageController: PageController;

  get userController() { return this._userController; }
  get blogController() { return this._blogController; }
  get pageController() { return this._pageController; }

  async init(cmsContext: CMSContext): Promise<void> {
    this.cmsContext = cmsContext;
  }
}

export {
  DataController,
  UserController,
  BlogController,
  PageController,
};
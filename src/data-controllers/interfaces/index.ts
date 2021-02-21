import UserController from "./user-controller";
import BlogController from "./blog-controller"
import { CMSContext } from '@dataTypes';

interface DataController extends UserController, BlogController {
  cmsContext: CMSContext;
  init: (cmsContext: CMSContext) => Promise<void>
};

export {
  DataController,
};
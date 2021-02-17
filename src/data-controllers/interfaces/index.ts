import UserController from "./user-controller";
import BlogController from "./blog-controller"

interface DataController extends UserController, BlogController {};

export {
  DataController,
};
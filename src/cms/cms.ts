import * as Router from 'koa-router';

import { CMSContext, UserType, UserTypeMap, NewUser, User } from '@dataTypes';
import { DataController } from '@root/data-controllers/interfaces';
import ErrorHandler from './error-handler';
import { useRouteProtection } from './route-protection';
import { ParameterizedContext } from 'koa';
import { InsufficientPermissionsException, UserExistsException } from '@root/exceptions/user-exceptions';

class CMS extends ErrorHandler {
  dataController: DataController;
  mainRouter: Router;

  blogRouter: Router;
  userRouter: Router;

  context: CMSContext;

  theContext: CMS;

  constructor(dataController: DataController) {
    super();
    this.dataController = dataController;
  }

  async init() {
    const userTypeMap = new UserTypeMap();

    this.context = {
      userTypeMap,
    };

    await this.dataController.init(this.context);

    this.blogRouter = this.initBlogRouter();
    this.userRouter = this.initUserRouter();

    const r = new Router();

    r.use('/user', this.userRouter.routes());
    r.use('/blog', this.blogRouter.routes());

    this.mainRouter = r;
  }

  private initBlogRouter(): Router {
    const writerUserType = this.context.userTypeMap.getUserType('Wroter');
    const r = new Router();

    r.get(
      '/id',
      async (ctx, next) => this.getBlogPostById(ctx, next)
    );

    r.get(
      '/slug',
      async (ctx, next) => this.getBlogPostBySlug(ctx, next)
    );

    r.post(
      '/add',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.addNewBlogPost(ctx, next)
    );

    r.post(
      '/edit',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.editBlogPost(ctx, next)
    );

    r.post(
      '/delete',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.deleteBlogPost(ctx, next)
    );

    return r;
  }

  private initUserRouter(): Router {
    const adminUserType = this.context.userTypeMap.getUserType('Admin');
    const editorUserType = this.context.userTypeMap.getUserType('Editor');

    const r = new Router();

    r.post(
      '/login',
      async (ctx, next) => this.logUserIn(ctx, next),
    );

    r.get(
      '/id',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, editorUserType),
      async (ctx, next) => this.getUserById(ctx, next),
    );

    r.get(
      '/username',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, editorUserType),
      async (ctx, next) => this.getUserByUserName(ctx, next),
    );

    r.post(
      '/add',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, adminUserType),
      async (ctx, next) => this.addUser(ctx, next),
    );

    return r;
  }

  /**
   * This middleware is supposed to be used AFTER koa-jwt is run so that the JWT the user
   * passes is contained in ctx.state.user. This middleware determines the minimum user type
   * to perform an action and either goes to next on success or throws an error on failure.
   *
   * @param ctx koa Context object
   * @param next koa next function.
   * @param minUserType Minimum UserType to perform an action.
   */
  private async filterByUserType(ctx: ParameterizedContext, next: () => Promise<any>, minUserType: UserType) {
    const userTypeString = ctx?.state?.user?.userType;
    const currentUserType = this.context.userTypeMap.getUserType(userTypeString);

    if (!currentUserType.canAccessLevel(minUserType)) {
      this.send403Error(ctx, 'You lack the permissions to access this resource');
      return;
    }

    next();
  }

  private async logUserIn(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body;

    if ( typeof body?.username !== 'string'
      || typeof body?.password !== 'string'
    ) {
      this.send400Error(ctx, 'Invalid Credentials');
      return;
    }

    let token: string;
    try {
      token = await this.dataController.logUserIn(body.username, body.password);
    } catch(e) {
      this.send401Error(ctx, 'Invalid Credentials');
      return;
    }

    ctx.body = {
      token,
    };

    next();
  }

  private async getUserById(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body;

    if (typeof body?.id !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    const user = await this.dataController.getUserById(body.id);

    if (user == null) {
      this.send400Error(ctx, 'Invalid user ID provided');
      return;
    }

    ctx.body = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    next();
  }

  private async getUserByUserName(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body;

    if (typeof body?.username !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    const user = await this.dataController.getUserByUsername(body.username);

    if (user == null) {
      this.send400Error(ctx, 'Invalid username provided');
      return;
    }

    ctx.body = {
      msg: '/username',
    };

    ctx.body = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    next();
  }

  private async addUser(ctx: ParameterizedContext, next: () => Promise<any>) {
    const newUser = ctx?.request?.body?.newUser;

    console.log('type of', typeof ctx);

    if ( typeof newUser?.username !== 'string'
      || typeof newUser?.email !== 'string'
      || typeof newUser?.password !== 'string'
    ) {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    const userType: UserType = this.context.userTypeMap.getUserType(newUser.userType ?? '');

    const u: NewUser = {
      username: newUser.username,
      email: newUser.email,
      passwordHash: newUser.password,
      firstName: newUser.firstName ?? '',
      lastName: newUser.lastName ?? '',
      userType,
    };

    let savedUser: User;

    try {
      savedUser = await this.dataController.addUser(u);
    } catch (e) {
      if (e instanceof UserExistsException) {
        this.send400Error(ctx, `Username or email already exists`);
      } else {
        this.send500Error(ctx, `Error while saving user: ${e}`);
      }
      return;
    }

    ctx.body = {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      userType: userType.name,
    };

    next();
  }

  private async getBlogPostById(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body;

    if (typeof body?.id !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    const post = await this.dataController.getBlogPostById(body.id);

    ctx.body = {
      msg: '/id',
    };

    next();
  }

  private async getBlogPostBySlug(ctx: ParameterizedContext, next: () => Promise<any>) {
    ctx.body = {
      msg: '/slug',
    };

    next();
  }

  private async addNewBlogPost(ctx: ParameterizedContext, next: () => Promise<any>) {
    ctx.body = {
      msg: '/add',
    };

    next();
  }

  private async editBlogPost(ctx: ParameterizedContext, next: () => Promise<any>) {
    ctx.body = {
      msg: '/edit',
    };

    next();
  }

  private async deleteBlogPost(ctx: ParameterizedContext, next: () => Promise<any>) {
    ctx.body = {
      msg: '/delete',
    };

    next();
  }
}

export default CMS;
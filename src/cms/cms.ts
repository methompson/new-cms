import * as Router from 'koa-router';

import { CMSContext, UserType, UserTypeMap, NewUser, User } from '@dataTypes';
import { DataController } from '@root/data-controllers/interfaces';
import ErrorHandler from './error-handler';
import { useRouteProtection } from './route-protection';
import { ParameterizedContext } from 'koa';
import { EmailExistsException, InsufficientPermissionsException, UserExistsException } from '@root/exceptions/user-exceptions';
import { InvalidDataControllerException } from '@root/exceptions/cms-exceptions';

class CMS extends ErrorHandler {
  dataController: DataController;
  mainRouter: Router;

  blogRouter: Router;
  userRouter: Router;

  context: CMSContext;

  theContext: CMS;

  constructor() {
    super();
  }

  async init(dataController: DataController, options?: any) {
    this.dataController = dataController;
    const userTypeMap = new UserTypeMap();

    this.context = {
      userTypeMap,
    };

    await this.dataController.init(this.context);

    if (this.dataController.initialized === false) {
      throw new InvalidDataControllerException();
    }

    this.blogRouter = this.initBlogRouter();
    this.userRouter = this.initUserRouter();

    const r = new Router();

    r.use('/user', this.userRouter.routes());
    r.use('/blog', this.blogRouter.routes());

    this.mainRouter = r;
  }

  private initBlogRouter(): Router {
    const writerUserType = this.context.userTypeMap.getUserType('Writer');
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

    r.post(
      '/edit',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, adminUserType),
      async (ctx, next) => this.editUser(ctx, next),
    );

    r.post(
      '/delete',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, adminUserType),
      async (ctx, next) => this.deleteUser(ctx, next),
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

    let u: NewUser;

    try {
      u = NewUser.fromJson({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        firstName: newUser.firstName ?? '',
        lastName: newUser.lastName ?? '',
        userType: newUser.userType ?? '',
      }, this.context.userTypeMap);
    } catch(e) {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

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
      userType: savedUser.userType.name,
    };

    next();
  }

  /**
   * Does not edit the user's password
   * @param ctx
   * @param next
   * @returns
   */
  private async editUser(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body;

    if (typeof body?.id !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }
    // We prevent a user from editing a user of a higher level. e.g. admin user types
    // cannot delete super admins.
    const currentEditedUser = await this.dataController.getUserById(body.id);
    if (currentEditedUser === null) {
      this.send400Error(ctx, 'User does not exist');
      return;
    }

    const userTypeMap = this.context.userTypeMap;

    // There should be no problem here. We use filterByUserType to make sure that the
    // userType actually exists.
    const requester = ctx?.state?.user;
    const requesterType = userTypeMap.getUserType(requester?.userType);

    // compareUserTypeLevels will compare the first userType to the second. If the first
    // is lower than the second, it will return a value less than 1.
    if (userTypeMap.compareUserTypeLevels(requesterType, currentEditedUser.userType) < 0) {
      this.send400Error(ctx, 'Cannot edit a user of a higher level');
      return;
    }

    // If we made it here, we're going to construct the new User object with the old
    // user data and the new user data.

    // We have to be careful with user type. We already prevent the user from updating
    // users of a higher user type. However, we also need to make sure that the user
    // type they're updating isn't higher than their current user type. The API will
    // not prevent a user from demoting themself.
    let newUserType: UserType;

    if (body?.userType == null) {
      newUserType = currentEditedUser.userType;
    } else {
      const requestedUserType = userTypeMap.getUserType(body?.userType);

      if(userTypeMap.compareUserTypeLevels(requesterType, requestedUserType) < 0) {
        this.send400Error(ctx, 'Cannot set user to a higher user level than your own.');
        return;
      }

      newUserType = requestedUserType;
    }

    const editedUser = new User(
      currentEditedUser.id,
      body?.username ?? currentEditedUser.username,
      body?.email ?? currentEditedUser.email,
      body?.firstName ?? currentEditedUser.firstName,
      body?.lastName ?? currentEditedUser.lastName,
      newUserType,
      currentEditedUser.passwordHash,
    );

    let result: User;

    try {
      result = await this.dataController.editUser(editedUser);
    } catch (e) {
      let msg: string = '';
      if (e instanceof EmailExistsException) {
        msg += 'Email already exists for another user.';
      } else if (e instanceof UserExistsException) {
        msg += 'Username already exists for another user.';
      } else {
        msg += `$e`;
      }

      this.send400Error(ctx, msg);
      return;
    }

    ctx.body = {
      id: result.id,
      username: result.username,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      userType: result.userType.name,
    };

    next();
  }

  private async deleteUser(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body;

    if (typeof body?.id !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    // We prevent our user from deleting themself.
    const requester = ctx?.state?.user;
    if (requester?.userId === body?.id) {
      this.send400Error(ctx, 'You cannot delete yourself');
      return;
    }

    // We prevent a user from deleting a user of a higher level. e.g. admin user types
    // cannot delete super admins.
    const deletedUser = await this.dataController.getUserById(body.id);
    if (deletedUser === null) {
      this.send400Error(ctx, 'User does not exist');
      return;
    }

    // There should be no problem here. We use filterByUserType to make sure that the
    // userType actually exists.
    const requesterType = this.context.userTypeMap.getUserType(requester?.userType);

    // compareUserTypeLevels will compare the first userType to the second. If the first
    // is lower than the second, it will return a value less than 1.
    if (this.context.userTypeMap.compareUserTypeLevels(requesterType, deletedUser.userType) < 0) {
      this.send400Error(ctx, 'Cannot delete a user of a higher level');
      return;
    }

    try {
      await this.dataController.deleteUser(body.id);
    } catch(e) {
      this.send400Error(ctx, 'User does not exist');
      return;
    }

    ctx.body = {
      msg: `user id ${body.id} deleted`,
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
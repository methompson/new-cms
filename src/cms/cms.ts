import * as Router from 'koa-router';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

import {
  CMSContext,
  UserType,
  UserToken,
  UserTypeMap,
  NewUser,
  User,
  NewBlogPost,
  BlogPost,
  BlogMeta,
  Page,
  NewPage,
  PageMeta,
} from '@dataTypes';
import { DataController } from '@root/data-controllers/interfaces';
import ErrorHandler from './error-handler';
import { useRouteProtection } from './route-protection';
import { ParameterizedContext } from 'koa';
import { EmailExistsException, InsufficientPermissionsException, UserExistsException } from '@root/exceptions/user-exceptions';
import { InvalidDataControllerException } from '@root/exceptions/cms-exceptions';
import { BlogAlreadyExistsException, BlogDoesNotExistException, BlogSlugExistsException } from '@root/exceptions/blog-exceptions';
import { InvalidResultException } from '@root/exceptions/data-controller-exceptions';

class CMS extends ErrorHandler {
  dataController: DataController;
  mainRouter: Router;

  blogRouter: Router;
  userRouter: Router;
  pageRouter: Router;

  context: CMSContext;

  theContext: CMS;

  // 15 minute timeout for password tokens
  private PASSWORD_TOKEN_TIMEOUT: number = 1000 * 60 * 15;

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

    try {
      const isNoUsers = await this.dataController.userController.isNoUsers();
      if (isNoUsers) {
        const u: NewUser = {
          username: 'admin',
          email: 'admin@admin.admin',
          firstName: 'admin',
          lastName: 'admin',
          userType: this.context.userTypeMap.getUserType('SuperAdmin'),
          passwordHash: this.hashPassword('password'),
          userMeta: {},
          enabled: true,
        };

        await this.dataController.userController.addUser(u);
      }
    } catch(e) {
      console.log(`Error during init: ${e}`);
      process.exit();
    }

    this.blogRouter = this.initBlogRouter();
    this.userRouter = this.initUserRouter();
    this.pageRouter = this.initPageRouter();

    const r = new Router();

    r.use('/user', this.userRouter.routes());
    r.use('/blog', this.blogRouter.routes());
    r.use('/page', this.pageRouter.routes());

    this.mainRouter = r;
  }

  private initBlogRouter(): Router {
    const writerUserType = this.context.userTypeMap.getUserType('Writer');
    const r = new Router();

    r.get(
      '/id',
      async (ctx, next) => this.getBlogPostById(ctx, next),
    );

    r.get(
      '/slug',
      async (ctx, next) => this.getBlogPostBySlug(ctx, next),
    );

    r.get(
      '/posts',
      async (ctx, next) => this.getPaginatedBlogPosts(ctx, next, false),
    );

    r.get(
      '/posts-admin',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.getPaginatedBlogPosts(ctx, next, true),
    );

    r.get('/posts-admin-meta',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.getPaginatedBlogMeta(ctx, next, true),
    );

    r.post(
      '/add',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.addNewBlogPost(ctx, next),
    );

    r.post(
      '/edit',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.editBlogPost(ctx, next),
    );

    r.post(
      '/delete',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.deleteBlogPost(ctx, next),
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
      '/updatePassword',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, adminUserType),
      async (ctx, next) => this.updatePassword(ctx, next),
    );

    r.post(
      '/updatePasswordWithToken',
      async (ctx, next) => this.filterByUserType(ctx, next, adminUserType),
      async (ctx, next) => this.updatePasswordWithToken(ctx, next),
    );

    r.post(
      '/getPasswordResetToken',
      async (ctx, next) => this.filterByUserType(ctx, next, adminUserType),
      async (ctx, next) => this.getPasswordResetToken(ctx, next),
    );

    r.post(
      '/delete',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, adminUserType),
      async (ctx, next) => this.deleteUser(ctx, next),
    );

    return r;
  }

  private initPageRouter(): Router {
    const writerUserType = this.context.userTypeMap.getUserType('Writer');

    const r = new Router();

    r.get(
      '/id',
      async (ctx, next) => this.getPageById(ctx, next),
    );

    r.get(
      '/slug',
      async (ctx, next) => this.getPageBySlug(ctx, next),
    );

    r.get(
      '/pages-admin',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.getPageMeta(ctx, next),
    );

    r.post(
      '/add',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.addNewPage(ctx, next),
    );

    r.post(
      '/edit',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.editPage(ctx, next),
    );

    r.post(
      '/delete',
      useRouteProtection(),
      async (ctx, next) => this.filterByUserType(ctx, next, writerUserType),
      async (ctx, next) => this.deletePage(ctx, next),
    );

    return r;
  }

  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, 12);
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

    await next();
  }

  /*************************************************************************************
   * User Routes
   ********************************************************************************** */

  private async logUserIn(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body;

    if ( typeof body?.username !== 'string'
      || typeof body?.password !== 'string'
    ) {
      this.send400Error(ctx, 'Invalid Credentials');
      return;
    }

    let user: User;
    try {
      user = await this.dataController.userController.getUserByUsername(body.username);
    } catch(e) {
      this.send401Error(ctx, 'Invalid Credentials');
      return;
    }

    if (user.enabled !== true) {
      this.send401Error(ctx, 'Invalid Credentials');
      return;
    }

    if (!bcrypt.compareSync(body.password, user.passwordHash)) {
      this.send401Error(ctx, 'Invalid Credentials');
      return;
    }

    const secret = process.env.jwt_secret ?? 'default_secret';

    const claims: UserToken = {
      username: user.username,
      userType: user.userType.name,
      userId: user.id,
    };

    const token: string = jwt.sign(
      claims,
      secret,
      {
        algorithm: 'HS256',
        expiresIn: '12h',
      },
    );

    ctx.body = {
      token,
    };

    next();
  }

  private async getUserById(ctx: ParameterizedContext, next: () => Promise<any>) {
    const id = ctx?.query?.id;

    if (typeof id !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let user: User;
    try {
      user = await this.dataController.userController.getUserById(id);
    } catch(e) {
      this.send400Error(ctx, 'Invalid user ID provided');
      return;
    }

    ctx.body = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };

    await next();
  }

  private async getUserByUserName(ctx: ParameterizedContext, next: () => Promise<any>) {
    const username = ctx?.query?.username;

    if (typeof username !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let user: User;

    try {
      user = await this.dataController.userController.getUserByUsername(username);

    } catch (e) {
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

    // Let's construct a new user to make sure the user inputs are correct
    try {
      // Let's hash a password first.
      if (typeof newUser?.password !== 'string') {
        throw new Error();
      }

      const password = this.hashPassword(newUser.password);

      u = NewUser.fromJson({
        ...newUser,
        password,
      }, this.context.userTypeMap);
    } catch(e) {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    // If we get here, let's construct a regular user and hash the
    // new user's password.
    let savedUser: User;


    try {
      savedUser = await this.dataController.userController.addUser(u);
    } catch (e) {
      if (e instanceof UserExistsException) {
        this.send400Error(ctx, `Username already exists`);
      } else if(e instanceof EmailExistsException) {
        this.send400Error(ctx, `Email already exists`);
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

    await next();
  }

  /**
   * Does not edit the user's password
   * @param ctx
   * @param next
   * @returns
   */
  private async editUser(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body?.user;

    if (typeof body?.id !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    // We prevent a user from editing a user of a higher level. e.g. admin user types
    // cannot edit super admins.
    let currentEditedUser: User;
    try {
      currentEditedUser = await this.dataController.userController.getUserById(body.id);
    } catch(e) {
      this.send400Error(ctx, 'User does not exist');
      return;
    }

    const userTypeMap = this.context.userTypeMap;

    // We use filterByUserType to make sure that the userType actually exists.
    let requester: UserToken;

    try {
      requester = UserToken.parse(ctx?.state?.user);
    } catch(e) {
      // We're unlikely to hit this, but just in case...
      this.send400Error(ctx, 'Invalid JWT');
      return;
    }

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
      body?.userMeta ?? currentEditedUser.userMeta,
      body?.enabled ?? currentEditedUser.enabled,
      currentEditedUser.passwordResetToken,
      currentEditedUser.passwordResetDate,
      currentEditedUser.dateAdded,
      Date.now(),
    );

    let result: User;

    try {
      result = await this.dataController.userController.editUser(editedUser);
    } catch (e) {
      let msg: string = '';
      if (e instanceof EmailExistsException) {
        msg += 'Email already exists for another user.';
      } else if (e instanceof UserExistsException) {
        msg += 'Username already exists for another user.';
      } else {
        msg += `${e}`;
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

  private async updatePassword(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body?.user;

    if (typeof body?.id !== 'string'
      || typeof body?.newPassword !== 'string'
      || typeof body?.oldPassword !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    if (!this.validatePassword(body.newPassword)) {
      this.send400Error(ctx, 'Invalid Password. Password must be 8 characters or longer');
      return;
    }

    // We prevent a user from editing a user of a higher level. e.g. admin user types
    // cannot edit super admins.
    let user: User;
    try {
      user = await this.dataController.userController.getUserById(body.id);
    } catch(e) {
      this.send400Error(ctx, 'User does not exist');
      return;
    }

    // We check the old password to make sure it's correct
    if (!bcrypt.compareSync(body.oldPassword, user.passwordHash)) {
      this.send401Error(ctx, 'Invalid Credentials');
      return;
    }

    const userErr = this.canUpdatePassword(ctx, user);
    if (userErr.length > 0) {
      this.send400Error(ctx, userErr);
      return;
    }

    try {
      await this.dataController.userController.updatePassword(
        body.id,
        this.hashPassword(body.newPassword),
      );
    } catch (e) {
      const msg = `${e}`;

      this.send400Error(ctx, msg);
      return;
    }

    ctx.body = {
      message: 'Password Successfully Updated',
    };

    next();
  }

  private canUpdatePassword(ctx: ParameterizedContext, currentEditedUser: User): string {
    const userTypeMap = this.context.userTypeMap;

    // We use filterByUserType to make sure that the userType actually exists.
    let requester: UserToken;

    try {
      requester = UserToken.parse(ctx?.state?.user);
    } catch(e) {
      // We're unlikely to hit this, but just in case...
      return 'Invalid JWT';
    }

    const requesterType = userTypeMap.getUserType(requester?.userType);

    // compareUserTypeLevels will compare the first userType to the second. If the first
    // is lower than the second, it will return a value less than 1.
    if (userTypeMap.compareUserTypeLevels(requesterType, currentEditedUser.userType) < 0) {
      return 'Cannot edit a user of a higher level';
    }

    return '';
  }

  /**
   * Used to validate whether a password is correct. Any rules that you want
   * to apply to a password should be here
   *
   * @param newPassword string
   * @returns boolean
   */
  private validatePassword(newPassword: string): boolean {
    return newPassword.length >= 8;
  }

  private async getPasswordResetToken(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body?.user;

    if (typeof body?.id !== 'string'
      || typeof body?.password !== 'string'
    ) {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }
  }

  private async updatePasswordWithToken(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body?.user;

    if (typeof body?.id !== 'string'
      || typeof body?.newPassword !== 'string'
      || typeof body?.passwordToken !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    if (!this.validatePassword(body.newPassword)) {
      this.send400Error(ctx, 'Invalid Password. Password must be 8 characters or longer');
      return;
    }

    // We prevent a user from editing a user of a higher level. e.g. admin user types
    // cannot edit super admins.
    let user: User;
    try {
      user = await this.dataController.userController.getUserById(body.id);
    } catch(e) {
      this.send400Error(ctx, 'User does not exist');
      return;
    }

    if (user.passwordResetToken !== body.passwordResetToken) {
      this.send400Error(ctx, 'Invalid password reset token');
      return;
    }

    const timeout: Date = new Date(Date.now() - this.PASSWORD_TOKEN_TIMEOUT);
    const passwordResetDate = new Date(user.passwordResetDate);

    if (passwordResetDate < timeout) {
      this.send400Error(ctx, 'Password reset token has expired');
      return;
    }

    const userErr = this.canUpdatePassword(ctx, user);
    if (userErr.length > 0) {
      this.send400Error(ctx, userErr);
      return;
    }

    try {
      await this.dataController.userController.updatePassword(
        body.id,
        this.hashPassword(body.password),
      );
    } catch (e) {
      const msg = `${e}`;

      this.send400Error(ctx, msg);
      return;
    }

    ctx.body = {
      message: 'Password Successfully Updated',
    };

    next();
  }

  private async deleteUser(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body?.user;

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
    let deletedUser: User;
    try {
      deletedUser = await this.dataController.userController.getUserById(body.id);
    } catch(e) {
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
      await this.dataController.userController.deleteUser(body.id);
    } catch(e) {
      this.send400Error(ctx, 'User does not exist');
      return;
    }

    ctx.body = {
      msg: `user id ${body.id} deleted`,
    };

    next();
  }

  /*************************************************************************************
   * Blog Routes
   ********************************************************************************** */

  private async getBlogPostById(ctx: ParameterizedContext, next: () => Promise<any>) {
    const id = ctx?.query?.id;

    if (typeof id !== 'string' && typeof id !== 'number') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let post: BlogPost;

    try {
      post = await this.dataController.blogController.getBlogPostById(`${id}`);
    } catch (e) {
      if (e instanceof InvalidResultException) {
        this.send500Error(ctx, `Server error: ${e.message}`);
      } else if (e instanceof BlogDoesNotExistException) {
        this.send404Error(ctx, 'Blog Post Does Not Exist');
      } else {
        this.send400Error(ctx, 'Invalid data provided');
      }

      return;
    }

    ctx.body = {
      blogPost: {
        ...post,
      },
    };

    next();
  }

  private async getBlogPostBySlug(ctx: ParameterizedContext, next: () => Promise<any>) {
    const slug = ctx?.query?.slug;

    if (typeof slug !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let post: BlogPost;

    try {
      post = await this.dataController.blogController.getBlogPostBySlug(slug);
    } catch (e) {
      if (e instanceof InvalidResultException) {
        this.send500Error(ctx, `Server error: ${e.message}`);
      } else if (e instanceof BlogDoesNotExistException) {
        this.send404Error(ctx, 'Blog Post Does Not Exist');
      } else {
        this.send400Error(ctx, 'Invalid data provided');
      }

      return;
    }

    ctx.body = {
      blogPost: {
        ...post,
      },
    };

    next();
  }

  private async getPaginatedBlogPosts(ctx: ParameterizedContext, next: () => Promise<any>, admin: boolean = false) {
    const queryParams = ctx?.query;

    const paginationStr = typeof queryParams?.pagination === 'string'
      ? queryParams.pagination
      : '10';
    const pageStr = typeof queryParams?.page === 'string'
      ? queryParams.page
      : '1';

    const pagination = parseInt(paginationStr, 10);
    const page = parseInt(pageStr, 10);

    let posts: BlogPost[];

    try {
      posts = await this.dataController.blogController.getBlogPosts(pagination, page, admin);
    } catch (e) {
      if (e instanceof InvalidResultException) {
        this.send500Error(ctx, `Server error: ${e.message}`);
      } else {
        this.send400Error(ctx, 'Invalid data provided');
      }

      return;
    }

    ctx.body = {
      posts,
    };

    next();
  }

  private async getPaginatedBlogMeta(ctx: ParameterizedContext, next: () => Promise<any>, admin: boolean = false) {
    // Very large value
    // const pagination = 18446744073709551615;
    const pagination = Math.pow(2, 53);
    const page = 1;

    let posts: BlogPost[];

    try {
      posts = await this.dataController.blogController.getBlogPosts(pagination, page, admin);
    } catch (e) {
      if (e instanceof InvalidResultException) {
        this.send500Error(ctx, `Server error: ${e.message}`);
      } else {
        this.send400Error(ctx, 'Invalid data provided');
      }

      return;
    }

    const meta: BlogMeta[] = [];

    posts.forEach((p) => {
      meta.push(p.blogMeta);
    });

    ctx.body = {
      psts: meta,
    };

    next();
  }

  private async addNewBlogPost(ctx: ParameterizedContext, next: () => Promise<any>) {
    const postData = ctx?.request?.body?.blog;

    let p: NewBlogPost;

    try {
      p = NewBlogPost.fromJson(postData);
    } catch(e) {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let savedPost: BlogPost;
    try {
      savedPost = await this.dataController.blogController.addBlogPost(p);
    } catch(e) {
      if (e instanceof BlogSlugExistsException) {
        this.send400Error(ctx, 'Blog Slug Already Exists');
      } else {
        this.send400Error(ctx, 'Add error');
      }

      return;
    }

    ctx.body = {
      ...savedPost,
    };

    next();
  }

  private async editBlogPost(ctx: ParameterizedContext, next: () => Promise<any>) {
    const postData = ctx?.request?.body?.blog;

    let p: BlogPost;

    try {
      p = BlogPost.fromEditJson(postData);
    } catch(e) {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let savedPost: BlogPost;
    try {
      savedPost = await this.dataController.blogController.editBlogPost(p);
    } catch(e) {
      let errMsg = 'Edit Error';
      if (e instanceof BlogDoesNotExistException) {
        errMsg += ': Blog entry does not exist';
      } else if (e instanceof BlogSlugExistsException) {
        errMsg += ': Blog Slug already exists';
      }

      this.send400Error(ctx, errMsg);

      return;
    }

    ctx.body = {
      ...savedPost,
    };

    next();
  }

  private async deleteBlogPost(ctx: ParameterizedContext, next: () => Promise<any>) {
    const id = ctx?.request?.body?.blog?.id;

    if (typeof id !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    try {
      await this.dataController.blogController.deleteBlogPost(id);
    } catch(e) {
      this.send400Error(ctx, 'Blog Post Does Not Exist');
      return;
    }

    ctx.body = {
      msg: `Blog Post id ${id} deleted`,
    };

    next();
  }

  /*************************************************************************************
   * Page Routes
   ********************************************************************************** */

  private async getPageById(ctx: ParameterizedContext, next: () => Promise<any>) {
    const id = ctx?.query?.id;

    if (typeof id !== 'string' && typeof id !== 'number') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let page: Page;

    try {
      page = await this.dataController.pageController.getPageById(`${id}`);
    } catch (e) {
      if (e instanceof InvalidResultException) {
        this.send500Error(ctx, `Server error: ${e.message}`);
      } else if (e instanceof BlogDoesNotExistException) {
        this.send404Error(ctx, 'Page Does Not Exist');
      } else {
        this.send400Error(ctx, 'Invalid data provided');
      }

      return;
    }

    ctx.body = {
      page: {
        ...page,
      },
    };

    next();
  }

  private async getPageBySlug(ctx: ParameterizedContext, next: () => Promise<any>) {
    const slug = ctx?.query?.slug;

    if (typeof slug !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let page: Page;

    try {
      page = await this.dataController.pageController.getPageBySlug(`${slug}`);
    } catch (e) {
      if (e instanceof InvalidResultException) {
        this.send500Error(ctx, `Server error: ${e.message}`);
      } else if (e instanceof BlogDoesNotExistException) {
        this.send404Error(ctx, 'Page Does Not Exist');
      } else {
        this.send400Error(ctx, 'Invalid data provided');
      }

      return;
    }

    ctx.body = {
      page: {
        ...page,
      },
    };

    next();
  }

  private async getPageMeta(ctx: ParameterizedContext, next: () => Promise<any>) {
    let meta: PageMeta[];

    try {
      meta = await this.dataController.pageController.getPageMeta();
    } catch (e) {
      if (e instanceof InvalidResultException) {
        this.send500Error(ctx, `Server error: ${e.message}`);
      } else if (e instanceof BlogDoesNotExistException) {
        this.send404Error(ctx, 'Page Does Not Exist');
      } else {
        this.send400Error(ctx, 'Invalid data provided');
      }

      return;
    }

    ctx.body = {
      pages: meta,
    };

    next();
  }

  private async addNewPage(ctx: ParameterizedContext, next: () => Promise<any>) {
    const pageData = ctx?.request?.body?.page;

    let p: NewPage;

    try {
      p = NewPage.fromJson(pageData);
    } catch(e) {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let savedPage: Page;
    try {
      savedPage = await this.dataController.pageController.addPage(p);
    } catch(e) {
      this.send400Error(ctx, 'Add Error');
      return;
    }

    ctx.body = {
      ...savedPage,
    };

    next();
  }

  private async editPage(ctx: ParameterizedContext, next: () => Promise<any>) {
    const pageData = ctx?.request?.body?.page;

    ctx.body = {
      msg: ctx.originalUrl,
    };

    let p: Page;

    try {
      p = Page.fromJson(pageData);
    } catch(e) {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    let editPage: Page;
    try {
      editPage = await this.dataController.pageController.editPage(p);
    } catch (e) {
      this.send400Error(ctx, 'Error Editing Page');
      return;
    }

    ctx.body = {
      ...editPage,
    };

    next();
  }

  private async deletePage(ctx: ParameterizedContext, next: () => Promise<any>) {
    const id = ctx?.request?.body?.page?.id;

    if (typeof id !== 'string') {
      this.send400Error(ctx, 'Invalid data provided');
      return;
    }

    try {
      await this.dataController.pageController.deletePage(id);
    } catch(e) {
      this.send400Error(ctx, 'Blog Post Does Not Exist');
      return;
    }

    ctx.body = {
      msg: `Blog Post id ${id} deleted`,
    };

    next();
  }
}

export default CMS;
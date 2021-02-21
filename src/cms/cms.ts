import * as Router from 'koa-router';

import { CMSContext, UserTypeMap } from '@dataTypes';
import { DataController } from '@root/data-controllers/interfaces';
import ErrorHandler from './error-handler';
import { useRouteProtection } from './route-protection';
import { ParameterizedContext } from 'koa';

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
    this.blogRouter = this.initBlogRouter();
    this.userRouter = this.initUserRouter();

    const userTypeMap = new UserTypeMap();

    this.context = {
      userTypeMap,
    };

    await this.dataController.init(this.context);

    const r = new Router();

    r.use('/user', this.userRouter.routes());
    r.use('/blog', this.blogRouter.routes());

    this.mainRouter = r;
  }

  private initBlogRouter(): Router {
    const r = new Router();

    r.get('/id', async (ctx, next) => {
      ctx.body = {
        msg: '/id',
      };

      next();
    });

    r.get('/slug', async (ctx, next) => {
      ctx.body = {
        msg: '/slug',
      };

      next();
    });

    r.post('/add', async (ctx, next) => {
      ctx.body = {
        msg: '/add',
      };

      next();
    });

    r.post('/edit', async (ctx, next) => {
      ctx.body = {
        msg: '/edit',
      };

      next();
    });

    r.post('/delete', async (ctx, next) => {
      ctx.body = {
        msg: '/delete',
      };

      next();
    });

    return r;
  }

  private initUserRouter(): Router {
    const r = new Router();

    r.post(
      '/login',
      async (ctx, next) => this.logUserIn(ctx, next),
    );

    r.get(
      '/id',
      useRouteProtection(),
      async (ctx, next) => this.getUserById(ctx, next),
    );

    r.get(
      '/username',
      useRouteProtection(),
      async (ctx, next) => this.getUserByUserName(ctx, next),
    );

    r.post(
      '/add',
      useRouteProtection(),
      // async (ctx, next) => useRouteProtection(),
      async (ctx, next) => this.addUser(ctx, next),
    );

    return r;
  }

  async logUserIn(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body;

    if ( typeof body?.username !== 'string'
      || typeof body?.password !== 'string'
    ) {
      this.send401Error(ctx, 'Invalid Credentials');
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

  async getUserById(ctx: ParameterizedContext, next: () => Promise<any>) {
    const body = ctx?.request?.body;

    if (typeof body?.id !== 'string') {
      this.send401Error(ctx, 'Invalid data provided');
      return;
    }

    const user = await this.dataController.getUserById(body.id);

    if (user == null) {
      this.send401Error(ctx, 'Invalid user ID provided');
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

  async getUserByUserName(ctx: ParameterizedContext, next: () => Promise<any>) {
    ctx.body = {
      msg: '/username',
    };

    next();
  }

  async addUser(ctx: ParameterizedContext, next: () => Promise<any>) {
    ctx.body = {
      msg: '/add',
    };

    next();
  }
}

export default CMS;
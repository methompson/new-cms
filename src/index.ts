// tslint:disable-next-line:no-var-requires
require('module-alias/register');
// tslint:disable-next-line:no-var-requires
require('dotenv').config();

import * as Koa from 'koa';
import * as Router from 'koa-router';

import * as logger from 'koa-logger';
import * as json from 'koa-json';
import * as bodyParser from 'koa-bodyparser';

import { CMS } from './cms';
import { BasicDataController } from './data-controllers';

/**
 * The app initialization is asynchronous, so we wrap all of our main app
 * logic into an async function and run it immediately.
 */
(async function startApp() {
  const app = new Koa();
  const router = new Router();

  app.use(logger());
  app.use(json());
  app.use(bodyParser());

  let cms: CMS;

  try {
    const dc = new BasicDataController();

    cms = new CMS(dc);
    await cms.init();
  } catch (e) {
    // handle accordingly
    console.log('Unable to instance data controller', e);
    process.exit(1);
  }

  router.use('/api', cms.mainRouter.routes());

  // Custom 401 handling if you don't want to expose koa-jwt errors to users
  app.use(async (ctx, next) => {
    return next()
      .catch((err) => {
        if (401 === err.status) {
          ctx.status = 401;
          ctx.body = {
            error: 'Protected resource. Use Authorization header to get access'
          };
        } else {
          throw err;
        }
      });
  });

  router.get('/',
    async (ctx, next) => {
      ctx.body = {
        msg: 'Hello, World!',
      };

      await next();
    }
  );

  app
    .use(router.routes())
    .use(router.allowedMethods());

  app.listen(3000, () => {
    console.log('Koa Started');
  });

})();
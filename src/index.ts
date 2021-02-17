import * as dotenv from 'dotenv';

import * as Koa from 'koa';
import * as Router from 'koa-router';

import * as logger from 'koa-logger';
import * as json from 'koa-json';
import * as bodyParser from 'koa-bodyparser';

import {user, blog} from './routes';

dotenv.config();

const app = new Koa();
const router = new Router();

app.use(logger());

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

router.get('/', async (ctx, next) => {
  ctx.body = {
    msg: 'Hello, World!',
  };

  await next();
});

router.use('/user', user.routes());
router.use('/blog', blog.routes());

app.use(json());
app.use(bodyParser());

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Koa Started');
});
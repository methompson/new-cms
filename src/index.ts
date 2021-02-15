import * as Koa from 'koa';
import * as Router from 'koa-router';

import * as logger from 'koa-logger';
import * as json from 'koa-json';
import * as bodyParser from 'koa-bodyparser';

import {user, blog} from './routes';

const app = new Koa();
const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.body = {
    msg: 'Hello, World!',
  };

  await next();
});

router.use('/user', user.routes());
router.use('/blog', blog.routes());

app.use(json());
app.use(logger());
app.use(bodyParser());

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Koa Started');
});
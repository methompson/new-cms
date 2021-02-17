import * as Router from 'koa-router';

import useProtection from './route-protection';

const router = new Router();

router.get(
  '/',
  async(ctx, next) => {
    ctx.body = {
      msg: 'user',
    };
  }
);

router.get(
  '/protected',
  useProtection(),
  async(ctx, next) => {
    ctx.body = {
      msg: 'protected',
    };
  }
);

export default router;
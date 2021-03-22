import * as Koa from 'koa';

class ErrorHandler {
  sendError(ctx: Koa.ParameterizedContext, msg: string, error: number) {
    ctx.status = error;
    ctx.body = {
      error: msg,
    };
  }

  send400Error(ctx: Koa.ParameterizedContext, msg: string) {
    this.sendError(ctx, msg, 400);
  }

  send401Error(ctx: Koa.ParameterizedContext, msg: string) {
    this.sendError(ctx, msg, 401);
  }
  send403Error(ctx: Koa.ParameterizedContext, msg: string) {
    this.sendError(ctx, msg, 403);
  }
  send404Error(ctx: Koa.ParameterizedContext, msg: string) {
    this.sendError(ctx, msg, 404);
  }
  send500Error(ctx: Koa.ParameterizedContext, msg: string) {
    this.sendError(ctx, msg, 500);
  }
}

export default ErrorHandler;
import jwt = require("koa-jwt");

const secret = process.env.jwt_secret ?? 'default_secret';

function useProtection() {
  return jwt({secret});
}

export default useProtection;
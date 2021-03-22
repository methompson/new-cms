import UserMap from './user-map';
import UserType from './usertype';

const defaultUserTypes: UserMap = {
  'SuperAdmin': new UserType('SuperAdmin', Number.MAX_SAFE_INTEGER),
  'Admin': new UserType('Admin', Number.MAX_SAFE_INTEGER - 1),
  'Editor': new UserType('Editor', Math.pow(2, 32)),
  'Writer': new UserType('Writer', Math.pow(2, 16)),
  'Viewer': new UserType('Viewer', Math.pow(2, 4)),
};

export default defaultUserTypes;
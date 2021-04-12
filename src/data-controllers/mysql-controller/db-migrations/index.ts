import Migration from './migration';

import migration_00001 from './00001-initial-users-table';

const migrations: Migration[] = [
  migration_00001,
];

export default migrations;
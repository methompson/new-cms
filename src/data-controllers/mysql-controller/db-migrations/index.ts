import Migration from './migration';

import Migration00001 from './00001-initial-users-table';
import Migration00002 from './00002-initial-blog-table';
import Migration00003 from './00003-initial-page-table';

const showWarnings = false;

const migrations: Migration[] = [
  new Migration00001(showWarnings),
  new Migration00002(showWarnings),
  new Migration00003(showWarnings),
];

export default migrations;
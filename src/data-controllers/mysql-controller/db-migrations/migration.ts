import { Pool } from 'mysql2';

interface Migration {
  doMigration: (mysqlPool: Pool) => Promise<void>;
}

export default Migration;
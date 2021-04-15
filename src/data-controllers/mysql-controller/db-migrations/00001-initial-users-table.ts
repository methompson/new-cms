import { Pool } from 'mysql2';

import Migration from './migration';

class MyMigration extends Migration {
  constructor(showWarnings: boolean = false) {
    super('00001-initial-users-table', showWarnings);
  }

  async doMigration(mysqlPool: Pool) {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        firstName VARCHAR(255) NOT NULL DEFAULT "",
        lastName VARCHAR(255) NOT NULL DEFAULT "",
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        userType VARCHAR(64) NOT NULL DEFAULT "",
        password VARCHAR(255) NOT NULL,
        passwordResetToken CHAR(64) NOT NULL DEFAULT "",
        passwordResetDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        userMeta JSON NOT NULL DEFAULT (JSON_OBJECT()),
        dateAdded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        dateUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        enabled BOOLEAN NOT NULL
      )
    `;

    const promisePool = mysqlPool.promise();

    let results;

    try {
      results = await promisePool.execute(query);
    } catch(e) {
      this.onError(e);
    }

    this.onSuccess();

    if (results.warningStatus > 0 && this.showWarnings) {
      this.onWarning(mysqlPool);
    }
  }
}

export default MyMigration;
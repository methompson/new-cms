import { Pool } from 'mysql2';

import Migration from './migration';

class MyMigration extends Migration {
  constructor(showWarnings: boolean = false) {
    super('00003-initial-page-table', showWarnings);
  }

  async doMigration(mysqlPool: Pool) {
    const query = `
      CREATE TABLE IF NOT EXISTS pages (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(512) NOT NULL,
        slug VARCHAR(512) UNIQUE NOT NULL,
        published BOOLEAN NOT NULL DEFAULT FALSE,
        content JSON NOT NULL DEFAULT (JSON_ARRAY()),
        meta JSON NOT NULL DEFAULT (JSON_OBJECT()),
        authorId INT,
        lastUpdatedBy INT,
        dateAdded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        dateUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (authorId)
          REFERENCES users(id)
          ON DELETE CASCADE,
        FOREIGN KEY (lastUpdatedBy)
          REFERENCES users(id)
          ON DELETE CASCADE
      )
    `;

    const promisePool = mysqlPool.promise();

    let results;

    try {
      [results] = await promisePool.execute(query);
    } catch(e) {
      this.onError(e);
    }

    if (results.warningStatus > 0 && this.showWarnings) {
      this.onWarning(mysqlPool);
    }

    this.onSuccess();
  }
}

export default MyMigration;
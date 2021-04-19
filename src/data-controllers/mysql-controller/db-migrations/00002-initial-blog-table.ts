import { Pool } from 'mysql2';

import Migration from './migration';

class MyMigration extends Migration {
  constructor(showWarnings: boolean = false) {
    super('00002-initial-blog-table', showWarnings);
  }

  async doMigration(mysqlPool: Pool) {
    const query = `
      CREATE TABLE IF NOT EXISTS blogPosts (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(512) NOT NULL,
        titleSlug VARCHAR(512) UNIQUE NOT NULL,
        content JSON NOT NULL DEFAULT (JSON_ARRAY()),
        preview TEXT NOT NULL,
        authorId INT,
        meta JSON NOT NULL DEFAULT (JSON_OBJECT()),
        published BOOLEAN NOT NULL DEFAULT FALSE,
        dateAdded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        dateUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (authorId)
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
import { Pool } from 'mysql2';

import Migration from './migration';

const migration: Migration = {
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

    const poolPromise = mysqlPool.promise();

    await poolPromise.execute(query);
    console.log(query);

  }
}

export default migration;
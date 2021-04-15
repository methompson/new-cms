import { Pool } from 'mysql2';

abstract class Migration {
  abstract doMigration(mysqlPool: Pool): Promise<void>;

  constructor(public name: string, public showWarnings: boolean = false) {}

  onSuccess() {
    console.log(`${this.name} migrated successfully`);
  }

  onError(err: string) {
    console.error(`${this.name} migrated unsuccessfully`);
    console.error(`${err}`);
    process.exit();
  }

  async onWarning(mysqlPool: Pool) {
    const query = 'SHOW WARNINGS';

    const promisePool = mysqlPool.promise();

    let results;
    try {
      [results] = await promisePool.query(query);
    } catch(e) {
      console.error(`${e}`);
    }

    if (!this.isTextRow(results[0])) {
      return;
    }

    console.log(results[0].Message);
  }

  isTextRow(tr: TextRow | any): tr is TextRow {
    const textRow = tr as TextRow;

    return textRow?.Code !== undefined && textRow?.Level !== undefined && textRow?.Message !== undefined;
  }
}

interface TextRow {
  Code: number;
  Level: string;
  Message: string;
}

export default Migration;
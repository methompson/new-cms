import { Pool, createPool, ResultSetHeader } from 'mysql2';

import { CMSContext } from '@dataTypes';

abstract class MySQLDataControllerBase {
  protected _constructionOptions: any;
  cmsContext: CMSContext;

  protected dbConnectionPool: Pool;

  constructor(connectionPool: Pool, cmsContext: CMSContext, options?: any) {
    this._constructionOptions = options ?? {};

    this.cmsContext = cmsContext;

    this.dbConnectionPool = connectionPool;
  }

  isResult(result: ResultSetHeader | any): result is ResultSetHeader {
    const rAsR = result as ResultSetHeader;

    return rAsR?.affectedRows !== undefined
      && rAsR?.insertId !== undefined;
  }
}

export default MySQLDataControllerBase;
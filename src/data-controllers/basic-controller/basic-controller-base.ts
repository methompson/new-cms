import { CMSContext } from '@dataTypes';

abstract class BasicDataControllerBase {
  protected _constructionOptions: any;
  cmsContext: CMSContext;

  protected _dataLocation: string;

  set dataLocation(loc: string) {
    this._dataLocation = loc;
  }

  get dataLocation(): string {
    const output = this._dataLocation ?? './';

    return output;
  }
}

export default BasicDataControllerBase;
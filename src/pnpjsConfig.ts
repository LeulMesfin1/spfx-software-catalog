import { SPFI, spfi, SPFx } from "@pnp/sp";
import type { WebPartContext } from '@microsoft/sp-webpart-base';

let _sp: SPFI | undefined;

export const getSP = (context: WebPartContext): SPFI => {
  if (!_sp) {
    _sp = spfi().using(SPFx(context));
  }
  return _sp;
};

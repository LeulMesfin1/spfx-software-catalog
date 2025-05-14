import { SPFI, spfi } from "@pnp/sp";
import { getSP } from "sp-preset";

let _sp: SPFI;

export const getSP = (context): SPFI => {
  if (!_sp) {
    _sp = spfi().using(SPFx(context));
  }
  return _sp;
};

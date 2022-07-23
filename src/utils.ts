import { debug as gongoDebug, debounce } from "gongo-client/lib/utils";
import type Debug from "gongo-client/node_modules/@types/debug";
const debug = gongoDebug.extend("react");

export { debounce, debug };

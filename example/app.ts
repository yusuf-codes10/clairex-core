import { ClaireX } from "../src";
import { userKey } from "./keys/test.cx";
import { purdy } from "./keys/users.cx";

new ClaireX(2300).unlock(new userKey()).unlock(purdy).listen();

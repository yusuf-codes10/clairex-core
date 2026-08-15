import { ClaireX } from "../src";
import { userKey } from "./keys/users.key";

new ClaireX(2300).unlock(new userKey()).listen();

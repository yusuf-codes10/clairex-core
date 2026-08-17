import { ClaireX } from "../src";
import { userKey } from "./keys/test.claire";
import { updateUserValidator } from "./validators/users/patchValidator";

new ClaireX(2300).unlock(new userKey()).listen();

import "../src/plugin/claire-loader";  // registers the plugin first
import { ClaireX } from "../src";
import { userKey } from "./keys/users.key";
import { UserKey } from "./keys/test.claire";
import { updateUserValidator } from "./validators/users/patchValidator";

new ClaireX(2300).unlock(new userKey()).listen();

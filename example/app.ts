import { ClaireX } from "../src";
import { userKey } from "./keys/test.claire";
import { hello } from './keys/posts.claire';

new ClaireX(2300).unlock(new userKey()).listen();

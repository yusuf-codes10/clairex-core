import { ClaireX } from "@clairex/core";
import { userKey } from "./keys/user.key.claire";

new ClaireX(3000).unlock(new userKey()).listen();

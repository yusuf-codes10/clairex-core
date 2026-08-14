import { ClaireX } from "../src";
import { userKey } from './cells/users.key';

const app = new ClaireX(2300);

app.mount(new userKey());

app.listen();
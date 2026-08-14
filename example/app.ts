import { ClaireX } from "../src";
import { userCell } from '../example/cells/users.cell';

const app = new ClaireX(2300);

app.mount(new userCell());

app.listen();
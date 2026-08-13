import { ClaireX } from "../src";
import { userController } from '../example/users.controller';

const app = new ClaireX(2300);

app.mount(new userController());

app.listen();
import { ClaireX } from "../src";
import { userController } from '../example/users.controller';

const app = new ClaireX(2300);

// need a way to mount the extends class here
app.mount(new userController());

app.listen();
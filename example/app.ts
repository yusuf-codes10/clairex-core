import { ClaireX } from "../src";
import { userController } from '../example/users.controller';
import { logger } from "./logger";
import { tester } from "./tester";

const app = new ClaireX(2300);

// need a way to mount the extends class here
app.mount(new userController());

// middlwares
app.use(new logger());
app.use(new tester());

app.listen();
import { ClaireX } from "../src";
import { userController } from '../example/users.controller';
import { logger } from "./logger";
import { tester } from "./tester";
import { global } from "./middlewares/global";

const app = new ClaireX(2300);

// need a way to mount the extends class here
app.mount(new userController());

app.use(new global());

// middlwares
// app.use(new logger());
// app.use(new tester());

app.listen();
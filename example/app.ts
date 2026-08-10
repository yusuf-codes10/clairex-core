import { ClaireX } from "../src";
import { userController } from '../example/users.controller';
import { logger } from "./logger";

const app = new ClaireX(2300);

// need a way to mount the extends class here
app.mount(new userController());

app.use(new logger());

app.listen();
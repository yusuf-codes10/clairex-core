import { ClaireController } from "../src/core/controller";
import { ClaireContext } from "../src/core/context";

const users = [
  { name: "Claire", age: 23 },
  { name: "John", age: 33 },
  { name: "Veronica", age: 28 },
];

export class userController extends ClaireController {

    constructor () {
        super('/users');
    }

    register () {
        this.routes('get', '/', this.getUsers);
    }

    private getUsers (c: ClaireContext) {
        return c.response.json(users);
    }
}
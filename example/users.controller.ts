import { ClaireController } from "../src/core/controller";
import { ClaireContext } from "../src/core/context";

type User = {
    name: string,
    age: number
}

const users: User[] = [
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
        this.routes('post', '/', this.createUser);
    }

    private getUsers (c: ClaireContext) {
        return c.response.json(users);
    }

    private async createUser  (c: ClaireContext) {
        const body = (await c.request.json()) as {name: string, age: number};
        users.push(body);
        return c.response.json(users);
    }
}
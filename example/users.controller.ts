import { ClaireController } from "../src/core/controller";
import { ClaireContext } from "../src/core/context";
import { ClaireException } from "../src/core/exception";

type User = {
    id: number,
    name: string,
    age: number
}

const users: User[] = [
  { id: 1, name: "Claire", age: 23 },
  { id: 2, name: "John", age: 33 },
  { id: 3, name: "Veronica", age: 28 },
];

export class userController extends ClaireController {

    constructor () {
        super('/users');
    }

    register () {
        this.routes('get', '/', this.getUsers);
        this.routes('post', '/', this.createUser);
        this.routes('get', '/:id', this.getUserById);
    }

    private getUsers (c: ClaireContext) {
        return c.response.json(users);
    }

    private getUserById (c: ClaireContext) {
        const {id} = c.request.params;
        console.log('id is: ', id);
        const foundUser = users.find(u => u.id === Number(id));
        if (!foundUser) throw new ClaireException(404, 'User not Found!');
        return c.response.json(foundUser);
    }

    private async createUser  (c: ClaireContext) {
        const body = (await c.request.json()) as {id: number, name: string, age: number};
        users.push(body);
        return c.response.json(users);
    }
}
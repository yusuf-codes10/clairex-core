import { ClaireKey } from "../../src/core/key";
import { ClaireContext } from "../../src/core/context";
import { ClaireException } from "../../src/core/exception";
import { logger } from "../logger";
import { middle } from "../middlewares/middle";
import { inner } from "../middlewares/inner";
import { userValidator } from "../validators/userValidator";

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

export class userKey extends ClaireKey {

    constructor () {
        super('/users', [new logger(), new middle()]);
    }

    register () {
        this.routes('get', '/', this.getUsers);
        this.routes('post', '/', this.createUser, [new inner(), new userValidator()]);
        this.routes('get', '/:id', this.getUserById);
        this.routes('patch', '/:id', this.updateUserName)
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
        // const body = (await c.request.json()) as {id: number, name: string, age: number};
        const body = c.valid<User>();
        if (users.find(u => u.id === body.id)) {
            return new ClaireException(400, 'User id already exists!').toResponse();
        }
        users.push(body);
        return c.response.json(users);
    }

    private updateUserName (c: ClaireContext) {
        // garb the user id
        const {id} = c.request.params;
        // grabing the name from the body
        const {name} = c.valid();

        const foundUser = users.find(u => u.id === Number(id));

        if (!foundUser) return new ClaireException(404, 'user not found!').toResponse();

        foundUser.name = name;

        return c.response.json(users);
    }
}
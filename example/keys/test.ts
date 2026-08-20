import { ClaireKey } from "../../src/core/key";
import { ClaireContext } from "../../src/core/context";
import { ClaireException } from "../../src/core/exception";
import { userValidator } from "../validators/user.validator.claire";

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
        super('/users');
    }

    register (): void {
        this.routes('get', '/', this.getUsers);
        this.routes('post', '/', this.createUser, [new userValidator()]);
        this.routes('get', '/:id', this.getUserById);
        this.routes('patch', '/:id', this.updateUserName, [new userValidator()]);
    }

    private getUsers (c: ClaireContext): Response {
        return c.response.json(users);
    }

    private getUserById (c: ClaireContext): Response {
        const {id} = c.request.params;
        console.log('id is: ', id);
        const foundUser = users.find(u => u.id === Number(id));
        if (!foundUser) throw new ClaireException(404, 'User not Found!');
        return c.response.json(foundUser);
    }

    private async createUser  (c: ClaireContext): Promise<Response>  {
        // const body = (await c.request.json()) as {id: number, name: string, age: number};
        const body = c.valid<User>();
        if (users.find(u => u.id === body.id)) {
            return new ClaireException(400, 'User id already exists!').toResponse();
        }
        users.push(body);
        return c.response.json(users);
    }

    private updateUserName (c: ClaireContext): Response {
        // garb the user id
        const {id} = c.request.params;
        // grabing the name from the body
        const { name } = c.valid<User>();

        const foundUser = users.find(u => u.id === Number(id));

        if (!foundUser) return new ClaireException(404, 'user not found!').toResponse();

        foundUser.name = name;

        return c.response.json(users);
    }

    private showSomething(): void {
        console.log('something');
    }
}
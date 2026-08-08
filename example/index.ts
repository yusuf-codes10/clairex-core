import { ClaireX } from "../src";
import { ClaireContext } from "../src/core/context";

const users = [
    { name: 'Claire', age: 23 },
    { name: 'John', age: 33 },
    { name: 'Veronica', age: 28}
]

const app = new ClaireX(3456);

app.get('/' , (c: ClaireContext) => {
    console.log(users);
    return c.response.json(users);
})

app.listen();
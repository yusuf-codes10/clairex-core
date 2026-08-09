import { ClaireX } from "../src";
import { ClaireContext } from "../src/core/context";

const users = [
  { name: "Claire", age: 23 },
  { name: "John", age: 33 },
  { name: "Veronica", age: 28 },
];

const app = new ClaireX(3456);

app.get("/", (c: ClaireContext) => {
  console.log(users);
  return c.response.json(users);
});

app.post("/", async (c: ClaireContext) => {
  // TODO: The real problem ClaireX will sovle
  const body = (await c.request.json()) as { name: string; age: number };
  users.push(body);
  return c.response.json(users);
});

// get user by id
app.get("/:name", (c: ClaireContext) => {
  const { name } = c.request.params;
  console.log("name is: ", name);
  if (!name) return c.response.text("Not found", 404);
  const foundUser = users.find((u) => u.name === name);
  return c.response.json(foundUser);
});

app.listen();

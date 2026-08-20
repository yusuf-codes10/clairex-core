/**
 * The User resource.
 *
 * ClaireX keeps types and validation as two explicit declarations:
 * this type is the compile-time shape, `userValidator` is the runtime shape.
 */
export type User = {
  id: number;
  name: string;
  age: number;
};

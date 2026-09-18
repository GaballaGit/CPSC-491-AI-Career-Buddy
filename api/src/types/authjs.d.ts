import "@auth/core/types";

declare module "@auth/core/types" {
  interface User {
    id: string;
  }

  interface Session {
    user: {
      id: string;
    } & Session["user"];
  }
}

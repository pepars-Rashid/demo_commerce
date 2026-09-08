import "@auth/core/types"

declare module "@auth/core/types" {
  interface User {
    role: "user" | "operationManager" | "superAdmin"
  }
}

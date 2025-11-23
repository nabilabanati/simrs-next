import { USERS } from "./users"

export function fakeLogin(username: string, password: string) {
  return USERS.find(
    (u) => u.username === username && u.password === password
  ) || null
}

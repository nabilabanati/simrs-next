import { ApiError } from "./error";

export function requireFields(body: any, fields: string[]) {
  for (const field of fields) {
    if (!body[field]) {
      throw new ApiError(`${field} is required`, 422);
    }
  }
}

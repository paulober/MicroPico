/**
 * Convert an unknown typed error to a string.
 *
 * @param err - The error to convert.
 * @returns The error as an appropriate string.
 */
export function unknownErrorToString(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  } else if (typeof err === "string") {
    return err;
  } else if (typeof err === "number" || typeof err === "boolean") {
    return err.toString();
  } else if (typeof err === "object") {
    return JSON.stringify(err);
  } else if (typeof err === "undefined") {
    return "Undefined error";
  } else {
    return "Unknown error";
  }
}

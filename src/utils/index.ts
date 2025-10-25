import { TIME_UNITS } from "@config/constants";
import { UNIT_OF_TIME } from "src/types";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatZodErrors(
  errors: Array<{ path: string; message: string }>,
) {
  return errors.reduce(
    (acc: string, err: any, idx: number) =>
      acc +
      `Error on path ${err.path}: ${err.message}${
        idx !== errors.length - 1 ? ", " : ""
      }`,
    "",
  );
}

export function convertTimeToMilliseconds(value: number, unit: UNIT_OF_TIME) {
  if (TIME_UNITS[unit as keyof typeof TIME_UNITS])
    return value * TIME_UNITS[unit as keyof typeof TIME_UNITS];
  return 0;
}

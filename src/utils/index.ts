export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumeric → dash
    .replace(/(^-|-$)+/g, ""); // trim starting/ending dashes
}

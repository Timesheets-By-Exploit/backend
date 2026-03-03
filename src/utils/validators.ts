import { z } from "zod";

/**
 * Regex for MongoDB ObjectId
 */
export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Zod schema for validated MongoDB ObjectId strings
 */
export const zObjectId = z.string().regex(objectIdRegex, "Invalid ID format");

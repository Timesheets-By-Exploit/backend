import { Router } from "express";
import validateResource from "@middlewares/validators";
import authenticate from "@middlewares/authenticate";
import requireRole from "@middlewares/requireRole";
import { USER_ROLES } from "@constants";
import {
  createTimeEntrySchema,
  startTimeEntrySchema,
  updateTimeEntrySchema,
} from "../time-entry.validators";
import {
  startTimeEntry,
  stopTimeEntry,
  createManualEntry,
  getActiveEntry,
  listEntries,
  updateEntry,
  deleteEntry,
} from "../time-entry.controller";

const timeEntryRouter = Router();

const allApprovedRoles = [
  USER_ROLES.OWNER,
  USER_ROLES.MANAGER,
  USER_ROLES.MEMBER,
  USER_ROLES.VIEWER,
];

timeEntryRouter.use(authenticate);
timeEntryRouter.use(requireRole(allApprovedRoles));

timeEntryRouter.post(
  "/start",
  validateResource(startTimeEntrySchema),
  startTimeEntry,
);
timeEntryRouter.post("/stop", stopTimeEntry);
timeEntryRouter.post(
  "/manual",
  validateResource(createTimeEntrySchema),
  createManualEntry,
);
timeEntryRouter.get("/active", getActiveEntry);
timeEntryRouter.get("/", listEntries);
timeEntryRouter.patch(
  "/:id",
  validateResource(updateTimeEntrySchema),
  updateEntry,
);
timeEntryRouter.delete("/:id", deleteEntry);

export default timeEntryRouter;

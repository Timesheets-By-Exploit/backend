export const USER_ROLES = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export const TASK_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  ARCHIVED: "ARCHIVED",
  ACTIVE: "ACTIVE", // Legacy default
} as const;

export const GLOBAL_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export const ORG_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export const MEMBERSHIP_STATUS = {
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
  PENDING: "PENDING",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
export type GlobalStatus = (typeof GLOBAL_STATUS)[keyof typeof GLOBAL_STATUS];
export type OrgStatus = (typeof ORG_STATUS)[keyof typeof ORG_STATUS];
export type MembershipStatus =
  (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

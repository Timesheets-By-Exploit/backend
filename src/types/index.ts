
export type UNIT_OF_TIME = "minutes" | "min" | "hours" | "hr" | "seconds" | "sec";

export interface IErrorPayload {
  success: boolean;
  error: string;
}
export interface ISuccessPayload<T> {
  success: boolean;
  data: T;
}
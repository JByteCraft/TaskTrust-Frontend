// src/lib/utils/response.util.ts
import type { ResponseConstant } from "../../constants/response.constant";

export const RESPONSE: Function = (
  status: number = 0,
  response: object = {},
  message: string = ""
): ResponseConstant => {
  return {
    status: status,
    response: response,
    message: message,
  };
};

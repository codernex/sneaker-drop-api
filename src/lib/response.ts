import { Response } from "express";

export interface ResponseBody {
  statusCode: number;
  success: boolean;
  message: string;
  data?: Record<string, any>;
  errors?: any;
}

export interface ResponseOptions {
  res: Response;
  message: string;
  statusCode?: number;
  data?: Record<string, any>;
  [key: string]: any;
}

export const successResponse = ({
  res,
  message,
  statusCode = 200,
  data,
  ...rest
}: ResponseOptions): Response => {
  const response: ResponseBody = {
    statusCode,
    success: true,
    message,
  };

  // Merge explicit `data` field first, then any extra spread keys
  const extra = { ...rest };
  // Remove non-serialisable Express internals that may leak via spread
  delete extra.res;

  if (data !== undefined || Object.keys(extra).length > 0) {
    response.data = { ...extra, ...data };
  }

  return res.status(statusCode).json(response);
};

/**
 * Type-guard: returns true when the handler returned a ResponseOptions object
 * (i.e., `{ res, message, ... }`) so requestHandler can call successResponse.
 */
export function isResponseOptions(obj: unknown): obj is ResponseOptions {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    "res" in obj &&
    "message" in obj &&
    typeof (obj as ResponseOptions).res?.status === "function" &&
    typeof (obj as ResponseOptions).message === "string"
  );
}

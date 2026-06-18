import { NextFunction, Response, Request } from "express";
import { isResponseOptions, successResponse } from "./response";
import { z } from "zod";

// ─── Shared response body shape ───────────────────────────────────────────────

export interface ResponseBody {
  statusCode: number;
  message: string;
  success?: boolean;
  errors?: any;
  data?: Record<string, any>;
}

// ─── ResponseOptions — returned by handlers instead of calling res.json() ─────

export interface ResponseOptions {
  res: Response;
  message: string;
  statusCode?: number;
  data?: Record<string, any>;
  [key: string]: any;
}

// ─── Typed Request ────────────────────────────────────────────────────────────

type CustomRequest<TQuery, TBody, TParams> = Request<
  TParams extends Record<string, string> ? TParams : Record<string, string>,
  any,
  TBody,
  TQuery
> & {
  user?: Record<string, unknown>;
};

// ─── Handler return type ──────────────────────────────────────────────────────
//
// Using a single Promise<union> instead of a union of Promises:
//   Promise<A> | Promise<B>  ← TypeScript requires the actual return to match
//                              exactly ONE member, so Promise<A | B> never fits.
//   Promise<A | B>           ← Promise<A | B> is assignable to this. ✓

type HandlerReturn<TResponse> = Promise<
  void | Response | NextFunction | ResponseOptions | TResponse | undefined
>;

type Handler<TQuery, TBody, TParams, TResponse = ResponseBody> = (
  req: CustomRequest<TQuery, TBody, TParams>,
  res: Response<TResponse>,
  next: NextFunction,
) => HandlerReturn<TResponse>;

// ─── requestHandler ───────────────────────────────────────────────────────────

/**
 * Wraps an Express route handler with:
 *  - Zod validation for query / body / params (each optional).
 *  - Automatic `successResponse` when the handler returns a ResponseOptions object.
 *  - Error forwarding to `next` for unhandled promise rejections.
 *
 * @example
 * export const getReservation = requestHandler(
 *   async (req, res) => {
 *     const data = await getReservationById(req.params.id);
 *     return { res, message: "OK", data };
 *   },
 *   { params: z.object({ id: z.string().min(1) }) },
 * );
 */
export const requestHandler = <TQuery, TBody, TParams>(
  handler: Handler<TQuery, TBody, TParams>,
  config?: {
    query?: z.ZodSchema<TQuery>;
    body?: z.ZodSchema<TBody>;
    params?: z.ZodSchema<TParams>;
  },
) => {
  return async (
    req: CustomRequest<TQuery, TBody, TParams>,
    res: Response<ResponseBody>,
    next: NextFunction,
  ): Promise<void> => {
    // ── Validate query ──────────────────────────────────────────────────────
    if (config?.query) {
      const result = config.query.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          statusCode: 400,
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }
      req.query = result.data as TQuery;
    }

    // ── Validate body ───────────────────────────────────────────────────────
    if (config?.body) {
      const result = config.body.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          statusCode: 400,
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }
      req.body = result.data as TBody;
    }

    // ── Validate params ─────────────────────────────────────────────────────
    if (config?.params) {
      const result = config.params.safeParse(req.params);
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          statusCode: 400,
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }
      // params is typed as Record<string, string> in Express, safe to cast
      req.params = result.data as any;
    }

    // ── Execute handler ─────────────────────────────────────────────────────
    try {
      const result = await Promise.resolve(handler(req, res, next));

      // If the handler returned { res, message, ... } call successResponse
      if (isResponseOptions(result)) {
        const {
          res: customRes,
          message,
          statusCode = 200,
          data,
          ...rest
        } = result;
        // Strip the `res` key from rest to avoid passing it as data
        delete rest.res;
        successResponse({ res: customRes, message, statusCode, data, ...rest });
      }
    } catch (err) {
      next(err);
    }
  };
};

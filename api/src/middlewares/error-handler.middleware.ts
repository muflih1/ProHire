import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes"
import type { $ZodIssue } from "zod/v4/core";

export function errorHandler(error: any, req: Request, res: Response, _next: NextFunction) {
  console.log(`[FATAL] path: ${req.path}:`, error)

  if (error instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({ errors: error.issues.map(serializeZodeError) })
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: { message: "Internal Server Error" } })
}

function serializeZodeError(err: $ZodIssue) {
  return {
    message: err.message,
    path: err.path.join('.'),
    code: err.code
  }
}
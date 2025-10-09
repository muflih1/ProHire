import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export function auth(req: Request, res: Response, next: NextFunction) {
  if (req.session == null) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: { message: 'Unauthorized' } })
  }

  return next()
}
import type { NextFunction, Request, Response } from "express";

export default function catchAsync(callbak: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return function handler(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(callbak(req, res, next)).catch(next)
  }
}
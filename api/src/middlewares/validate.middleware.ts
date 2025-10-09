import type { RequestHandler } from "express";
import type { ZodObject } from "zod";

export function validate(schema: ZodObject<any, any>): RequestHandler {
  return function handler(req, _res, next) {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
}
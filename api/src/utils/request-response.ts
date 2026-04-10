import {AsyncLocalStorage} from 'node:async_hooks';
import type {NextFunction, Request, Response} from 'express';
import * as cookie from 'cookie';

const eventStorage = new AsyncLocalStorage<{req: Request; res: Response}>();

export function requestContextHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  eventStorage.run({req, res}, next);
}

function getStore() {
  const event = eventStorage.getStore();
  if (event == null) {
    throw new Error('Request context not initialized. Did you forget to use requestContextHandler?');
  }
  return event;
}

export function getRequest() {
  return getStore().req;
}

export function getResponse() {
  return getStore().res;
}

export function getResponseHeader(name: string) {
  return getResponse().getHeader(name);
}

export function setResponseHeader(name: string, value: string) {
  getResponse().setHeader(name, value);
}

export function setCookie(
  name: string,
  value: string,
  options?: cookie.SerializeOptions,
) {
  const data = cookie.serialize(name, value, options);

  const prev = getResponseHeader('Set-Cookie') || [];
  const header = Array.isArray(prev) ? prev.concat(data) : [prev, data];

  setResponseHeader('Set-Cookie', header as any);
}

export function clearCookie(name: string, options?: cookie.SerializeOptions) {
  throw new Error('Not implemented')
}
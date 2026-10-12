import type { Request, Response } from 'express';
import { createExpressApp } from '../server.ts';

let appPromise: Promise<any> | null = null;

export default async function handler(req: Request, res: Response) {
  if (!appPromise) {
    appPromise = createExpressApp();
  }
  const app = await appPromise;
  return app(req, res);
}

import type { Request, Response } from 'express';
import { createExpressApp } from '../server';

let appPromise: Promise<any> | null = null;

export default async function handler(req: Request, res: Response) {
  try {
    if (!appPromise) {
      appPromise = createExpressApp();
    }
    const app = await appPromise;

    return new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      app(req, res);
    });
  } catch (err: any) {
    console.error('[Vercel Serverless Function Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

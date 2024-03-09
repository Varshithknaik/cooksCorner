/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
export const setupReq = ( authorization?: string , body: any = {} , user?: any ) => {
  return {
    body,
    headers: {
      authorization: `Bearer ${authorization}`,
    },
    user
  } as any;
}
export const res = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
} as unknown as Response;
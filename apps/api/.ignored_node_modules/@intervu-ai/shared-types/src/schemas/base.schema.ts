import { z } from 'zod';

export const idSchema = z.string().uuid();

export const timestampSchema = z.string().datetime();
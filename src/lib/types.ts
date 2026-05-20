import { z } from 'zod';

export const VideoSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  title: z.string().default('Untitled'),
  thumbnails: z.object({
    default: z.string(),
    high: z.string(),
    all: z.array(z.string()),
  }),
  duration: z.string(),
  views: z.string(),
  rate: z.string(),
  added: z.string(),
  keywords: z.array(z.string()).default([]),
  embedUrl: z.string().optional().default(''),
  pageUrl: z.string().optional().default(''),
});

export type Video = z.infer<typeof VideoSchema>;

export const VideoPageSchema = z.object({
  videos: z.array(VideoSchema),
  nextOffset: z.number().nullable(),
});

export type VideoPage = z.infer<typeof VideoPageSchema>;

export interface Stats {
  loaded: number;
  cached: number;
  played: number;
}

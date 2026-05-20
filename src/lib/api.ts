import { VideoSchema, type Video, type VideoPage } from './types';
import { PAGE_SIZE } from './utils';
import videosData from '../../assets/videos.json';

let cachedVideos: Video[] | null = null;

async function getVideos(): Promise<Video[]> {
  if (cachedVideos) return cachedVideos;
  try {
    // Validate and transform data using Zod
    cachedVideos = (videosData as any[]).map((row: any) => {
      const parsed = VideoSchema.parse(row);
      // Add derived fields if not present
      if (!parsed.embedUrl) parsed.embedUrl = `https://www.eporner.com/embed/${parsed.id}/`;
      if (!parsed.pageUrl) parsed.pageUrl = `https://www.eporner.com/video-${parsed.id}/`;
      return parsed;
    });
    
    return cachedVideos || [];
  } catch (error) {
    console.error('Error loading video database:', error);
    return [];
  }
}

export async function fetchVideosPage(search = '', offset = 0, limit = PAGE_SIZE): Promise<VideoPage> {
  const allVideos = await getVideos();
  let filtered = allVideos;

  if (search.trim()) {
    const query = search.toLowerCase().trim();
    filtered = allVideos.filter(v => 
      v.title.toLowerCase().includes(query) || 
      v.keywords.some(k => k.toLowerCase().includes(query))
    );
  }

  const paginated = filtered.slice(offset, offset + limit);
  
  return {
    videos: paginated,
    nextOffset: (offset + limit) < filtered.length ? offset + limit : null,
  };
}

export interface PlaybackInfo {
  title: string;
  links: Record<string, string>;
  id: string;
}

/**
 * XHR EXTRACTOR:
 * Fetches the eporner page/embed, extracts the hash, and calls the internal API
 * to get direct MP4 links for quality switching.
 */
export async function resolvePlayback(video: Video): Promise<PlaybackInfo | null> {
  const url = video.embedUrl || `https://www.eporner.com/embed/${video.id}/`;
  const videoId = video.id;

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.eporner.com/'
    };

    // 1. Fetch the page to get the 'hash'
    const pageRes = await fetch(url, { headers });
    const webpage = await pageRes.text();

    // 2. Extract the 32-character hex hash
    const hashMatch = webpage.match(/hash\s*[:=]\s*["']([\da-f]{32})["']/);
    if (!hashMatch) {
      console.warn('Could not extract hash from page');
      return null;
    }
    const vidHash = hashMatch[1];

    // 3. Call the internal API
    const apiUrl = `https://www.eporner.com/api/v2/video/id/${videoId}/hash/${vidHash}/`;
    const apiRes = await fetch(apiUrl, { headers });
    const data = await apiRes.json();

    // 4. Extract direct MP4 links
    const sources = data.sources || {};
    const mp4Links: Record<string, string> = {};

    if (sources.mp4) {
      for (const [res, details] of Object.entries(sources.mp4)) {
        if ((details as any).src) {
          mp4Links[res] = (details as any).src;
        }
      }
    }

    return {
      title: data.title || video.title,
      id: videoId,
      links: mp4Links
    };
  } catch (error) {
    console.error('Error resolving playback:', error);
    return null;
  }
}

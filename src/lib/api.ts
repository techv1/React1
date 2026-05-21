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
  debug?: {
    step: string;
    error?: string;
    hashFound: boolean;
    apiUrl?: string;
    apiResponseStatus?: number;
    rawPageSnippet?: string;
  };
}

/**
 * Transforms a 32-char hex hash into a Base36 string by splitting into four 8-char chunks.
 */
function transformHash(hex: string): string {
  let result = '';
  for (let i = 0; i < 32; i += 8) {
    const chunk = hex.substring(i, i + 8);
    // Convert hex chunk (base 16) to number, then to base 36
    result += parseInt(chunk, 16).toString(36);
  }
  return result;
}

/**
 * XHR EXTRACTOR:
 * Implements the vjs845.js logic:
 * 1. Fetches the embed page to get the 32-char hex hash.
 * 2. Transforms the hash into Base36 (4 chunks).
 * 3. Calls the /xhr/video/ID endpoint with specific parameters.
 */
export async function resolvePlayback(video: Video): Promise<PlaybackInfo | null> {
  const url = video.embedUrl || `https://www.eporner.com/embed/${video.id}/`;
  const videoId = video.id;
  const debug: PlaybackInfo['debug'] = { step: 'init', hashFound: false };

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': url // Referer must match the embed page
    };

    // 1. Fetch the page to get the 'hash'
    debug.step = 'fetching_page';
    const pageRes = await fetch(url, { headers });
    if (!pageRes.ok) {
      throw new Error(`Page fetch failed with status ${pageRes.status}`);
    }
    const webpage = await pageRes.text();

    // 2. Extract the 32-character hex hash
    debug.step = 'extracting_hash';
    // Match the hash in the page source (often in a script tag or data attribute)
    const hashMatch = webpage.match(/hash\s*[:=]\s*["']([\da-f]{32})["']/i);
    if (!hashMatch) {
      debug.rawPageSnippet = webpage.substring(0, 1000);
      console.warn('Could not extract hex hash from page');
      return { title: video.title, id: videoId, links: {}, debug: { ...debug, error: 'Hex hash not found in page' } };
    }
    const hexHash = hashMatch[1];
    debug.hashFound = true;

    // 3. Transform hash (Base16 -> Base36 transformation)
    debug.step = 'transforming_hash';
    const transformedHash = transformHash(hexHash);

    // 4. Call the XHR API
    debug.step = 'calling_xhr_api';
    const timestamp = Date.now();
    const params = new URLSearchParams({
      hash: transformedHash,
      domain: 'www.eporner.com',
      fallback: 'false',
      embed: 'true',
      supportedFormats: 'hls,mp4',
      _: timestamp.toString()
    });

    const apiUrl = `https://www.eporner.com/xhr/video/${videoId}?${params.toString()}`;
    debug.apiUrl = apiUrl;

    const apiRes = await fetch(apiUrl, { headers });
    debug.apiResponseStatus = apiRes.status;
    
    if (!apiRes.ok) {
      throw new Error(`XHR API failed with status ${apiRes.status}`);
    }
    const data = await apiRes.json();

    // 5. Extract links (prioritizing HLS/master.m3u8)
    debug.step = 'extracting_links';
    const mp4Links: Record<string, string> = {};

    // Check for HLS master playlist
    if (data.sources?.hls) {
      if (data.sources.hls.src) {
        mp4Links['Auto (HLS)'] = data.sources.hls.src;
      } else if (data.sources.hls.auto?.src) {
        mp4Links['Auto (HLS)'] = data.sources.hls.auto.src;
      }
    }

    // Fallback to MP4 sources
    const sources = data.sources || {};
    if (sources.mp4) {
      for (const [res, details] of Object.entries(sources.mp4)) {
        if ((details as any).src) {
          mp4Links[res] = (details as any).src;
        }
      }
    }

    if (Object.keys(mp4Links).length === 0) {
      return { title: video.title, id: videoId, links: {}, debug: { ...debug, error: 'No playable links in XHR response' } };
    }

    return {
      title: data.title || video.title,
      id: videoId,
      links: mp4Links,
      debug
    };
  } catch (error: any) {
    console.error('Error resolving playback:', error);
    return { 
      title: video.title, 
      id: videoId, 
      links: {}, 
      debug: { ...debug, error: error.message } 
    };
  }
}

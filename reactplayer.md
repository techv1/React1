# Eporner Video Extraction & Playback System

This document explains the specialized extraction logic and the high-performance playback system implemented in this React Native project.

---

## 1. The Core Extraction Logic
The system replicates the official Eporner player's security handshake using a pure JavaScript implementation. This avoids the overhead of a real browser or heavy WebViews on native platforms.

### Step-by-Step Lifecycle:
1.  **Initial Page Fetch**: The app fetches the HTML of the video embed page (`/embed/ID/`).
2.  **Hex Hash Extraction**: It scans the HTML for a 32-character hexadecimal string (`hash`).
3.  **Base36 Transformation**:
    *   The 32-char hex string is split into four **8-character chunks**.
    *   Each chunk is converted from Base16 (Hex) to a number.
    *   Each number is then converted to a **Base36 string**.
    *   The four Base36 strings are concatenated to form the `transformedHash`.
4.  **XHR API Request**: The app calls `https://www.eporner.com/xhr/video/ID` with parameters including the `transformedHash`, `domain`, and a `timestamp`.
5.  **CDN Tokenization**: The API returns a JSON response containing HLS (`.m3u8`) and MP4 source URLs. These URLs are pre-signed with a `hash`, `expires` timestamp, and the user's specific `ip`.

---

## 2. Technical Implementation

### The Transformation Function (`api.ts`)
```typescript
function transformHash(hex: string): string {
  let result = '';
  for (let i = 0; i < 32; i += 8) {
    const chunk = hex.substring(i, i + 8);
    result += parseInt(chunk, 16).toString(36);
  }
  return result;
}
```

### The Hybrid Approach
The project uses a **Platform-Specific** strategy to balance performance and compatibility:

*   **Native (iOS/Android)**: Uses the "Pure JS" extraction described above. This is 2-3 seconds faster than a WebView and extremely lightweight.
*   **Web**: Keeps a hidden `WebView` (or iframe) mechanism. This is necessary because web browsers have strict **CORS** and **Referer** header restrictions that block the direct API calls.

---

## 3. Playback & Security
Even with a valid URL, the Eporner CDN requires specific headers to authorize the segment fetches.

### Security Headers
The `CustomVideoPlayer` passes the following headers to the native video engine:
*   **Referer**: Must match the embed URL (e.g., `https://www.eporner.com/embed/ID/`).
*   **User-Agent**: A standard modern browser string to prevent bot detection.

### URL Binding
Every extracted URL is:
1.  **IP Locked**: Only the device that requested the link can play it.
2.  **Time Limited**: Links typically expire after 24 hours.
3.  **Unique**: A fresh hash is generated on every "Play" click.

---

## 4. UI/UX Refinements
The `CustomVideoPlayer` component is built for a premium mobile experience:

*   **Engine**: Powered by `react-native-video`.
*   **Animations**: Built with `react-native-reanimated` v3 for 60fps fade transitions.
*   **Glassmorphism**: Uses `expo-blur` to create frosted glass control overlays.
*   **Optimization**: 
    *   Controls automatically hide after 3 seconds of inactivity.
    *   Heavy `Video` component rendering is isolated from UI state updates to prevent stutter.
    *   "Tap-to-Toggle" logic uses `Pressable` with optimized hit detection.

---

## 5. Summary of Files
*   `src/lib/api.ts`: Contains the `resolvePlayback` and `transformHash` logic.
*   `src/components/CustomVideoPlayer.tsx`: The primary video player component with animations and blur effects.
*   `src/app/video/[id].tsx`: The screen controller that chooses the extraction method based on the platform.
*   `src/components/VideoExtractor.tsx`: The legacy/web fallback using WebView.

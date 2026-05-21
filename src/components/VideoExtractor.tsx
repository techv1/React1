import React, { useRef } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface VideoExtractorProps {
  embedUrl: string;
  onVideoFound: (url: string) => void;
}

// Injected into the hidden WebView — intercepts all XHR and fetch calls
const INJECTED_JS = `
(function() {
  // Intercept XHR
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && (
      url.includes('.m3u8') ||
      url.includes('.mp4') ||
      url.includes('/manifest') ||
      url.includes('/playlist')
    )) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'VIDEO_URL',
        url: url
      }));
    }
    return origOpen.apply(this, arguments);
  };

  // Intercept fetch
  const origFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input?.url;
    if (url && (
      url.includes('.m3u8') ||
      url.includes('.mp4') ||
      url.includes('/manifest') ||
      url.includes('/playlist')
    )) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'VIDEO_URL',
        url: url
      }));
    }
    return origFetch.apply(this, arguments);
  };
})();
true; // required
`;

export default function VideoExtractor({ embedUrl, onVideoFound }: VideoExtractorProps) {
  const webviewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'VIDEO_URL' && data.url) {
        onVideoFound(data.url); // pass to native player
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  return (
    // Hidden — zero size, off-screen
    <View style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }}>
      <WebView
        ref={webviewRef}
        source={{ uri: embedUrl }}
        injectedJavaScript={INJECTED_JS}
        onMessage={handleMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      />
    </View>
  );
}

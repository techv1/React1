import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchVideosPage, resolvePlayback, PlaybackInfo } from '../../lib/api';
import { Video } from '../../lib/types';
import { MiniCard } from '../../components/MiniCard';
import { CustomVideoPlayer } from '../../components/CustomVideoPlayer';
import VideoExtractor from '../../components/VideoExtractor';
import { useStore } from '../../lib/store';
import { similarityScore } from '../../lib/utils';
import { ChevronLeft } from 'lucide-react-native';

export default function VideoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [playback, setPlayback] = useState<PlaybackInfo | null>(null);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { historyStack, addHistory, stats, incrementPlayed } = useStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { videos } = await fetchVideosPage('', 0, 1000);
      setAllVideos(videos);
      
      const currentVideo = videos.find(v => v.id === id);
      if (currentVideo) {
        setVideo(currentVideo);
        addHistory(currentVideo);
        incrementPlayed();
        
        const pb = await resolvePlayback(currentVideo);
        setPlayback(pb);
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleVideoFound = (url: string) => {
    if (!webViewUrl) {
      console.log('Video found via WebView:', url);
      setWebViewUrl(url);
    }
  };

  // Prioritize WebView URL on web (often a master m3u8), fallback to API links
  // On Native, always use the fast API-based links
  const activeLinks = Platform.OS === 'web'
    ? (webViewUrl ? { 'Auto': webViewUrl } : (playback?.links && Object.keys(playback.links).length > 0 ? playback.links : null))
    : (playback?.links && Object.keys(playback.links).length > 0 ? playback.links : null);

  const isResolving = !activeLinks && (!playback || playback.debug?.step === 'fetching_page' || playback.debug?.step === 'calling_api' || (playback.debug?.step === 'extracting_hash' && (Platform.OS !== 'web' || !webViewUrl)));

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!video) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-4">
        <Text className="text-white text-lg mb-4">Video not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-zinc-800 px-6 py-2 rounded-full">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const recommendations = allVideos
    .map(v => ({ video: v, score: similarityScore(video, v, historyStack) }))
    .filter(x => x.score >= 0 && x.video.id !== video.id)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg flex-1" numberOfLines={1}>{video.title}</Text>
      </View>

      <View className="w-full aspect-video bg-zinc-900">
        {video && Platform.OS === 'web' && (
          <VideoExtractor 
            embedUrl={video.embedUrl || `https://www.eporner.com/embed/${video.id}/`} 
            onVideoFound={handleVideoFound} 
          />
        )}
        {activeLinks ? (
          <CustomVideoPlayer 
            links={activeLinks} 
            title={video.title} 
            onClose={() => router.back()} 
            referer={video.embedUrl || `https://www.eporner.com/embed/${video.id}/`}
          />
        ) : (
          <View className="flex-1 justify-center items-center p-6">
            {isResolving ? (
               <>
                 <ActivityIndicator color="#3b82f6" size="large" />
                 <Text className="text-zinc-500 mt-4 text-center font-medium">Resolving secure playback links...</Text>
               </>
            ) : (
              <View className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700 w-full">
                <Text className="text-red-400 font-bold mb-2">Extraction Failed</Text>
                <Text className="text-zinc-400 text-xs mb-4">We couldn't resolve a direct playback link for this video.</Text>
                <TouchableOpacity 
                  onPress={async () => {
                    setPlayback(null);
                    setWebViewUrl(null);
                    const pb = await resolvePlayback(video);
                    setPlayback(pb);
                  }}
                  className="bg-zinc-700 py-2 rounded-lg"
                >
                  <Text className="text-white text-center font-bold">Retry Extraction</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView className="flex-1">
        <View className="p-4">
          <Text className="text-white text-xl font-bold mb-2">{video.title}</Text>
          <View className="flex-row items-center mb-4">
            <Text className="text-zinc-400 text-sm">{video.views} views</Text>
            <Text className="text-zinc-600 text-sm mx-2">•</Text>
            <Text className="text-zinc-400 text-sm">{video.rate} ★</Text>
            <Text className="text-zinc-600 text-sm mx-2">•</Text>
            <Text className="text-zinc-400 text-sm">{video.duration}</Text>
          </View>

          <View className="flex-row flex-wrap mb-6">
            {video.keywords.slice(0, 10).map((k, i) => (
              <View key={i} className="bg-zinc-800 px-3 py-1.5 rounded-full mr-2 mb-2">
                <Text className="text-zinc-300 text-xs">{k}</Text>
              </View>
            ))}
          </View>

          <Text className="text-white text-lg font-bold mb-4">Up Next</Text>
        </View>

        {/* Edge-to-Edge Recommendations */}
        <View className="w-full">
          {recommendations.map(({ video, score }) => (
            <MiniCard 
              key={video.id} 
              video={video} 
              score={score}
              onClick={() => router.push(`/video/${video.id}`)} 
            />
          ))}
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

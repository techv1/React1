import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getVideoById, getAllVideos, resolvePlayback, PlaybackInfo } from '../../lib/api';
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

  const { historyStack, addHistory, incrementPlayed, watchProgress, setWatchProgress } = useStore();
  const savedPosition = useMemo(() => watchProgress[id as string] ?? 0, [watchProgress, id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [currentVideo, allVids] = await Promise.all([
          getVideoById(id as string),
          getAllVideos(),
        ]);
        
        setVideo(currentVideo);
        setAllVideos(allVids);
        
        if (currentVideo) {
          addHistory(currentVideo);
          incrementPlayed();
          
          const pb = await resolvePlayback(currentVideo);
          setPlayback(pb);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleVideoFound = (url: string) => {
    if (!webViewUrl) {
      setWebViewUrl(url);
    }
  };

  const activeLinks = useMemo(() => {
    if (Platform.OS === 'web') {
      return webViewUrl ? { 'Auto': webViewUrl } : (playback?.links && Object.keys(playback.links).length > 0 ? playback.links : null);
    }
    return (playback?.links && Object.keys(playback.links).length > 0 ? playback.links : null);
  }, [Platform.OS, webViewUrl, playback?.links]);

  const isResolving = !activeLinks && (!playback || playback.debug?.step === 'fetching_page' || playback.debug?.step === 'calling_api' || (playback.debug?.step === 'extracting_hash' && (Platform.OS !== 'web' || !webViewUrl)));

  const recommendations = useMemo(() => {
    if (!video || allVideos.length === 0) return [];
    
    const maxRawScore = allVideos.reduce((max, v) => {
      const s = similarityScore(video, v, historyStack);
      return s > max ? s : max;
    }, 1);

    return allVideos
      .map(v => ({ video: v, score: similarityScore(video, v, historyStack) }))
      .filter(x => x.score > 0 && x.video.id !== video.id)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(r => ({ ...r, normalizedScore: Math.round((r.score / maxRawScore) * 100) }));
  }, [video?.id, allVideos, historyStack]);

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

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Dynamic Header - Minimalist */}
      <View className="flex-row items-center px-4 py-3 bg-black">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text className="text-zinc-400 font-medium text-sm flex-1" numberOfLines={1}>
          Playing: {video.title}
        </Text>
      </View>

      {/* Optimized Video Player Section */}
      <View className="w-full aspect-video bg-zinc-950 border-b border-zinc-900 shadow-2xl z-10">
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
            startPosition={savedPosition}
            onProgressUpdate={(pos) => setWatchProgress(id as string, pos)}
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

      {/* Recommendation & Content Feed */}
      <ScrollView 
        className="flex-1 bg-black"
        showsVerticalScrollIndicator={false}
      >
        <View className="p-5 bg-zinc-950/30">
          <Text className="text-white text-xl font-bold mb-2 leading-7">{video.title}</Text>
          <View className="flex-row items-center mb-5">
            <Text className="text-zinc-500 text-sm font-semibold">{video.views} views</Text>
            <Text className="text-zinc-800 text-sm mx-2.5">•</Text>
            <Text className="text-amber-500 text-sm font-black">{video.rate} ★</Text>
            <Text className="text-zinc-800 text-sm mx-2.5">•</Text>
            <Text className="text-zinc-500 text-sm">{video.duration}</Text>
          </View>

          <View className="flex-row flex-wrap mb-2">
            {video.keywords.slice(0, 8).map((k, i) => (
              <View key={i} className="bg-zinc-900 px-3 py-1.5 rounded-md mr-2 mb-2 border border-zinc-800">
                <Text className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">{k}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Separator / Sub-header */}
        <View className="px-5 py-4 border-t border-zinc-900 bg-black">
          <Text className="text-white text-lg font-black tracking-tight">Up Next</Text>
        </View>

        {/* Edge-to-Edge Recommendations */}
        <View className="w-full">
          {recommendations.map(({ video: recVideo, normalizedScore }) => (
            <MiniCard 
              key={`${recVideo.id}-${id}`} 
              video={recVideo} 
              score={normalizedScore}
              onClick={() => {
                setPlayback(null);
                setWebViewUrl(null);
                router.push(`/video/${recVideo.id}`);
              }} 
            />
          ))}
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

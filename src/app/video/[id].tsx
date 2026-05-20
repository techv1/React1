import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchVideosPage, resolvePlayback, PlaybackInfo } from '../../lib/api';
import { Video } from '../../lib/types';
import { MiniCard } from '../../components/MiniCard';
import { CustomVideoPlayer } from '../../components/CustomVideoPlayer';
import { useStore } from '../../lib/store';
import { similarityScore } from '../../lib/utils';
import { ChevronLeft } from 'lucide-react-native';

export default function VideoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [playback, setPlayback] = useState<PlaybackInfo | null>(null);
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
        {playback ? (
          <CustomVideoPlayer 
            links={playback.links} 
            title={video.title} 
            onClose={() => router.back()} 
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="white" />
            <Text className="text-zinc-500 mt-2">Resolving playback links...</Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 p-4">
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
        {recommendations.map(({ video, score }) => (
          <MiniCard 
            key={video.id} 
            video={video} 
            score={score}
            onClick={() => router.push(`/video/${video.id}`)} 
          />
        ))}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

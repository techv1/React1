import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, RefreshControl, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVideosPage } from '../lib/api';
import { Video } from '../lib/types';
import { Thumbnail } from '../components/Thumbnail';
import { Hero } from '../components/Hero';
import { useStore } from '../lib/store';
import { Search } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const stats = useStore((state) => state.stats);

  const loadVideos = async () => {
    setLoading(true);
    const data = await fetchVideosPage('', 0, 20);
    setVideos(data.videos);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleVideoClick = (id: string) => {
    router.push(`/video/${id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row justify-between items-center px-4 py-3">
        <Text className="text-white text-2xl font-black">PLAYER</Text>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <Search color="white" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />}
      >
        {videos.length > 0 && (
          <Hero video={videos[0]} onPlay={handleVideoClick} />
        )}

        <View className="flex-row justify-between items-center mb-4 mt-2">
          <Text className="text-white text-xl font-bold">Recommended</Text>
          <View className="bg-zinc-800 px-2 py-1 rounded">
            <Text className="text-zinc-400 text-[10px] font-bold uppercase">
              {stats.played} Played
            </Text>
          </View>
        </View>

        {videos.slice(1).map((v) => (
          <Thumbnail key={v.id} video={v} onClick={() => handleVideoClick(v.id)} />
        ))}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, RefreshControl, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVideosPage } from '../lib/api';
import { Video } from '../lib/types';
import { Thumbnail } from '../components/Thumbnail';
import { useStore } from '../lib/store';
import { Search } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const stats = useStore((state) => state.stats);

  const loadVideos = async () => {
    setLoading(true);
    const data = await fetchVideosPage('', 0, 40);
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

  const handleVideoClick = useCallback((id: string) => {
    router.push(`/video/${id}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Video }) => (
    <Thumbnail 
      video={item} 
      onClick={() => handleVideoClick(item.id)} 
    />
  ), [handleVideoClick]);

  const ListHeader = () => (
    <View className="flex-row justify-between items-center mb-6 mt-2">
      <Text className="text-white text-xl font-bold">Recommended for You</Text>
      <View className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
        <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
          {stats.played} Played
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* App Bar */}
      <View className="flex-row justify-between items-center px-4 py-4 bg-black">
        <Text className="text-white text-2xl font-black tracking-tighter">V PLAYER</Text>
        <TouchableOpacity 
          onPress={() => router.push('/search')}
          className="bg-zinc-900 p-2.5 rounded-full"
        >
          <Search color="white" size={20} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 40 }}
        ListHeaderComponent={<View className="px-4"><ListHeader /></View>}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#3b82f6" 
            colors={["#3b82f6"]}
          />
        }
        // Performance Optimizations for 120Hz
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}


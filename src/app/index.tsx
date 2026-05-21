import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, RefreshControl, SafeAreaView, FlatList, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchRecommendedVideos } from '../lib/api';
import { Video } from '../lib/types';
import { Thumbnail } from '../components/Thumbnail';
import { useStore } from '../lib/store';
import { Search } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_IMAGE_H = SCREEN_WIDTH * (9 / 16);
const THUMB_META_H = 82;
const THUMB_MARGIN_H = 40;
const ITEM_HEIGHT = THUMB_IMAGE_H + THUMB_META_H + THUMB_MARGIN_H;

const CONTENT_STYLE = { paddingHorizontal: 0, paddingBottom: 40 };
const HEADER_CONTAINER_STYLE = { paddingHorizontal: 16 };

const ListHeader = React.memo(({ played }: { played: number }) => (
  <View className="flex-row justify-between items-center mb-6 mt-2">
    <Text className="text-white text-xl font-bold">Recommended for You</Text>
    <View className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
      <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
        {played} Played
      </Text>
    </View>
  </View>
));

const SkeletonCard = () => {
  const opacity = useSharedValue(0.4);
  
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 900 }), -1, true);
  }, []);
  
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  
  return (
    <Animated.View style={animStyle} className="w-full mb-10">
      <View style={{ width: '100%', aspectRatio: 16/9, backgroundColor: '#27272a' }} />
      <View className="px-5 pt-4">
        <View style={{ height: 16, backgroundColor: '#3f3f46', borderRadius: 4, marginBottom: 8, width: '75%' }} />
        <View style={{ height: 12, backgroundColor: '#27272a', borderRadius: 4, width: '50%' }} />
      </View>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionSeed, setSeed] = useState(Date.now());
  
  const { stats, historyStack } = useStore();

  const loadVideos = async (newOffset = 0, isRefresh = false) => {
    if (!isRefresh && (loadingMore || !hasMore)) return;
    
    if (isRefresh) setRefreshing(true);
    else if (newOffset > 0) setLoadingMore(true);

    try {
      const currentSeed = isRefresh ? Date.now() : sessionSeed;
      if (isRefresh) setSeed(currentSeed);

      const data = await fetchRecommendedVideos(historyStack, currentSeed, newOffset, 20);
      
      if (isRefresh) {
        setVideos(data.videos);
        setOffset(20);
      } else {
        setVideos(prev => [...prev, ...data.videos]);
        setOffset(newOffset + 20);
      }
      setHasMore(data.nextOffset !== null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setHasMore(true);
    await loadVideos(0, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      loadVideos(offset);
    }
  };

  useEffect(() => {
    loadVideos(0, true);
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

  const header = useMemo(() => (
    <View style={HEADER_CONTAINER_STYLE}>
      <ListHeader played={stats.played} />
    </View>
  ), [stats.played]);

  if (loading) return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row justify-between items-center px-4 py-4">
        <Text className="text-white text-2xl font-black tracking-tighter">V PLAYER</Text>
      </View>
      {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
    </SafeAreaView>
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
        keyExtractor={(item) => `${item.id}-${item.added}`}
        contentContainerStyle={CONTENT_STYLE}
        ListHeaderComponent={header}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#3b82f6" style={{ padding: 20 }} /> : null}
        getItemLayout={(_data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#3b82f6" 
            colors={["#3b82f6"]}
          />
        }
        // Performance Optimizations for 120Hz
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

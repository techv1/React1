import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Video } from '../lib/types';
import { Star, Eye, Calendar } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface ThumbnailProps {
  video: Video;
  onClick: () => void;
}

const IMAGE_STYLE = { width: '100%' as const, height: '100%' as const };

export const Thumbnail = React.memo(({ video, onClick }: ThumbnailProps) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle} className="w-full mb-10 bg-black">
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1.0, { damping: 15, stiffness: 200 }); }}
        onPress={onClick}
      >
        {/* Edge-to-Edge Image Section */}
        <View className="relative w-full aspect-video bg-zinc-900">
          <Image 
            source={{ uri: video.thumbnails.high }} 
            style={IMAGE_STYLE}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={video.id}
            priority="normal"
          />
          {/* Modern Duration Badge */}
          <View className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded-md border border-white/10">
            <Text className="text-white text-[10px] font-black tracking-widest">{video.duration}</Text>
          </View>
        </View>
        
        {/* Content Section with Professional Spacing */}
        <View className="px-5 pt-4"> 
          <Text 
            className="text-white font-bold text-[17px] leading-[22px] mb-2" 
            numberOfLines={2}
          >
            {video.title}
          </Text>
          
          {/* Metadata Row with High-Quality Icons */}
          <View className="flex-row items-center flex-wrap">
            <View className="flex-row items-center mr-4">
              <Eye size={12} color="#71717a" className="mr-1.5" />
              <Text className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider">{video.views}</Text>
            </View>
            
            <View className="flex-row items-center mr-4">
              <Star size={12} color="#fbbf24" fill="#fbbf24" className="mr-1.5" />
              <Text className="text-zinc-400 text-[11px] font-black">{video.rate}</Text>
            </View>

            <View className="flex-row items-center">
              <Calendar size={12} color="#71717a" className="mr-1.5" />
              <Text className="text-zinc-500 text-[11px] font-medium">{video.added}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}, (prev, next) => prev.video.id === next.video.id && prev.onClick === next.onClick);

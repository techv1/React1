import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Video } from '../lib/types';
import { Star, Eye, Calendar, Clock } from 'lucide-react-native';

interface ThumbnailProps {
  video: Video;
  onClick: () => void;
}

export const Thumbnail: React.FC<ThumbnailProps> = React.memo(({ video, onClick }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      className="w-full mb-10 bg-black" 
      onPress={onClick}
    >
      {/* Edge-to-Edge Image Section */}
      <View className="relative w-full aspect-video bg-zinc-900">
        <Image 
          source={{ uri: video.thumbnails.high }} 
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={300}
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
    </TouchableOpacity>
  );
});



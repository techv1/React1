import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Video } from '../lib/types';
import { Star, Eye, Calendar } from 'lucide-react-native';

interface MiniCardProps {
  video: Video;
  score?: number;
  onClick: () => void;
}

export const MiniCard: React.FC<MiniCardProps> = React.memo(({ video, score, onClick }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      className="w-full mb-8 bg-black" 
      onPress={onClick}
    >
      {/* Edge-to-Edge Image Section */}
      <View className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
        <Image 
          source={{ uri: video.thumbnails.high }} 
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={300}
        />
        {/* Modern Duration Badge */}
        <View className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
          <Text className="text-white text-[9px] font-black tracking-widest">{video.duration}</Text>
        </View>
        {score !== undefined && (
          <View className="absolute top-2 left-2 bg-blue-600/90 px-2 py-0.5 rounded">
            <Text className="text-white text-[9px] font-bold uppercase">Match {Math.round(score)}%</Text>
          </View>
        )}
      </View>
      
      {/* Content Section */}
      <View className="pt-3 px-1"> 
        <Text 
          className="text-white font-bold text-base leading-5 mb-1.5" 
          numberOfLines={2}
        >
          {video.title}
        </Text>
        
        <View className="flex-row items-center">
          <View className="flex-row items-center mr-3">
            <Eye size={10} color="#71717a" className="mr-1" />
            <Text className="text-zinc-500 text-[10px] font-bold uppercase">{video.views}</Text>
          </View>
          
          <View className="flex-row items-center">
            <Star size={10} color="#fbbf24" fill="#fbbf24" className="mr-1" />
            <Text className="text-zinc-400 text-[10px] font-black">{video.rate}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});


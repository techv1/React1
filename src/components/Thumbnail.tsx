import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Video } from '../lib/types';

interface ThumbnailProps {
  video: Video;
  onClick: () => void;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({ video, onClick }) => {
  return (
    <TouchableOpacity 
      className="w-full mb-4 bg-zinc-900 rounded-xl overflow-hidden shadow-lg" 
      onPress={onClick}
    >
      <View className="relative">
        <Image 
          source={{ uri: video.thumbnails.high }} 
          className="w-full aspect-video bg-zinc-800"
          resizeMode="cover"
        />
        <View className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded">
          <Text className="text-white text-[10px] font-medium">{video.duration}</Text>
        </View>
      </View>
      <View className="p-3">
        <Text className="text-white font-bold text-base" numberOfLines={2}>
          {video.title}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-zinc-400 text-xs">{video.views} views</Text>
          <Text className="text-zinc-500 text-xs mx-1.5">•</Text>
          <Text className="text-zinc-400 text-xs">{video.rate} ★</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

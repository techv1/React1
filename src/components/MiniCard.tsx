import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Video } from '../lib/types';

interface MiniCardProps {
  video: Video;
  score?: number;
  onClick: () => void;
}

export const MiniCard: React.FC<MiniCardProps> = ({ video, score, onClick }) => {
  return (
    <TouchableOpacity 
      className="flex-row p-2 mb-2 bg-zinc-900 rounded-lg overflow-hidden" 
      onPress={onClick}
    >
      <Image 
        source={{ uri: video.thumbnails.default }} 
        className="w-24 h-16 rounded-md bg-zinc-800"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3 justify-center">
        <Text className="text-white font-semibold text-sm" numberOfLines={2}>
          {video.title}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-zinc-400 text-xs">{video.views} views</Text>
          {score !== undefined && (
            <Text className="text-blue-400 text-xs ml-2">Score: {Math.round(score)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

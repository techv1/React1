import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { Video } from '../lib/types';
import { Play } from 'lucide-react-native';

interface HeroProps {
  video: Video;
  onPlay: (id: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ video, onPlay }) => {
  return (
    <View className="w-full aspect-[16/10] mb-6 rounded-2xl overflow-hidden shadow-2xl">
      <ImageBackground 
        source={{ uri: video.thumbnails.high }} 
        className="flex-1 justify-end"
        resizeMode="cover"
      >
        <View className="p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
          <Text className="text-white text-3xl font-black mb-2 shadow-sm">
            {video.title}
          </Text>
          <View className="flex-row items-center mb-4">
            <View className="bg-red-600 px-2 py-0.5 rounded mr-3">
              <Text className="text-white text-xs font-bold uppercase">Trending</Text>
            </View>
            <Text className="text-zinc-200 text-sm font-medium">{video.views} views</Text>
          </View>
          <TouchableOpacity 
            className="flex-row items-center bg-white self-start px-6 py-3 rounded-full"
            onPress={() => onPlay(video.id)}
          >
            <Play size={20} color="black" fill="black" />
            <Text className="text-black font-bold ml-2 text-base">Watch Now</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

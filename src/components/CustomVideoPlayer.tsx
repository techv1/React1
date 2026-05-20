import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import Video, { VideoRef, OnLoadData, OnProgressData } from 'react-native-video';
import { Play, Pause, SkipForward, SkipBack, Settings, Maximize, Minimize } from 'lucide-react-native';
import Slider from '@react-native-community/slider';

interface CustomVideoPlayerProps {
  links: Record<string, string>;
  title: string;
  onClose?: () => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ links, title, onClose }) => {
  const videoRef = useRef<VideoRef>(null);
  const [currentQuality, setCurrentQuality] = useState<string>(Object.keys(links)[0] || 'default');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const currentUri = links[currentQuality];

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setIsLoading(false);
  };

  const handleProgress = (data: OnProgressData) => {
    setProgress(data.currentTime);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const seek = (value: number) => {
    videoRef.current?.seek(value);
    setProgress(value);
  };

  const skip = (amount: number) => {
    const newPos = Math.max(0, Math.min(duration, progress + amount));
    videoRef.current?.seek(newPos);
  };

  const changeQuality = (q: string) => {
    const lastPos = progress;
    setCurrentQuality(q);
    setShowQualityMenu(false);
    setIsLoading(true);
    // Seek back to last position after load
    setTimeout(() => {
      videoRef.current?.seek(lastPos);
    }, 500);
  };

  return (
    <View className="flex-1 bg-black justify-center">
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={() => setShowControls(true)}
        className="w-full aspect-video relative"
      >
        <Video
          ref={videoRef}
          source={{ uri: currentUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={!isPlaying}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
        />

        {isLoading && (
          <View className="absolute inset-0 items-center justify-center bg-black/20">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}

        {showControls && (
          <View className="absolute inset-0 bg-black/40 justify-between p-4">
            {/* Top Bar */}
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-bold text-lg flex-1 mr-4" numberOfLines={1}>
                {title}
              </Text>
              <TouchableOpacity onPress={() => setShowQualityMenu(!showQualityMenu)}>
                <Settings color="white" size={24} />
              </TouchableOpacity>
            </View>

            {/* Middle Controls */}
            <View className="flex-row justify-center items-center space-x-8">
              <TouchableOpacity onPress={() => skip(-10)}>
                <SkipBack color="white" size={32} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={togglePlay} className="bg-white/20 p-4 rounded-full">
                {isPlaying ? <Pause color="white" size={48} fill="white" /> : <Play color="white" size={48} fill="white" />}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => skip(10)}>
                <SkipForward color="white" size={32} />
              </TouchableOpacity>
            </View>

            {/* Bottom Bar */}
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-white text-xs">{formatTime(progress)}</Text>
                <Text className="text-white text-xs">{formatTime(duration)}</Text>
              </View>
              
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={duration}
                value={progress}
                onSlidingComplete={seek}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#ffffff"
                thumbTintColor="#3b82f6"
              />

              <View className="flex-row justify-end mt-2">
                <TouchableOpacity onPress={() => setIsFullScreen(!isFullScreen)}>
                  {isFullScreen ? <Minimize color="white" size={24} /> : <Maximize color="white" size={24} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {showQualityMenu && (
          <View className="absolute top-12 right-4 bg-zinc-900/95 p-2 rounded-xl border border-zinc-700 w-32">
            <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-2 px-2">Quality</Text>
            {Object.keys(links).map((q) => (
              <TouchableOpacity 
                key={q} 
                onPress={() => changeQuality(q)}
                className={`p-2 rounded-lg ${currentQuality === q ? 'bg-blue-600' : ''}`}
              >
                <Text className="text-white font-medium text-center">{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

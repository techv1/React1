import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Pressable } from 'react-native';
import Video, { VideoRef, OnLoadData, OnProgressData } from 'react-native-video';
import { Play, Pause, SkipForward, SkipBack, Settings, Maximize, Minimize, X } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface CustomVideoPlayerProps {
  links: Record<string, string>;
  title: string;
  onClose?: () => void;
  referer?: string;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ links, title, onClose, referer }) => {
  const videoRef = useRef<VideoRef>(null);
  const [currentQuality, setCurrentQuality] = useState<string>(Object.keys(links)[0] || 'default');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const controlsOpacity = useSharedValue(1);

  const currentUri = links[currentQuality];

  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const toggleControls = () => {
    if (controlsOpacity.value === 0) {
      setShowControls(true);
      controlsOpacity.value = withTiming(1, { duration: 300 });
    } else {
      controlsOpacity.value = withTiming(0, { duration: 300 }, () => {
        // We can't use runOnJS here easily without a worklet, so we'll just keep it rendered but invisible
        // or use the showControls state for pointer events
      });
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (controlsOpacity.value === 1 && isPlaying) {
      timeout = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 500 });
      }, 3000);
    }
    return () => clearTimeout(timeout);
  }, [controlsOpacity.value, isPlaying]);

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
      <View className="w-full aspect-video relative overflow-hidden bg-zinc-950">
        <Video
          ref={videoRef}
          source={{ 
            uri: currentUri,
            headers: {
              'Referer': referer || 'https://www.eporner.com/',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={!isPlaying}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
          
          // ExoPlayer & Performance Optimizations
          useTextureView={true}
          useExoShutter={false}
          shutterColor="transparent"
          progressUpdateInterval={500}
          playInBackground={false}
          allowsExternalPlayback={true}
        />

        {/* Transparent Touch Surface to toggle controls */}
        <Pressable 
          onPress={toggleControls}
          style={StyleSheet.absoluteFill}
        />

        {isLoading && (
          <View className="absolute inset-0 items-center justify-center pointer-events-none">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        )}

        <Animated.View 
          style={[StyleSheet.absoluteFill, animatedControlsStyle]}
          pointerEvents={controlsOpacity.value === 0 ? 'none' : 'auto'}
          className="bg-black/20"
        >
          {/* Top Bar with Blur */}
          <BlurView intensity={60} tint="dark" className="flex-row justify-between items-center p-4 absolute top-0 left-0 right-0">
            <TouchableOpacity onPress={onClose} className="mr-4 p-1">
              <X color="white" size={24} />
            </TouchableOpacity>
            <Text className="text-white font-bold text-base flex-1 mr-4" numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity onPress={() => setShowQualityMenu(!showQualityMenu)} className="p-1">
              <Settings color="white" size={22} />
            </TouchableOpacity>
          </BlurView>

          {/* Middle Controls - Play/Pause with massive hit area */}
          <View className="flex-1 flex-row justify-center items-center space-x-12">
            <TouchableOpacity onPress={() => skip(-10)} className="p-4">
              <SkipBack color="white" size={36} fill="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={togglePlay} 
              className="bg-white/10 p-6 rounded-full border border-white/20"
              style={{ width: 90, height: 90, justifyContent: 'center', alignItems: 'center' }}
            >
              {isPlaying ? <Pause color="white" size={48} fill="white" /> : <Play color="white" size={48} fill="white" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => skip(10)} className="p-4">
              <SkipForward color="white" size={36} fill="white" />
            </TouchableOpacity>
          </View>

          {/* Bottom Bar with Blur */}
          <BlurView intensity={80} tint="dark" className="p-4 absolute bottom-0 left-0 right-0">
            <View className="flex-row justify-between mb-2 px-1">
              <Text className="text-white/80 text-xs font-medium">{formatTime(progress)}</Text>
              <Text className="text-white/80 text-xs font-medium">{formatTime(duration)}</Text>
            </View>
            
            <Slider
              style={{ width: '100%', height: 30 }}
              minimumValue={0}
              maximumValue={duration}
              value={progress}
              onSlidingComplete={seek}
              minimumTrackTintColor="#3b82f6"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#3b82f6"
            />

            <View className="flex-row justify-between items-center mt-3">
              <View className="flex-row space-x-4">
                 {/* Reserved for more controls */}
              </View>
              <TouchableOpacity onPress={() => setIsFullScreen(!isFullScreen)} className="p-1">
                {isFullScreen ? <Minimize color="white" size={22} /> : <Maximize color="white" size={22} />}
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>

        {showQualityMenu && (
          <Animated.View 
            entering={FadeIn} 
            exiting={FadeOut}
            className="absolute top-16 right-4 bg-zinc-900/95 p-2 rounded-2xl border border-zinc-800 w-40 z-50 shadow-2xl"
          >
            <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-3 px-3 tracking-widest">Select Quality</Text>
            {Object.keys(links).map((q) => (
              <TouchableOpacity 
                key={q} 
                onPress={() => changeQuality(q)}
                className={`p-3 rounded-xl mb-1 flex-row justify-between items-center ${currentQuality === q ? 'bg-blue-600' : 'active:bg-zinc-800'}`}
              >
                <Text className="text-white font-semibold text-sm">{q}</Text>
                {currentQuality === q && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>
    </View>
  );
};

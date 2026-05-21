import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Pressable } from 'react-native';
import Video, { VideoRef, OnLoadData, OnProgressData } from 'react-native-video';
import { Play, Pause, SkipForward, SkipBack, Settings, Maximize, Minimize, ChevronDown } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeOut, runOnJS, useAnimatedProps, useAnimatedReaction } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

interface CustomVideoPlayerProps {
  links: Record<string, string>;
  title: string;
  onClose?: () => void;
  referer?: string;
  startPosition?: number;
  onProgressUpdate?: (pos: number) => void;
}

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ links, title, onClose, referer, startPosition, onProgressUpdate }) => {
  const videoRef = useRef<VideoRef>(null);
  const [currentQuality, setCurrentQuality] = useState<string>(Object.keys(links)[0] || 'default');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const controlsOpacity = useSharedValue(1);
  const progressRef = useRef(0);
  const pendingScrubRef = useRef<number | null>(null);
  const hideTimeout = useRef<NodeJS.Timeout>();

  const currentUri = links[currentQuality];

  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const animatedPointerEvents = useAnimatedProps(() => ({
    pointerEvents: (controlsOpacity.value < 0.1 ? 'none' : 'auto') as any,
  }));

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimeout.current);
    if (isPlaying) {
      hideTimeout.current = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 500 });
      }, 3000);
    }
  }, [isPlaying]);

  useAnimatedReaction(
    () => controlsOpacity.value,
    (val, prev) => {
      if (val === 1 && prev !== 1) runOnJS(scheduleHide)();
    }
  );

  const toggleControls = useCallback(() => {
    if (controlsOpacity.value === 0) {
      controlsOpacity.value = withTiming(1, { duration: 300 });
    } else {
      controlsOpacity.value = withTiming(0, { duration: 300 });
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLoad = (data: OnLoadData) => {
    setDuration(data.duration);
    setIsLoading(false);
    if (pendingScrubRef.current !== null) {
      videoRef.current?.seek(pendingScrubRef.current);
      pendingScrubRef.current = null;
    } else if (startPosition && startPosition > 5) {
      videoRef.current?.seek(startPosition);
    }
  };

  const handleProgress = (data: OnProgressData) => {
    progressRef.current = data.currentTime;
    if (controlsOpacity.value > 0.1) {
      setProgress(data.currentTime);
    }
    onProgressUpdate?.(data.currentTime);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const seek = (value: number) => {
    videoRef.current?.seek(value);
    setProgress(value);
    progressRef.current = value;
  };

  const skip = (amount: number) => {
    const newPos = Math.max(0, Math.min(duration, progressRef.current + amount));
    videoRef.current?.seek(newPos);
    setProgress(newPos);
    progressRef.current = newPos;
  };

  const changeQuality = (q: string) => {
    pendingScrubRef.current = progressRef.current;
    setCurrentQuality(q);
    setShowQualityMenu(false);
    setIsLoading(true);
  };

  // Gestures and features
  const lastTapTimeRef = useRef(0);
  const lastTapSideRef = useRef<'left' | 'right' | null>(null);
  const [seekFlash, setSeekFlash] = useState<{ side: 'left' | 'right'; key: number } | null>(null);

  const handleTap = (side: 'left' | 'right') => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300 && lastTapSideRef.current === side) {
      skip(side === 'right' ? 10 : -10);
      setSeekFlash({ side, key: now });
      setTimeout(() => setSeekFlash(null), 600);
    } else {
      toggleControls();
    }
    lastTapTimeRef.current = now;
    lastTapSideRef.current = side;
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 100) {
        if (onClose) runOnJS(onClose)();
      }
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            rate={playbackRate}
            
            // ExoPlayer & Performance Optimizations
            useTextureView={true}
            useExoShutter={false}
            shutterColor="transparent"
            progressUpdateInterval={1000}
            playInBackground={false}
            allowsExternalPlayback={true}
          />

          {/* Double-tap zones */}
          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
            <Pressable style={{ flex: 1 }} onPress={() => handleTap('left')} />
            <Pressable style={{ flex: 1 }} onPress={() => handleTap('right')} />
          </View>

          <GestureDetector gesture={panGesture}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none" />
          </GestureDetector>

          {seekFlash && (
            <Animated.View
              key={seekFlash.key}
              entering={FadeIn.duration(100)}
              exiting={FadeOut.duration(400)}
              style={{
                position: 'absolute',
                [seekFlash.side]: 16,
                top: '50%',
                transform: [{ translateY: -24 }],
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 32,
                paddingHorizontal: 16,
                paddingVertical: 8,
                zIndex: 60
              }}
            >
              <Text className="text-white font-bold text-sm">
                {seekFlash.side === 'right' ? '+10s' : '-10s'}
              </Text>
            </Animated.View>
          )}

          {isLoading && (
            <View className="absolute inset-0 items-center justify-center pointer-events-none">
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          )}

          <Animated.View 
            style={[StyleSheet.absoluteFill, animatedControlsStyle]}
            animatedProps={animatedPointerEvents}
            className="bg-black/20"
          >
            {/* Top Bar with Gradient */}
            <LinearGradient
              colors={['rgba(0,0,0,0.88)', 'rgba(0,0,0,0)']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingBottom: 40 }}
            >
              <View className="flex-row justify-between items-center p-4">
                <TouchableOpacity onPress={onClose} className="p-2 mr-2 bg-white/10 rounded-full">
                  <ChevronDown color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white font-bold text-base flex-1 mr-4" numberOfLines={1}>
                  {title}
                </Text>
                <TouchableOpacity onPress={() => setShowQualityMenu(!showQualityMenu)} className="p-1">
                  <Settings color="white" size={22} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Middle Controls */}
            <View className="flex-1 flex-row justify-center items-center space-x-12">
              <TouchableOpacity onPress={() => skip(-10)} className="p-4 bg-black/20 rounded-full">
                <SkipBack color="white" size={32} fill="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={togglePlay} 
                className="bg-white/10 p-6 rounded-full border border-white/20 shadow-2xl"
                style={{ width: 90, height: 90, justifyContent: 'center', alignItems: 'center' }}
              >
                {isPlaying ? <Pause color="white" size={48} fill="white" /> : <Play color="white" size={48} fill="white" />}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => skip(10)} className="p-4 bg-black/20 rounded-full">
                <SkipForward color="white" size={32} fill="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom Bar with Gradient */}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.92)']}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 40 }}
            >
              <View className="p-4">
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
                  <View className="flex-row space-x-4"></View>
                  <TouchableOpacity onPress={() => setIsFullScreen(!isFullScreen)} className="p-1">
                    {isFullScreen ? <Minimize color="white" size={22} /> : <Maximize color="white" size={22} />}
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
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

              <View className="mt-3 pt-3 border-t border-zinc-800">
                <Text className="text-zinc-500 text-[10px] font-bold uppercase mb-2 px-3 tracking-widest">Speed</Text>
                {SPEEDS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setPlaybackRate(s)}
                    className={`p-3 rounded-xl mb-1 flex-row justify-between items-center ${playbackRate === s ? 'bg-blue-600' : 'active:bg-zinc-800'}`}
                  >
                    <Text className="text-white font-semibold text-sm">{s === 1.0 ? 'Normal' : `${s}×`}</Text>
                    {playbackRate === s && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Pressable, StatusBar, TextInput } from 'react-native';
import Video, { VideoRef, OnLoadData, OnProgressData } from 'react-native-video';
import { Play, Pause, SkipForward, SkipBack, Settings, Maximize, Minimize, ChevronDown } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeOut, runOnJS, useAnimatedProps, useAnimatedReaction, withSequence, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';
import { AnimatedIcon } from './animated-icon';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface CustomVideoPlayerProps {
  links: Record<string, string>;
  onClose?: () => void;
  referer?: string;
  startPosition?: number;
  onProgressUpdate?: (pos: number) => void;
}

export const CustomVideoPlayer = React.memo(({ links, onClose, referer, startPosition, onProgressUpdate }: CustomVideoPlayerProps) => {
  const videoRef = useRef<VideoRef>(null);
  const [currentQuality, setCurrentQuality] = useState<string>(Object.keys(links)[0] || 'default');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Orientation & FS Support
  const toggleFullScreen = useCallback(async () => {
    if (!isFullScreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      StatusBar.setHidden(true);
      setIsFullScreen(true);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      StatusBar.setHidden(false);
      setIsFullScreen(false);
    }
  }, [isFullScreen]);

  useEffect(() => {
    return () => {
      // Ensure we reset orientation and status bar on unmount
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      StatusBar.setHidden(false);
    };
  }, []);

  const controlsOpacity = useSharedValue(1);
  const lastProgressUpdateRef = useRef(0);
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

  useEffect(() => {
    if (isPlaying) {
      scheduleHide();
    }
  }, [isPlaying, scheduleHide]);

  const showControls = useCallback(() => {
    controlsOpacity.value = withTiming(1, { duration: 300 });
    scheduleHide();
  }, [scheduleHide]);

  // Icon Animation logic
  const playOpacity = useSharedValue(1);
  const pauseOpacity = useSharedValue(0);

  useEffect(() => {
    playOpacity.value = withTiming(isPlaying ? 0 : 1, { duration: 250 });
    pauseOpacity.value = withTiming(isPlaying ? 1 : 0, { duration: 250 });
  }, [isPlaying]);

  const playIconStyle = useAnimatedStyle(() => ({
    opacity: playOpacity.value,
    transform: [{ scale: 0.8 + (playOpacity.value * 0.2) }],
    position: 'absolute'
  }));

  const pauseIconStyle = useAnimatedStyle(() => ({
    opacity: pauseOpacity.value,
    transform: [{ scale: 0.8 + (pauseOpacity.value * 0.2) }],
    position: 'absolute'
  }));

  const formatTimeWorklet = (seconds: number) => {
    'worklet';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLoad = useCallback((data: OnLoadData) => {
    setDuration(data.duration);
    setIsLoading(false);
    if (pendingScrubRef.current !== null) {
      videoRef.current?.seek(pendingScrubRef.current);
      pendingScrubRef.current = null;
    } else if (startPosition && startPosition > 5) {
      videoRef.current?.seek(startPosition);
    }
  }, [startPosition]);

  const handleProgress = useCallback((data: OnProgressData) => {
    progressRef.current = data.currentTime;
    // Guard: only update state if delta > 0.5s or significant enough
    if (Math.abs(data.currentTime - lastProgressUpdateRef.current) >= 0.5) {
      if (controlsOpacity.value > 0.1) {
        setProgress(data.currentTime);
      }
      lastProgressUpdateRef.current = data.currentTime;
    }
    onProgressUpdate?.(data.currentTime);
  }, [onProgressUpdate]);

  const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);

  const seek = useCallback((value: number) => {
    videoRef.current?.seek(value);
    setProgress(value);
    progressRef.current = value;
    lastProgressUpdateRef.current = value;
  }, []);

  const skip = useCallback((amount: number) => {
    const newPos = Math.max(0, Math.min(duration, progressRef.current + amount));
    videoRef.current?.seek(newPos);
    setProgress(newPos);
    progressRef.current = newPos;
    lastProgressUpdateRef.current = newPos;
  }, [duration]);

  const changeQuality = useCallback((q: string) => {
    pendingScrubRef.current = progressRef.current;
    setCurrentQuality(q);
    setShowQualityMenu(false);
    setIsLoading(true);
  }, []);

  // Gestures and features
  const thumbScale = useSharedValue(1);
  const slidingValue = useSharedValue(0);
  const [isSliding, setIsSliding] = useState(false);

  const leftFlashOpacity = useSharedValue(0);
  const rightFlashOpacity = useSharedValue(0);
  const continuousSeekInterval = useRef<NodeJS.Timeout>();

  const showSeekFlash = useCallback((side: 'left' | 'right') => {
    const opacity = side === 'left' ? leftFlashOpacity : rightFlashOpacity;
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(400, withTiming(0, { duration: 100 }))
    );
  }, []);

  const leftFlashStyle = useAnimatedStyle(() => ({
    opacity: leftFlashOpacity.value,
    transform: [{ scale: 1 + (leftFlashOpacity.value * 0.1) }]
  }));

  const rightFlashStyle = useAnimatedStyle(() => ({
    opacity: rightFlashOpacity.value,
    transform: [{ scale: 1 + (rightFlashOpacity.value * 0.1) }]
  }));

  const handleSlidingStart = useCallback(() => {
    thumbScale.value = withTiming(1.4, { duration: 200 });
    setIsSliding(true);
  }, []);

  const handleSlidingComplete = useCallback((value: number) => {
    thumbScale.value = withTiming(1, { duration: 200 });
    setIsSliding(false);
    seek(value);
  }, [seek]);

  const onSliderValueChange = useCallback((value: number) => {
    slidingValue.value = value;
  }, []);

  const slidingLabelStyle = useAnimatedStyle(() => {
    const percent = duration > 0 ? slidingValue.value / duration : 0;
    return {
      opacity: withTiming(isSliding ? 1 : 0),
      transform: [
        { translateX: (percent * (Dimensions.get('window').width - 64)) - 20 },
        { translateY: -40 }
      ]
    };
  });

  const slidingLabelProps = useAnimatedProps(() => {
    return {
      text: formatTimeWorklet(slidingValue.value),
    } as any;
  });

  const startContinuousSeek = useCallback((amount: number) => {
    skip(amount);
    continuousSeekInterval.current = setInterval(() => {
      skip(amount);
    }, 100);
  }, [skip]);

  const stopContinuousSeek = useCallback(() => {
    if (continuousSeekInterval.current) {
      clearInterval(continuousSeekInterval.current);
      continuousSeekInterval.current = undefined;
    }
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 100) {
        if (onClose) runOnJS(onClose)();
      }
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(showControls)();
    });

  const leftDoubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(skip)(-10);
      runOnJS(showSeekFlash)('left');
    });

  const rightDoubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(skip)(10);
      runOnJS(showSeekFlash)('right');
    });

  const leftLongPress = Gesture.LongPress()
    .onStart(() => {
      runOnJS(startContinuousSeek)(-2);
    })
    .onFinalize(() => {
      runOnJS(stopContinuousSeek)();
    });

  const rightLongPress = Gesture.LongPress()
    .onStart(() => {
      runOnJS(startContinuousSeek)(2);
    })
    .onFinalize(() => {
      runOnJS(stopContinuousSeek)();
    });

  const leftGestures = Gesture.Exclusive(leftLongPress, leftDoubleTap, tapGesture);
  const rightGestures = Gesture.Exclusive(rightLongPress, rightDoubleTap, tapGesture);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-black justify-center">
        <View 
          className="w-full relative overflow-hidden bg-zinc-950"
          style={isFullScreen ? {
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%', height: '100%',
            zIndex: 999
          } : { aspectRatio: 16/9 }}
        >
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
            progressUpdateInterval={1000}
            playInBackground={false}
            allowsExternalPlayback={true}
          />

          {/* Gesture zones */}
          <View style={StyleSheet.absoluteFill} className="flex-row">
            <GestureDetector gesture={leftGestures}>
              <View style={{ flex: 1 }} />
            </GestureDetector>
            <GestureDetector gesture={rightGestures}>
              <View style={{ flex: 1 }} />
            </GestureDetector>
          </View>

          <GestureDetector gesture={panGesture}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none" />
          </GestureDetector>

          {/* Seek Flashes */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 32,
                top: '50%',
                transform: [{ translateY: -24 }],
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 32,
                paddingHorizontal: 16,
                paddingVertical: 8,
                zIndex: 60
              },
              leftFlashStyle
            ]}
          >
            <Text className="text-white font-bold text-sm">-10s</Text>
          </Animated.View>

          <Animated.View
            style={[
              {
                position: 'absolute',
                right: 32,
                top: '50%',
                transform: [{ translateY: -24 }],
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 32,
                paddingHorizontal: 16,
                paddingVertical: 8,
                zIndex: 60
              },
              rightFlashStyle
            ]}
          >
            <Text className="text-white font-bold text-sm">+10s</Text>
          </Animated.View>

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
              <View className="flex-row justify-end items-center p-4">
                <TouchableOpacity 
                  onPress={() => setShowQualityMenu(!showQualityMenu)} 
                  className="p-1"
                >
                  <Settings color="white" size={22} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Middle Controls */}
            <View className="flex-1 flex-row justify-center items-center space-x-12">
              <Pressable 
                onPress={() => skip(-10)} 
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.9 : 1.0 }],
                  opacity: pressed ? 0.6 : 1.0
                })}
                className="p-4 bg-black/20 rounded-full"
              >
                <SkipBack color="white" size={32} fill="white" />
              </Pressable>
              
              <Pressable 
                onPress={togglePlay} 
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.88 : 1.0 }],
                  width: 90, 
                  height: 90, 
                  justifyContent: 'center', 
                  alignItems: 'center'
                })}
                className="bg-white/10 rounded-full border border-white/20 shadow-2xl"
              >
                <Animated.View style={playIconStyle}>
                  <Play color="white" size={48} fill="white" />
                </Animated.View>
                <Animated.View style={pauseIconStyle}>
                  <Pause color="white" size={48} fill="white" />
                </Animated.View>
                <View style={StyleSheet.absoluteFill} className="items-center justify-center opacity-30">
                  <AnimatedIcon />
                </View>
              </Pressable>

              <Pressable 
                onPress={() => skip(10)} 
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.9 : 1.0 }],
                  opacity: pressed ? 0.6 : 1.0
                })}
                className="p-4 bg-black/20 rounded-full"
              >
                <SkipForward color="white" size={32} fill="white" />
              </Pressable>
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
                
                <View className="relative">
                  <Animated.View 
                    style={[
                      {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundColor: '#3b82f6',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        zIndex: 100,
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                      slidingLabelStyle
                    ]}
                  >
                    <AnimatedTextInput
                      editable={false}
                      underlineColorAndroid="transparent"
                      animatedProps={slidingLabelProps}
                      style={{ color: 'white', fontSize: 10, fontWeight: 'bold', textAlign: 'center', padding: 0 }}
                    />
                  </Animated.View>

                  <Slider
                    style={{ width: '100%', height: 30 }}
                    minimumValue={0}
                    maximumValue={duration}
                    value={progress}
                    onSlidingStart={handleSlidingStart}
                    onSlidingComplete={handleSlidingComplete}
                    onValueChange={onSliderValueChange}
                    minimumTrackTintColor="#3b82f6"
                    maximumTrackTintColor="rgba(255,255,255,0.3)"
                    thumbTintColor="#3b82f6"
                  />
                </View>

                <View className="flex-row justify-between items-center mt-3">
                  <View className="flex-row space-x-4"></View>
                  <TouchableOpacity onPress={toggleFullScreen} className="p-1">
                    {isFullScreen ? <Minimize color="white" size={22} /> : <Maximize color="white" size={22} />}
                  </TouchableOpacity>
                </View>              </View>
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
            </Animated.View>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
});

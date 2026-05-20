import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Text, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchVideosPage } from '../lib/api';
import { Video } from '../lib/types';
import { MiniCard } from '../components/MiniCard';
import { ChevronLeft, X } from 'lucide-react-native';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    const data = await fetchVideosPage(query, 0, 50);
    setResults(data.videos);
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-4 py-3 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        
        <View className="flex-1 flex-row items-center bg-zinc-900 rounded-full px-4 py-2">
          <TextInput
            className="flex-1 text-white text-base h-10"
            placeholder="Search videos..."
            placeholderTextColor="#71717a"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X color="#71717a" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {results.length > 0 ? (
            results.map((v) => (
              <MiniCard 
                key={v.id} 
                video={v} 
                onClick={() => router.push(`/video/${v.id}`)} 
              />
            ))
          ) : query.length > 0 ? (
            <Text className="text-zinc-500 text-center mt-10">No results found for "{query}"</Text>
          ) : (
            <View className="mt-10 items-center">
              <Text className="text-zinc-500 text-lg">Search for your favorite content</Text>
            </View>
          )}
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

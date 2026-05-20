import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import '../../global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="search" />
        <Stack.Screen name="video/[id]" />
      </Stack>
    </>
  );
}

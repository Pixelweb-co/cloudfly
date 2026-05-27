import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/src/store/authSlice';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          // If we had an endpoint to fetch user profile using the token, we would call it here
          // For now, we'll assume the token is valid and just update the state
          dispatch(setCredentials({ user: { id: '0', name: 'User', role: 'admin' }, token }));
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Error checking auth state', e);
      } finally {
        setIsReady(true);
      }
    }

    checkAuth();
  }, [dispatch]);

  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-slate-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}

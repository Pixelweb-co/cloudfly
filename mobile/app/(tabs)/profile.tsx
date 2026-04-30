import React from 'react';
import { View } from 'react-native';
import { Text, Title, Appbar, Button, useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/src/store';
import { logout } from '@/src/store/authSlice';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const theme = useTheme();

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    dispatch(logout());
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <Appbar.Header className="bg-blue-600">
        <Appbar.Content title="Perfil" titleStyle={{ color: 'white' }} />
      </Appbar.Header>
      <View className="flex-1 p-6 items-center">
        <View className="w-24 h-24 bg-blue-100 rounded-full justify-center items-center mb-4">
          <Title className="text-3xl text-blue-600">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Title>
        </View>
        <Title className="text-2xl mb-1">{user?.name || 'Usuario'}</Title>
        <Text className="text-gray-500 mb-6">{user?.role || 'Rol no definido'}</Text>

        <Button 
          mode="contained" 
          onPress={handleLogout}
          buttonColor={theme.colors.error}
          className="w-full mt-4"
        >
          Cerrar Sesión
        </Button>
      </View>
    </View>
  );
}

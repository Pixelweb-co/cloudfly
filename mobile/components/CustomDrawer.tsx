import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Text, Divider, useTheme, Avatar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/src/store';
import { logout } from '@/src/store/authSlice';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { RbacService, MenuItem } from '@/src/services/rbac.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CustomDrawer(props: any) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const theme = useTheme();
  
  const [menu, setMenu] = useState<MenuItem[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuData = await RbacService.getMenu();
        // Filtrar items sin título para evitar el error de label undefined
        const validMenu = (menuData || []).filter(item => item && item.title);
        setMenu(validMenu);
      } catch (error) {
        console.error('Error in drawer menu fetch:', error);
      }
    };
    fetchMenu();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    dispatch(logout());
    router.replace('/login');
  };

  const mapIcon = (iconName?: string) => {
    if (!iconName) return 'circle-outline';
    const name = iconName.replace('tabler-', '');
    const iconMap: { [key: string]: keyof typeof MaterialCommunityIcons.glyphMap } = {
      'smart-home': 'home-outline',
      'home': 'home-outline',
      'user': 'account-outline',
      'users': 'account-group-outline',
      'calendar': 'calendar-blank-outline',
      'layout-kanban': 'view-column-outline',
      'file-text': 'file-document-outline',
      'settings': 'cog-outline',
      'chart-bar': 'chart-bar',
      'message-circle': 'message-text-outline',
      'shopping-cart': 'cart-outline',
    };
    return iconMap[name] || 'circle-outline';
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* User Profile Header */}
        <LinearGradient
          colors={['#7367F0', '#00CFE8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24, paddingTop: 60, paddingBottom: 24 }}
        >
          <Avatar.Text 
            size={64} 
            label={user?.username?.substring(0, 2).toUpperCase() || user?.nombres?.substring(0, 2).toUpperCase() || 'US'} 
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            labelStyle={{ color: 'white' }}
          />
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {user?.nombres || user?.username || 'Usuario'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
              {user?.email || 'admin@cloudfly.com.co'}
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingVertical: 12 }}>
          {/* Static Items */}
          <DrawerItem
            label="Inicio"
            icon={({ color, size }) => <MaterialCommunityIcons name="home-outline" size={size} color={color} />}
            onPress={() => props.navigation.navigate('index')}
            activeTintColor="#7367F0"
            inactiveTintColor="#444050"
            labelStyle={{ marginLeft: -16, fontSize: 15, fontWeight: '500' }}
          />

          <Divider style={{ marginVertical: 8, backgroundColor: '#EBEAED', marginHorizontal: 16 }} />
          
          <Text style={{ paddingHorizontal: 20, paddingVertical: 8, fontSize: 11, fontWeight: 'bold', color: '#B4B2BB', textTransform: 'uppercase', letterSpacing: 1 }}>
            Módulos
          </Text>

          {/* Dynamic Menu Items */}
          {menu.map((item, index) => (
            <DrawerItem
              key={item.id || `menu-${index}`}
              label={item.title || "Módulo"}
              icon={({ color, size }) => <MaterialCommunityIcons name={mapIcon(item.icon)} size={size} color={color} />}
              onPress={() => {
                if (item.path) {
                    const mobilePath = item.path.startsWith('/') ? item.path : `/${item.path}`;
                    router.push(mobilePath as any);
                }
              }}
              inactiveTintColor="#444050"
              labelStyle={{ marginLeft: -16, fontSize: 15 }}
            />
          ))}
        </View>
      </DrawerContentScrollView>

      {/* Logout at the bottom */}
      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#EBEAED' }}>
        <TouchableOpacity 
            onPress={handleLogout}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#FF4D49" />
          <Text style={{ marginLeft: 12, color: '#FF4D49', fontWeight: 'bold', fontSize: 15 }}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

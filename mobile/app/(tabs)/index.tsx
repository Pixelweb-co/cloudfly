import React, { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Title, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/src/store';
import { logout } from '@/src/store/authSlice';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { RbacService, MenuItem } from '@/src/services/rbac.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2;

export default function DashboardScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMenu = async () => {
    setLoading(true);
    const menuData = await RbacService.getMenu();
    setMenu(menuData);
    setLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMenu();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    dispatch(logout());
    router.replace('/login');
  };

  const mapIcon = (iconName?: string) => {
    if (!iconName) return 'view-grid-outline';
    
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
      'package': 'package-variant-closed',
      'credit-card': 'credit-card-outline',
      'building': 'office-building-outline',
      'robot': 'robot-outline',
      'api': 'api',
      'webhook': 'webhook',
      'bell': 'bell-outline',
    };

    return iconMap[name] || 'view-grid-outline';
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (!item.path && (!item.children || item.children.length === 0)) return null;

    return (
      <Card 
        key={item.id || index} 
        style={{ 
          width: CARD_WIDTH, 
          marginBottom: 16, 
          borderRadius: 16,
          backgroundColor: 'white',
          elevation: 2,
        }}
        onPress={() => {
          if (item.path) {
            const mobilePath = item.path.startsWith('/') ? item.path : `/${item.path}`;
            router.push(mobilePath as any);
          }
        }}
      >
        <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
          <View style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 14, 
            backgroundColor: '#7367F01A', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 12
          }}>
            <MaterialCommunityIcons name={mapIcon(item.icon)} size={26} color="#7367F0" />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#444050', textAlign: 'center' }} numberOfLines={1}>
            {item.title}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#F8F7FA' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7367F0']} />
      }
    >
      {/* Header Section (Banner) */}
      <LinearGradient
        colors={['#7367F0', '#9E95F5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '500' }}>Sesión activa</Text>
            <Text style={{ color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 4 }}>
              {user?.nombres || user?.username || 'Usuario'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ padding: 24, marginTop: -20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#444050', marginBottom: 20 }}>Módulos del Sistema</Text>
        
        {loading && !refreshing ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#7367F0" />
            <Text style={{ marginTop: 12, color: '#807D8B' }}>Sincronizando módulos...</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {menu.length > 0 ? (
              menu.flatMap((item, idx) => {
                const itemsToRender = [item];
                return itemsToRender.map((subItem, subIdx) => renderMenuItem(subItem, idx * 100 + subIdx));
              })
            ) : (
              <View style={{ width: '100%', paddingVertical: 40, alignItems: 'center' }}>
                <MaterialCommunityIcons name="view-grid-plus-outline" size={48} color="#EBEAED" />
                <Text style={{ marginTop: 12, color: '#807D8B', textAlign: 'center' }}>Sin módulos disponibles.</Text>
              </View>
            )}
          </View>
        )}

        {/* Quick Summary Card */}
        <Card style={{ marginTop: 8, borderRadius: 16, backgroundColor: 'white', elevation: 2 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#444050' }}>Estado del Canal</Text>
              <View style={{ backgroundColor: '#28C76F1A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                 <Text style={{ color: '#28C76F', fontSize: 10, fontWeight: 'bold' }}>EN LÍNEA</Text>
              </View>
            </View>
            <View style={{ height: 100, backgroundColor: '#F8F7FA', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#EBEAED' }}>
               <MaterialCommunityIcons name="chart-box-outline" size={32} color="#D0CFD6" />
               <Text style={{ color: '#807D8B', fontSize: 12, marginTop: 8 }}>Estadísticas de rendimiento en tiempo real</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

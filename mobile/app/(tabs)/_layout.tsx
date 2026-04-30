import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomDrawer from '@/components/CustomDrawer';
import { useTheme, Avatar, Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';

export default function DrawerLayout() {
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: 'white',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#EBEAED',
        },
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#444050' }}>CloudFly</Text>
          </View>
        ),
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => navigation.toggleDrawer()}
            style={{ marginLeft: 16 }}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#444050" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
             <Avatar.Text 
                size={32} 
                label={user?.username?.substring(0, 2).toUpperCase() || user?.nombres?.substring(0, 2).toUpperCase() || 'US'} 
                style={{ backgroundColor: '#7367F0' }}
                labelStyle={{ fontSize: 12 }}
             />
          </View>
        ),
        drawerType: 'front',
        drawerStyle: {
          width: 300,
        },
      })}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Drawer.Screen
        name="calendar"
        options={{
          title: 'Calendario',
        }}
      />
      <Drawer.Screen
        name="contacts"
        options={{
          title: 'Contactos',
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Perfil',
        }}
      />
    </Drawer>
  );
}

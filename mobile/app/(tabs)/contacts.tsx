import React from 'react';
import { View } from 'react-native';
import { Text, Title, Appbar } from 'react-native-paper';

export default function ContactsScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <Appbar.Header className="bg-blue-600">
        <Appbar.Content title="Contactos" titleStyle={{ color: 'white' }} />
      </Appbar.Header>
      <View className="flex-1 justify-center items-center p-4">
        <Title className="mb-2">Módulo de Contactos</Title>
        <Text className="text-gray-500 text-center">
          Lista de contactos y chat (WhatsApp/Facebook) irán aquí.
        </Text>
      </View>
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { Text, Title, Appbar } from 'react-native-paper';

export default function CalendarScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <Appbar.Header className="bg-blue-600">
        <Appbar.Content title="Calendario" titleStyle={{ color: 'white' }} />
      </Appbar.Header>
      <View className="flex-1 justify-center items-center p-4">
        <Title className="mb-2">Módulo de Calendario</Title>
        <Text className="text-gray-500 text-center">
          Aquí se integrará react-native-calendars para reemplazar @fullcalendar/react.
        </Text>
      </View>
    </View>
  );
}

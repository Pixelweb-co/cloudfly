import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Checkbox, useTheme, Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { setCredentials } from '@/src/store/authSlice';
import { AuthService } from '@/src/services/auth.service';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const dispatch = useDispatch();
  const router = useRouter();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await AuthService.login({ username, password });
      const token = data.jwt || data.token || data.accessToken;
      if (token) {
        await SecureStore.setItemAsync('userToken', token);
      }
      dispatch(setCredentials({ user: data.user || data, token }));
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error de autenticación. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7FA' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Logo Section */}
          <View style={{ marginBottom: 32, flexDirection: 'row', alignItems: 'center' }}>
             <View style={{ width: 34, height: 34, backgroundColor: '#7367F0', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <MaterialCommunityIcons name="cloud-outline" size={22} color="white" />
             </View>
             <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#444050' }}>CloudFly</Text>
          </View>

          {/* Header Section */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <LinearGradient
              colors={['#7367F0', '#00CFE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 20, 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: 20,
                elevation: 4
              }}
            >
              <MaterialCommunityIcons name="login-variant" size={40} color="white" />
            </LinearGradient>
            
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#444050', textAlign: 'center' }}>
              ¡Bienvenido de vuelta! 👋
            </Text>
            <Text style={{ fontSize: 15, color: '#807D8B', textAlign: 'center', marginTop: 8, paddingHorizontal: 10 }}>
              Ingresa a tu cuenta y continúa automatizando tu negocio
            </Text>
          </View>

          {/* Form Section */}
          <View style={{ gap: 16 }}>
            <TextInput
              label="Nombre de usuario"
              placeholder="juanperez123"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              mode="outlined"
              error={!!error}
              left={<TextInput.Icon icon="account-outline" />}
              style={{ backgroundColor: 'white' }}
              outlineStyle={{ borderRadius: 8 }}
              theme={{ colors: { primary: '#7367F0' } }}
            />

            <TextInput
              label="Contraseña"
              placeholder="············"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordShown}
              mode="outlined"
              error={!!error}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon 
                  icon={isPasswordShown ? "eye-off-outline" : "eye-outline"} 
                  onPress={() => setIsPasswordShown(!isPasswordShown)}
                />
              }
              style={{ backgroundColor: 'white' }}
              outlineStyle={{ borderRadius: 8 }}
              theme={{ colors: { primary: '#7367F0' } }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Checkbox.Android
                  status={rememberMe ? 'checked' : 'unchecked'}
                  onPress={() => setRememberMe(!rememberMe)}
                  color="#7367F0"
                />
                <Text style={{ fontSize: 14, color: '#444050' }}>Recordarme</Text>
              </View>
              <TouchableOpacity>
                <Text style={{ fontSize: 14, color: '#7367F0', fontWeight: '500' }}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={{ backgroundColor: '#FF4D491A', padding: 12, borderRadius: 8, marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF4D49" />
                <Text style={{ color: '#FF4D49', fontSize: 13, marginLeft: 8, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 16, borderRadius: 8, paddingVertical: 4, backgroundColor: '#7367F0' }}
              labelStyle={{ fontSize: 15, fontWeight: '600', textTransform: 'none' }}
              contentStyle={{ height: 48 }}
            >
              Iniciar Sesión
            </Button>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
              <Text style={{ fontSize: 14, color: '#444050' }}>¿Nuevo en CloudFly? </Text>
              <TouchableOpacity>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#7367F0' }}>Prueba 14 días gratis</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
              <Divider style={{ flex: 1, backgroundColor: '#EBEAED' }} />
              <Text style={{ marginHorizontal: 16, fontSize: 12, color: '#807D8B', textTransform: 'uppercase' }}>O continúa con</Text>
              <Divider style={{ flex: 1, backgroundColor: '#EBEAED' }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                mode="outlined"
                style={{ flex: 1, borderRadius: 8, borderColor: '#EBEAED' }}
                contentStyle={{ height: 44 }}
                labelStyle={{ color: '#444050', fontSize: 14, fontWeight: '500' }}
                icon={({ size, color }) => (
                  <MaterialCommunityIcons name="google" size={20} color="#444050" />
                )}
                onPress={() => {}}
              >
                Google
              </Button>
              <Button
                mode="outlined"
                style={{ flex: 1, borderRadius: 8, borderColor: '#EBEAED' }}
                contentStyle={{ height: 44 }}
                labelStyle={{ color: '#444050', fontSize: 14, fontWeight: '500' }}
                icon={({ size, color }) => (
                  <MaterialCommunityIcons name="microsoft" size={20} color="#444050" />
                )}
                onPress={() => {}}
              >
                Microsoft
              </Button>
            </View>

            {/* Security Footer */}
            <View style={{ marginTop: 24, padding: 16, backgroundColor: '#7367F00D', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="shield-check-outline" size={24} color="#7367F0" />
              <Text style={{ fontSize: 12, color: '#807D8B', marginLeft: 12, flex: 1, lineHeight: 18 }}>
                <Text style={{ fontWeight: '600', color: '#444050' }}>Conexión segura.</Text> Tus datos están protegidos con encriptación SSL.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import type { ReactNode } from 'react'
import React, { createContext, useContext, useState } from 'react'

import axios from 'axios'
import dotenv from "dotenv";

// Tipo para el endpoint
type Endpoint = {
  url: string
  params?: Record<string, any>
}

// Contexto para manejar el token y solicitudes
interface AuthContextType {
  token: string | null
  setToken: (token: string | null) => void
  login: (credentials: { username: string; password: string }) => Promise<void>
  doRequest: (endpoint: Endpoint) => Promise<any>
  messages: string[]
  clearMessages: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<string[]>([])
  const ApiUrl = `${process.env.NEXT_PUBLIC_API_URL}`

  const addMessage = (message: string) => setMessages(prev => [...prev, message])
  const clearMessages = () => setMessages([])

  // Función de login
  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await axios.post(`${ApiUrl}/auth/login`, credentials)
      const jwtToken = response.data.token

      setToken(jwtToken)
      addMessage('Inicio de sesión exitoso.')
    } catch (error) {
      addMessage('Error al iniciar sesión. Verifica tus credenciales.')
    }
  }

  // Función para realizar solicitudes autenticadas
  const doRequest = async (endpoint: Endpoint) => {
    if (!token) {
      addMessage('No se encontró un token. Por favor, inicia sesión.')

      return
    }

    try {
      const response = await axios({
        method: 'GET', // Cambia el método según lo necesites
        url: `${ApiUrl}${endpoint.url}`,
        headers: { Authorization: `Bearer ${token}` },
        params: endpoint.params
      })

      addMessage('Solicitud realizada con éxito.')

      return response.data
    } catch (error) {
      addMessage('Error durante la solicitud.')
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ token, setToken, login, doRequest, messages, clearMessages }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }

  return context
}

// Modal para mostrar mensajes
const Modal = ({ messages, onClose }: { messages: string[]; onClose: () => void }) => {
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50'>
      <div className='bg-white p-6 rounded shadow-lg w-96'>
        <h2 className='text-lg font-bold mb-4'>Mensajes</h2>
        <ul className='space-y-2'>
          {messages.map((msg, index) => (
            <li key={index} className='text-gray-700'>
              {msg}
            </li>
          ))}
        </ul>
        <button onClick={onClose} className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
          Cerrar
        </button>
      </div>
    </div>
  )
}

// Componente principal
const HttpRequests = ({ children }: { children: ReactNode }) => {
  const { messages, clearMessages } = useAuth()

  return (
    <>
      {children}
      {messages.length > 0 && <Modal messages={messages} onClose={clearMessages} />}
    </>
  )
}

export default HttpRequests

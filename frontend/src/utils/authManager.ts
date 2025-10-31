import axios from 'axios'
import { jwtDecode } from "jwt-decode";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const AuthManager = {
  get API_URL() {
    return `${API_BASE_URL}/auth/login`
  },

  async authorize(data: { username: string; password: string }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log(response.data)
      localStorage.setItem('AuthToken', response.data.jwt)
      localStorage.setItem('UserLogin', JSON.stringify(response.data.userEntity))

      return response.data
    } catch (error) {
      console.error('Error durante la autenticación:', error)
      throw error
    }
  },

  async register(data: { username: string; password: string; email: string; roleRequest: any }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      localStorage.setItem('AuthToken', response.data.jwt)
      localStorage.setItem('UserLogin', JSON.stringify(response.data.userEntity))

      return response.data
    } catch (error) {
      console.error('Error durante el registro:', error)
      throw error
    }
  },

  async validateUsername(data: { username: string }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/validate-username`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return response.data
    } catch (error) {
      console.error('Error durante la validación del username:', error)
      throw error
    }
  },

  async validateAccount(data: { validationToken: string }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/validate-account`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return true
    } catch (error) {
      console.error('Error durante la validación de la cuenta:', error)
      throw error
    }
  },

  async validateEmail(data: { email: string }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/validate-email`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return response.data
    } catch (error) {
      console.error('Error durante la validación del email:', error)
      throw error
    }
  },

  async logout() {
    try {
      localStorage.removeItem('AuthToken')
      localStorage.removeItem('UserLogin')
    } catch (error: any) {
      console.log(error)
    }
  },

  async validateToken() {
    try {
      const token = localStorage.getItem('AuthToken')
      if (!token) {

        console.error('Token no encontrado')
        localStorage.removeItem('AuthToken')
        localStorage.removeItem('UserLogin')
        location.href = '/login'
        return false
      }
      const decodedToken: any = jwtDecode(token)
      const expirationDate = new Date(decodedToken.exp * 1000)
      console.log('Fecha de expiración:', expirationDate)
      console.log('Fecha actual:', new Date())
      console.log('Token:', token)
      console.log('Decoded Token:', decodedToken)
      console.log('Usuario:', decodedToken.sub)
      console.log('Rol:', decodedToken.role)
      const currentDate = new Date()
      if (expirationDate < currentDate) {
        console.error('Token expirado')
        localStorage.removeItem('AuthToken')
        localStorage.removeItem('UserLogin')
        location.href = '/login'
        return false
      }

      return true
    } catch (error) {
      console.error('Error durante la validación del token:', error)
      throw error
      return false
    }
  },

  async resetPassword(data: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        newPassword: data.newPassword,
        token: data.token
      })

      return response.data
    } catch (error) {
      console.error('Error durante el reseteo de la contraseña:', error)
      throw error
    }
  }
}

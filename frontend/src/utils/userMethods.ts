'use client'

export const userMethods = {
  isRole: (roleName: string) => {
    if (typeof window === 'undefined') return false

    // ESTANDARIZADO: usar 'userData' que es lo que guarda Login.tsx
    const userLoginString = localStorage.getItem('userData')

    if (!userLoginString) {
      return false
    }

    let userLogin

    try {
      userLogin = JSON.parse(userLoginString)
    } catch (error) {
      return false
    }

    if (!userLogin || !userLogin.roles) {
      return false
    }

    return userLogin.roles.find((role: any) => role.role === roleName)
  },

  getUserLogin: () => {
    if (typeof window === 'undefined') return null

    // ESTANDARIZADO: usar 'userData' que es lo que guarda Login.tsx
    const userLoginString = localStorage.getItem('userData')

    if (!userLoginString) {
      return null
    }

    let userLogin

    try {
      userLogin = JSON.parse(userLoginString)
    } catch (error) {
      return null
    }

    return userLogin
  }
}

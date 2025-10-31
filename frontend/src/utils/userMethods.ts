'use client'

export const userMethods = {
  isRole: (roleName: string) => {
    if (typeof window === 'undefined') return false

    const userLoginString = localStorage.getItem('UserLogin')

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

    return userLogin.roles.find((role: any) => role.roleEnum === roleName)
  },

  getUserLogin: () => {
    if (typeof window === 'undefined') return null

    const userLoginString = localStorage.getItem('UserLogin')

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

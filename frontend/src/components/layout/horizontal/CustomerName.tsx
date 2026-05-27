'use client'

import { useEffect, useState } from 'react'
import { userMethods } from '@/utils/userMethods'

const CustomerName = () => {
  const [name, setName] = useState('')

  useEffect(() => {
    const loguedUser = userMethods.getUserLogin()
    setName((loguedUser && loguedUser.customer?.name) || '')
  }, [])

  return <b suppressHydrationWarning>{name}</b>
}

export default CustomerName

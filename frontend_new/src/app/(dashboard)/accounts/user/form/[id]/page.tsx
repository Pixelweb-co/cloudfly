'use client'

import { useParams } from 'next/navigation'
import RegisterV3 from '@/views/pages/auth/RegisterV3'

const UserEditPage = () => {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || ''

  return <RegisterV3 id={id} />
}

export default UserEditPage

'use client'

import { useParams } from 'next/navigation'

import RegisterV3 from '@/views/pages/auth/RegisterV3'

const RegisterPage = () => {
  // Vars
  const { id } = useParams()
  const idToUse = Array.isArray(id) ? id[0] : id

  console.log(id)
  console.log(idToUse)

  return <RegisterV3 id={idToUse ? idToUse : '0'} />
}

export default RegisterPage

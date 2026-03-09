'use client'

// React Imports
import { useEffect, useState } from 'react'

// Component Imports
import UserList from '@/views/apps/user/list'

// Service Imports
import type { User } from '@/services/userService';
import userService from '@/services/userService'

const UserListPage = () => {
    // States
    const [userData, setUserData] = useState<User[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await userService.getAllUsers()

                // Map backend UserDTO to frontend UsersType if needed
                // Backend: UserDTO { id, username, email, roles: Set<String>, ... }
                // Frontend: UsersType { id, role, username, email, ... }

                // Basic mapping
                const mappedData = data.map((user: any) => ({
                    ...user,
                    role: user.roles && user.roles.length > 0 ? user.roles[0] : 'User', // Display first role
                    currentPlan: 'Basic', // Mock or fetch
                    avatar: '',
                    status: user.isEnabled ? 'active' : 'inactive',
                    company: 'CloudFly'
                }))

                setUserData(mappedData)
            } catch (error) {
                console.error('Error fetching users:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return <div>Loading...</div>
    }

    return <UserList userData={userData} />
}

export default UserListPage

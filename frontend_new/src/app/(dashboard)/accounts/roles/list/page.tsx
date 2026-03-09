'use client'

// React Imports
import { useEffect, useState } from 'react'

// Component Imports
import RoleList from '@/views/apps/roles/list'

// Service Imports
import roleService, { Role } from '@/services/roleService'

const RoleListPage = () => {
    // States
    const [roleData, setRoleData] = useState<Role[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await roleService.getAllRoles()
                setRoleData(data)
            } catch (error) {
                console.error('Error fetching roles:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return <div>Loading...</div>
    }

    return <RoleList roleData={roleData} />
}

export default RoleListPage

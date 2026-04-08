'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Autocomplete, TextField, Box, CircularProgress, Typography } from '@mui/material'
import { userMethods } from '@/utils/userMethods'
import axiosInstance from '@/utils/axiosInstance'

const CustomerName = () => {
  const [userData, setUserData] = useState<any>(null)
  const [tenants, setTenants] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // Role detection
  const isManager = useMemo(() => {
    if (!userData || !userData.roles) return false
    return userData.roles.some((r: any) => (r.name || r.role || '').includes('MANAGER'))
  }, [userData])

  const isAdmin = useMemo(() => {
    if (!userData || !userData.roles) return false
    return userData.roles.some((r: any) => (r.name || r.role || '').includes('ADMIN')) && !isManager
  }, [userData, isManager])

  const isUser = useMemo(() => {
    if (!userData || !userData.roles) return false
    return !isManager && !isAdmin
  }, [userData, isManager, isAdmin])

  // Initialize
  useEffect(() => {
    const user = userMethods.getUserLogin()
    if (user) {
      setUserData(user)
      
      const tenantId = user.customerId || user.tenant_id;
      const tenantName = user.customer?.name || user.customerName || user.tenant_name || user.companyName || 'Sede Principal';
      
      if (tenantId) {
        setSelectedTenant({ id: tenantId, name: tenantName })
      }
      
      const compId = user.company_id || user.activeCompanyId;
      const compName = user.company_name || user.activeCompanyName;
      if (compId) {
        setSelectedCompany({ id: compId, name: compName })
      }
    }
  }, [])

  // Fetch Tenants (Only for MANAGER)
  useEffect(() => {
    if (isManager && tenants.length === 0) {
      setLoadingTenants(true)
      axiosInstance.get('/customers')
        .then(res => {
          setTenants(res.data)
          setLoadingTenants(false)
        })
        .catch(() => setLoadingTenants(false))
    }
  }, [isManager, tenants.length])

  // Fetch Companies when Tenant changes (MANAGER) or Initial Load (ADMIN)
  useEffect(() => {
    if ((isManager || isAdmin) && selectedTenant) {
      setLoadingCompanies(true)
      axiosInstance.get(`/api/v1/companies?tenantId=${selectedTenant.id}`)
        .then(res => {
          setCompanies(res.data)
          setLoadingCompanies(false)
        })
        .catch(() => setLoadingCompanies(false))
    } else {
      setCompanies([])
    }
  }, [isManager, isAdmin, selectedTenant])

  const handleSwitchContext = useCallback((company: any) => {
    if (!company || !selectedTenant) return

    const updatedUser = { ...userData }
    updatedUser.customerId = selectedTenant.id
    updatedUser.tenant_id = selectedTenant.id
    updatedUser.customer = { ...updatedUser.customer, id: selectedTenant.id, name: selectedTenant.name }
    updatedUser.activeCompanyId = company.id
    updatedUser.company_id = company.id
    updatedUser.activeCompanyName = company.name
    updatedUser.company_name = company.name

    localStorage.setItem('userData', JSON.stringify(updatedUser))
    
    // Hard reload to refresh all context/hooks
    window.location.reload()
  }, [userData, selectedTenant])

  if (!userData) return null

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {/* MANAGER: Can change Tenant */}
      {isManager ? (
        <Autocomplete
          size='small'
          options={tenants}
          getOptionLabel={(option) => option.name || ''}
          value={selectedTenant}
          loading={loadingTenants}
          onChange={(_, newValue) => {
            setSelectedTenant(newValue)
            setSelectedCompany(null)
          }}
          sx={{ width: 220 }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Tenant" 
              placeholder="Seleccionar Cliente" 
              variant="outlined" 
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingTenants ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      ) : (
        /* ADMIN/USER: Static Tenant Name */
        <Typography variant='h6' sx={{ fontWeight: 700, color: 'text.primary', mr: 2 }}>
          {userData.customer?.name || ''}
        </Typography>
      )}

      {/* MANAGER/ADMIN: Can change Company */}
      {(isManager || isAdmin) ? (
        <Autocomplete
          size='small'
          options={companies}
          getOptionLabel={(option) => option.name || ''}
          value={selectedCompany}
          loading={loadingCompanies}
          disabled={!selectedTenant}
          onChange={(_, newValue) => {
            if (newValue) {
              setSelectedCompany(newValue)
              handleSwitchContext(newValue)
            }
          }}
          sx={{ width: 220 }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Compañía" 
              placeholder="Seleccionar Sede" 
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingCompanies ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      ) : (
        /* USER: Static Company Name */
        <Typography variant='h6' sx={{ fontWeight: 700, color: 'text.secondary' }}>
          {userData.company_name ? ` - ${userData.company_name}` : ''}
        </Typography>
      )}
    </Box>
  )
}

export default CustomerName

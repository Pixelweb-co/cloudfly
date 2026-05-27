'use client'

import { useState, useEffect, useCallback } from 'react'
import { Employee } from '@/types/hr'
import {
    TextField,
    Autocomplete,
    Box,
    Typography,
    CircularProgress,
    Chip
} from '@mui/material'
import { Search, Person } from '@mui/icons-material'
import { employeeService } from '@/services/hr/employeeService'

interface EmployeeSearchProps {
    onSelect: (employee: Employee) => void
    excludeIds?: number[]
    placeholder?: string
    label?: string
    disabled?: boolean
    minChars?: number
    customerId?: number
}

export default function EmployeeSearch({
    onSelect,
    excludeIds = [],
    placeholder = 'Buscar por identificación, nombre o teléfono...',
    label = 'Buscar Empleado',
    disabled = false,
    minChars = 4,
    customerId = 1
}: EmployeeSearchProps) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [options, setOptions] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)

    // Debounce search
    useEffect(() => {
        if (inputValue.length < minChars) {
            setOptions([])
            return
        }

        const timeoutId = setTimeout(() => {
            searchEmployees(inputValue)
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [inputValue, minChars])

    const searchEmployees = async (query: string) => {
        setLoading(true)
        try {
            const response = await employeeService.search(customerId, query, 0, 20)
            // Filtrar empleados ya excluidos
            const filtered = (response.content || []).filter(
                emp => !excludeIds.includes(emp.id)
            )
            setOptions(filtered)
        } catch (error) {
            console.error('Error searching employees:', error)
            setOptions([])
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (employee: Employee | null) => {
        if (employee) {
            onSelect(employee)
            setInputValue('')
            setOptions([])
        }
    }

    return (
        <Autocomplete
            open={open && inputValue.length >= minChars}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            disabled={disabled}
            options={options}
            loading={loading}
            getOptionLabel={(option) => option.fullName}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(x) => x} // Disable client-side filtering, we handle it server-side
            onChange={(_, value) => handleSelect(value)}
            inputValue={inputValue}
            onInputChange={(_, newValue) => setInputValue(newValue)}
            noOptionsText={
                inputValue.length < minChars
                    ? `Escribe al menos ${minChars} caracteres...`
                    : 'No se encontraron empleados'
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={placeholder}
                    size="small"
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <Search color="action" sx={{ ml: 1, mr: 0.5 }} />
                        ),
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => (
                <Box
                    component="li"
                    {...props}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1
                    }}
                >
                    <Person color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                            {option.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {option.nationalId || 'Sin ID'}
                            {option.phone && ` • ${option.phone}`}
                            {option.department && ` • ${option.department}`}
                        </Typography>
                    </Box>
                    <Chip
                        label={`$${(option.baseSalary || 0).toLocaleString()}`}
                        size="small"
                        color="success"
                        variant="outlined"
                    />
                </Box>
            )}
        />
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Switch from '@mui/material/Switch'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import { toast } from 'react-toastify'

// Service Imports
import { employeeService } from '@/services/hr/employeeService'

// Types
type EmployeeFormData = {
    // Datos Personales
    firstName: string
    lastName: string
    nationalId: string
    rfc?: string
    curp?: string
    email: string
    phone: string
    // Datos Laborales
    hireDate: string
    jobTitle?: string
    department?: string
    contractTypeEnum?: string
    // Datos de Nómina
    baseSalary: number
    paymentFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
    paymentMethod?: string
    salaryType?: string
    hasTransportAllowance: boolean
    // Datos Bancarios
    bankName?: string
    bankAccount?: string
    clabe?: string
    // Seguridad Social
    nss?: string
    eps?: string
    afp?: string
    arl?: string
    cesantiasBox?: string
    // Campos adicionales Colombia
    arlRiskLevel?: string
    cajaCompensacion?: string
    workSchedule?: string
    monthlyWorkedDays?: number
    hasFamilySubsidy: boolean
    // Estado y otros
    isActive: boolean
    photoUrl?: string
}

const EmployeeForm = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const employeeId = searchParams?.get('id')
    const isEditMode = !!employeeId

    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [originalEmployee, setOriginalEmployee] = useState<any>(null)

    // Validation schema
    const schema = yup.object().shape({
        firstName: yup.string().required('El nombre es obligatorio').max(100),
        lastName: yup.string().required('El apellido es obligatorio').max(100),
        nationalId: yup.string().required('El documento de identidad es obligatorio').max(50),
        rfc: yup.string().max(13),
        curp: yup.string().max(18),
        email: yup.string().email('Email inválido').max(100),
        phone: yup.string().max(20),
        hireDate: yup.string().required('La fecha de ingreso es obligatoria'),
        jobTitle: yup.string().max(100),
        department: yup.string().max(100),
        contractTypeEnum: yup.string(),
        baseSalary: yup
            .number()
            .required('El salario base es obligatorio')
            .positive('El salario debe ser mayor a cero')
            .min(1300000, 'El salario no puede ser menor al salario mínimo (1.300.000)'),
        paymentFrequency: yup.string().required('La frecuencia de pago es obligatoria'),
        paymentMethod: yup.string(),
        salaryType: yup.string(),
        hasTransportAllowance: yup.boolean(),
        bankName: yup.string().max(100),
        bankAccount: yup.string().max(50),
        clabe: yup.string().max(18),
        nss: yup.string().max(50),
        eps: yup.string().max(100),
        afp: yup.string().max(100),
        arl: yup.string().max(100),
        cesantiasBox: yup.string().max(100),
        arlRiskLevel: yup.string(),
        cajaCompensacion: yup.string().max(100),
        workSchedule: yup.string(),
        monthlyWorkedDays: yup.number().min(1).max(30),
        hasFamilySubsidy: yup.boolean(),
        isActive: yup.boolean(),
        photoUrl: yup.string()
    })

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        reset
    } = useForm<EmployeeFormData>({
        resolver: yupResolver(schema) as any,
        defaultValues: {
            hasTransportAllowance: true,
            hasFamilySubsidy: false,
            isActive: true,
            paymentFrequency: 'BIWEEKLY',
            paymentMethod: 'BANK_TRANSFER',
            salaryType: 'ORDINARIO',
            contractTypeEnum: 'INDEFINIDO',
            arlRiskLevel: 'RIESGO_I',
            workSchedule: 'TIEMPO_COMPLETO',
            monthlyWorkedDays: 30,
            eps: '',
            afp: '',
            arl: '',
            cesantiasBox: '',
            cajaCompensacion: '',
            rfc: '',
            curp: '',
            nss: '',
            bankName: '',
            bankAccount: '',
            clabe: ''
        }
    })

    // Load employee data when in edit mode
    useEffect(() => {
        if (isEditMode && employeeId) {
            loadEmployeeData()
        }
    }, [employeeId, isEditMode])

    const loadEmployeeData = async () => {
        try {
            setLoading(true)
            const data = await employeeService.getById(parseInt(employeeId!), 1)

            // Save original employee data
            setOriginalEmployee(data)

            // Populate form with employee data
            reset({
                firstName: data.firstName,
                lastName: data.lastName,
                nationalId: data.nationalId || '',
                rfc: data.rfc || '',
                curp: data.curp || '',
                email: data.email || '',
                phone: data.phone || '',
                hireDate: data.hireDate ? data.hireDate.split('T')[0] : '',
                jobTitle: data.jobTitle || '',
                department: data.department || '',
                contractTypeEnum: data.contractTypeEnum || 'INDEFINIDO',
                baseSalary: data.baseSalary,
                paymentFrequency: data.paymentFrequency,
                paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
                salaryType: data.salaryType || 'ORDINARIO',
                hasTransportAllowance: data.hasTransportAllowance ?? true,
                bankName: data.bankName || '',
                bankAccount: data.bankAccount || '',
                clabe: data.clabe || '',
                nss: data.nss || '',
                eps: data.eps || '',
                afp: data.afp || '',
                arl: data.arl || '',
                cesantiasBox: data.cesantiasBox || '',
                arlRiskLevel: data.arlRiskLevel || 'RIESGO_I',
                cajaCompensacion: data.cajaCompensacion || '',
                workSchedule: data.workSchedule || 'TIEMPO_COMPLETO',
                monthlyWorkedDays: data.monthlyWorkedDays || 30,
                hasFamilySubsidy: data.hasFamilySubsidy ?? false,
                isActive: data.isActive
            })
        } catch (error) {
            console.error('Error loading employee:', error)
            toast.error('Error al cargar los datos del empleado')
        } finally {
            setLoading(false)
        }
    }

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]

        if (file) {
            // Preview
            const reader = new FileReader()

            reader.onloadend = () => {
                setSelectedImage(reader.result as string)
            }

            reader.readAsDataURL(file)

            // Upload (implement your upload logic here)
            // For now just set preview
            // In production, upload to server and get URL
        }
    }

    const onSubmit = async (data: EmployeeFormData) => {
        try {
            setUploading(true)

            // Prepare employee data
            let employeeData: any = {
                ...data,
                baseSalary: data.baseSalary,
                monthlyWorkedDays: data.monthlyWorkedDays || 30
            }

            // Add photo URL if selected
            if (selectedImage) {
                employeeData.photoUrl = selectedImage
            }

            // In edit mode, merge with original data to preserve fields not in the form
            if (isEditMode && employeeId && originalEmployee) {
                employeeData = {
                    ...originalEmployee,
                    ...employeeData,
                    // Ensure we keep the ID
                    id: originalEmployee.id
                }
                await employeeService.update(parseInt(employeeId), employeeData, 1)
                toast.success('Empleado actualizado exitosamente')
            } else {
                await employeeService.create(employeeData, 1)
                toast.success('Empleado creado exitosamente')
            }
            router.push('/hr/employees')
        } catch (error: any) {
            console.error('Error saving employee:', error)
            toast.error(error?.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el empleado`)
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
                <Typography>Cargando datos del empleado...</Typography>
            </Box>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={6}>
                {/* Foto del Empleado */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader title={isEditMode ? '✏️ Editar Empleado' : '👤 Nuevo Empleado'} />
                        <CardContent>
                            <Box display='flex' flexDirection='column' alignItems='center' gap={4}>
                                <Avatar
                                    src={selectedImage || '/images/avatars/1.png'}
                                    sx={{ width: 120, height: 120 }}
                                />
                                <Button
                                    component='label'
                                    variant='outlined'
                                    startIcon={<i className='tabler-upload' />}
                                >
                                    Subir Foto
                                    <input
                                        type='file'
                                        hidden
                                        accept='image/*'
                                        onChange={handleImageChange}
                                    />
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Información Personal */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader title='Información Personal' />
                        <CardContent>
                            <Grid container spacing={4}>
                                <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                        fullWidth
                                        label='Nombres *'
                                        placeholder='Juan'
                                        {...register('firstName')}
                                        error={!!errors.firstName}
                                        helperText={errors.firstName?.message}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                        fullWidth
                                        label='Apellidos *'
                                        placeholder='Pérez'
                                        {...register('lastName')}
                                        error={!!errors.lastName}
                                        helperText={errors.lastName?.message}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                        fullWidth
                                        label='Cédula / Documento *'
                                        placeholder='123456789'
                                        {...register('nationalId')}
                                        error={!!errors.nationalId}
                                        helperText={errors.nationalId?.message}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                        fullWidth
                                        label='Email'
                                        type='email'
                                        placeholder='juan.perez@example.com'
                                        {...register('email')}
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                        fullWidth
                                        label='Teléfono'
                                        placeholder='3001234567'
                                        {...register('phone')}
                                        error={!!errors.phone}
                                        helperText={errors.phone?.message}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Información Laboral */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader title='Información Laboral' />
                        <CardContent>
                            <Grid container spacing={4}>
                                <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                        fullWidth
                                        label='Cargo / Puesto'
                                        placeholder='Desarrollador'
                                        {...register('jobTitle')}
                                        error={!!errors.jobTitle}
                                        helperText={errors.jobTitle?.message}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                        fullWidth
                                        label='Departamento / Área'
                                        placeholder='IT'
                                        {...register('department')}
                                        error={!!errors.department}
                                        helperText={errors.department?.message}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                        fullWidth
                                        label='Fecha de Ingreso *'
                                        type='date'
                                        InputLabelProps={{ shrink: true }}
                                        {...register('hireDate')}
                                        error={!!errors.hireDate}
                                        helperText={errors.hireDate?.message}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <CustomTextField
                                        fullWidth
                                        label='Salario Base Mensual *'
                                        type='number'
                                        placeholder='1300000'
                                        {...register('baseSalary')}
                                        error={!!errors.baseSalary}
                                        helperText={errors.baseSalary?.message}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth error={!!errors.paymentFrequency}>
                                        <InputLabel>Frecuencia de Pago *</InputLabel>
                                        <Controller
                                            name='paymentFrequency'
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label='Frecuencia de Pago *'>
                                                    <MenuItem value='WEEKLY'>Semanal</MenuItem>
                                                    <MenuItem value='BIWEEKLY'>Quincenal</MenuItem>
                                                    <MenuItem value='MONTHLY'>Mensual</MenuItem>
                                                </Select>
                                            )}
                                        />
                                        {errors.paymentFrequency && (
                                            <FormHelperText>{errors.paymentFrequency.message}</FormHelperText>
                                        )}
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Método de Pago</InputLabel>
                                        <Controller
                                            name='paymentMethod'
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label='Método de Pago'>
                                                    <MenuItem value='BANK_TRANSFER'>Transferencia Bancaria</MenuItem>
                                                    <MenuItem value='CASH'>Efectivo</MenuItem>
                                                    <MenuItem value='CHECK'>Cheque</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Seguridad Social (Colombia) */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader title='Seguridad Social' />
                        <CardContent>
                            <Grid container spacing={4}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>EPS (Entidad Promotora de Salud)</InputLabel>
                                        <Controller
                                            name='eps'
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label='EPS (Entidad Promotora de Salud)'>
                                                    <MenuItem value=''>Ninguna</MenuItem>
                                                    <MenuItem value='Sura'>Sura</MenuItem>
                                                    <MenuItem value='Sanitas'>Sanitas</MenuItem>
                                                    <MenuItem value='Salud Total'>Salud Total</MenuItem>
                                                    <MenuItem value='Compensar'>Compensar</MenuItem>
                                                    <MenuItem value='Famisanar'>Famisanar</MenuItem>
                                                    <MenuItem value='Nueva EPS'>Nueva EPS</MenuItem>
                                                    <MenuItem value='Medimás'>Medimás</MenuItem>
                                                    <MenuItem value='Cafesalud'>Cafesalud</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>AFP (Fondo de Pensiones)</InputLabel>
                                        <Controller
                                            name='afp'
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label='AFP (Fondo de Pensiones)'>
                                                    <MenuItem value=''>Ninguno</MenuItem>
                                                    <MenuItem value='Porvenir'>Porvenir</MenuItem>
                                                    <MenuItem value='Protección'>Protección</MenuItem>
                                                    <MenuItem value='Colfondos'>Colfondos</MenuItem>
                                                    <MenuItem value='Old Mutual'>Old Mutual</MenuItem>
                                                    <MenuItem value='Colpensiones'>Colpensiones</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>ARL (Administradora de Riesgos Laborales)</InputLabel>
                                        <Controller
                                            name='arl'
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label='ARL (Administradora de Riesgos Laborales)'>
                                                    <MenuItem value=''>Ninguna</MenuItem>
                                                    <MenuItem value='Sura'>Sura</MenuItem>
                                                    <MenuItem value='Positiva'>Positiva</MenuItem>
                                                    <MenuItem value='Bolívar'>Bolívar</MenuItem>
                                                    <MenuItem value='Liberty'>Liberty</MenuItem>
                                                    <MenuItem value='Mapfre'>Mapfre</MenuItem>
                                                    <MenuItem value='Equidad'>Equidad</MenuItem>
                                                    <MenuItem value='AXA Colpatria'>AXA Colpatria</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Caja de Cesantías</InputLabel>
                                        <Controller
                                            name='cesantiasBox'
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label='Caja de Cesantías'>
                                                    <MenuItem value=''>Ninguna</MenuItem>
                                                    <MenuItem value='Porvenir'>Porvenir</MenuItem>
                                                    <MenuItem value='Protección'>Protección</MenuItem>
                                                    <MenuItem value='Colfondos'>Colfondos</MenuItem>
                                                    <MenuItem value='Old Mutual'>Old Mutual</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Caja de Compensación Familiar</InputLabel>
                                        <Controller
                                            name='cajaCompensacion'
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label='Caja de Compensación Familiar'>
                                                    <MenuItem value=''>Ninguna</MenuItem>
                                                    <MenuItem value='Comfama'>Comfama</MenuItem>
                                                    <MenuItem value='Cafam'>Cafam</MenuItem>
                                                    <MenuItem value='Compensar'>Compensar</MenuItem>
                                                    <MenuItem value='Comfenalco'>Comfenalco</MenuItem>
                                                    <MenuItem value='Comfandi'>Comfandi</MenuItem>
                                                    <MenuItem value='Comfenalco Valle'>Comfenalco Valle</MenuItem>
                                                    <MenuItem value='Colsubsidio'>Colsubsidio</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Beneficios y Estado */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader title='Beneficios y Estado' />
                        <CardContent>
                            <Grid container spacing={4}>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Controller
                                                name='hasTransportAllowance'
                                                control={control}
                                                render={({ field }) => (
                                                    <Switch {...field} checked={field.value} />
                                                )}
                                            />
                                        }
                                        label='Aplica Auxilio de Transporte'
                                    />
                                    <Typography variant='caption' color='text.secondary' display='block'>
                                        Para salarios hasta 2 SMMLV ($2.600.000)
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControlLabel
                                        control={
                                            <Controller
                                                name='hasFamilySubsidy'
                                                control={control}
                                                render={({ field }) => (
                                                    <Switch {...field} checked={field.value} />
                                                )}
                                            />
                                        }
                                        label='Aplica Subsidio Familiar'
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Controller
                                                name='isActive'
                                                control={control}
                                                render={({ field }) => (
                                                    <Switch {...field} checked={field.value} />
                                                )}
                                            />
                                        }
                                        label='Empleado Activo'
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Botones de Acción */}
                <Grid item xs={12}>
                    <Box display='flex' gap={4}>
                        <Button
                            variant='contained'
                            type='submit'
                            disabled={uploading}
                            startIcon={<i className='tabler-device-floppy' />}
                        >
                            {uploading ? 'Guardando...' : (isEditMode ? 'Actualizar Empleado' : 'Guardar Empleado')}
                        </Button>
                        <Button
                            variant='outlined'
                            color='secondary'
                            onClick={() => router.push('/hr/employees')}
                            startIcon={<i className='tabler-x' />}
                        >
                            Cancelar
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </form>
    )
}

export default EmployeeForm

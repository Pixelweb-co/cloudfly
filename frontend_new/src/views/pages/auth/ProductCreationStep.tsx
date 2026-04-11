import React, { useState, useEffect } from 'react'
import { Box, Typography, TextField, Button, Alert, CircularProgress, Card, CardContent, InputAdornment, Grid } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'

interface ProductCreationStepProps {
    onProductCreated: () => void
}

const ProductCreationStep = ({ onProductCreated }: ProductCreationStepProps) => {
    const [loading, setLoading] = useState(false)
    const [categoryLoading, setCategoryLoading] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Category state
    const [categoryId, setCategoryId] = useState<number | null>(null)

    // Product state
    const [productName, setProductName] = useState('Mi Primer Producto')
    const [productDescription, setProductDescription] = useState('Este es un producto de ejemplo. Puedes editar su nombre, precio y descripción.')
    const [productPrice, setProductPrice] = useState('10.00')

    // Buscar categoría "General" al cargar
    useEffect(() => {
        const fetchDefaultCategory = async () => {
            try {
                setCategoryLoading(true)
                
                // Refrescar datos del usuario desde localStorage (importante si viene del paso anterior)
                const user = userMethods.getUserLogin()
                console.log('📦 [PRODUCT-STEP] Refreshing user data:', user)

                if (!user || !user.customerId) {
                    console.warn('⚠️ [PRODUCT-STEP] No customerId found yet. User might be stale.')
                    setCategoryLoading(false)
                    return
                }

                const response = await axiosInstance.get(`/categorias/customer/${user.customerId}`)
                const categories = response.data
                
                // Buscar por nombre "General"
                const generalCategory = Array.isArray(categories) 
                    ? categories.find((c: any) => c.nombreCategoria === 'General')
                    : null

                if (generalCategory) {
                    console.log('✅ [PRODUCT-STEP] Found General category:', generalCategory.id)
                    setCategoryId(generalCategory.id)
                } else {
                    console.info('📂 [PRODUCT-STEP] General category not found, creating it...')
                    const createResponse = await axiosInstance.post('/categorias', {
                        nombreCategoria: 'General',
                        description: 'Categoría por defecto',
                        status: true
                    })
                    setCategoryId(createResponse.data.id)
                }
            } catch (error) {
                console.error('❌ [PRODUCT-STEP] Error fetching/creating default category:', error)
            } finally {
                setCategoryLoading(false)
            }
        }

        fetchDefaultCategory()
    }, [])

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!productName.trim() || !productPrice) {
            setMessage({ type: 'error', text: 'Por favor completa todos los campos obligatorios' })
            return
        }

        try {
            setLoading(true)
            setMessage(null)

            const user = userMethods.getUserLogin()

            if (!user || !user.customerId) {
                setMessage({ type: 'error', text: 'Error de sesión: No se encontró ID de cliente. Por favor refresca la página.' })
                return
            }

            await axiosInstance.post('/productos', {
                productName: productName,
                description: productDescription,
                price: parseFloat(productPrice),
                salePrice: parseFloat(productPrice),
                categoryIds: categoryId ? [categoryId] : [],
                tenantId: user.customerId,
                productType: '0', // Producto simple
                status: 'ACTIVE',
                manageStock: false,
                inventoryStatus: 'IN_STOCK'
            })

            setMessage({ type: 'success', text: '¡Excelente! Tu primer producto ha sido creado.' })

            // Llamar callback después de crear
            setTimeout(() => {
                onProductCreated()
            }, 1500)
        } catch (error: any) {
            console.error('Error creating product:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error al crear el producto'
            })
        } finally {
            setLoading(false)
        }
    }

    if (categoryLoading) {
        return (
            <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' py={10}>
                <CircularProgress size={40} />
                <Typography sx={{ mt: 2 }} color='textSecondary'>Preparando tu catálogo...</Typography>
            </Box>
        )
    }

    return (
        <Box className='max-w-2xl mx-auto'>
            <Box className='text-center mb-8'>
                <Typography variant='h4' className='mb-2 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'>
                    🚀 Casi Listos
                </Typography>
                <Typography variant='body1' color='textSecondary'>
                    Crea tu primer producto para que tu asistente IA pueda empezar a vender por ti.
                </Typography>
            </Box>

            <Card sx={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: (theme) => theme.shadows[4]
            }}>
                <CardContent className='p-8'>
                    {message && (
                        <Alert severity={message.type} sx={{ mb: 4, borderRadius: 2 }}>
                            {message.text}
                        </Alert>
                    )}

                    <form onSubmit={handleProductSubmit}>
                        <Grid container spacing={4}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label='Nombre del Producto o Servicio'
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                    placeholder='Ej: Hamburguesa Especial, Sesión de Spa, Suscripción Mensual'
                                    variant='outlined'
                                    required
                                    autoFocus
                                    InputProps={{
                                        sx: { borderRadius: 3 }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label='Descripción para la IA'
                                    value={productDescription}
                                    onChange={e => setProductDescription(e.target.value)}
                                    placeholder='Describe de qué se trata. Tu chatbot usará esto para responder a tus clientes.'
                                    variant='outlined'
                                    InputProps={{
                                        sx: { borderRadius: 3 }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type='number'
                                    label='Valor de Venta'
                                    value={productPrice}
                                    onChange={e => setProductPrice(e.target.value)}
                                    placeholder='0.00'
                                    required
                                    InputProps={{
                                        startAdornment: <InputAdornment position='start'>$</InputAdornment>,
                                        sx: { borderRadius: 3 },
                                        inputProps: { min: 0, step: '0.01' }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Box sx={{
                                    p: 2,
                                    bgcolor: 'action.hover',
                                    borderRadius: 3,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%'
                                }}>
                                    <Box>
                                        <Typography variant='caption' color='text.secondary' display='block'>
                                            📁 Categoría Automática
                                        </Typography>
                                        <Typography variant='body2' fontWeight={600}>
                                            General
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12} className='mt-4'>
                                <Button
                                    type='submit'
                                    variant='contained'
                                    size='large'
                                    fullWidth
                                    disabled={loading || !productName.trim() || !productPrice}
                                    className='final-wizard-step'
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 3,
                                        fontSize: '1.1rem',
                                        textTransform: 'none',
                                        boxShadow: (theme) => theme.shadows[8],
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: (theme) => theme.shadows[12]
                                        },
                                        transition: 'all 0.3s'
                                    }}
                                    startIcon={loading ? <CircularProgress size={20} color='inherit' /> : null}
                                >
                                    {loading ? 'Guardando...' : 'Finalizar Configuración ✨'}
                                </Button>
                                <Typography variant='caption' display='block' textAlign='center' sx={{ mt: 2 }} color='text.secondary'>
                                    ¡Al terminar, podrás acceder a tu panel de control completo!
                                </Typography>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
        </Box>
    )
}

export default ProductCreationStep

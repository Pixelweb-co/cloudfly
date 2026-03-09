'use client'

import React, { useState } from 'react'
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'

interface ProductCreationStepProps {
    onProductCreated: () => void
}

const ProductCreationStep = ({ onProductCreated }: ProductCreationStepProps) => {
    const [subStep, setSubStep] = useState(0) // 0: category, 1: product
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Category state
    const [categoryName, setCategoryName] = useState('')
    const [categoryId, setCategoryId] = useState<number | null>(null)

    // Product state
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [productPrice, setProductPrice] = useState('')

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!categoryName.trim()) {
            setMessage({ type: 'error', text: 'Por favor ingresa el nombre de la categoría' })
            return
        }

        try {
            setLoading(true)
            setMessage(null)

            const response = await axiosInstance.post('/categorias', {
                nombreCategoria: categoryName,
                description: `Categoría ${categoryName}`,
                status: true
            })

            setCategoryId(response.data.id)
            setMessage({ type: 'success', text: 'Categoría creada exitosamente' })

            // Avanzar al formulario de producto
            setTimeout(() => {
                setSubStep(1)
                setMessage(null)
            }, 800)
        } catch (error: any) {
            console.error('Error creating category:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error al crear la categoría'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!productName.trim() || !productPrice) {
            setMessage({ type: 'error', text: 'Por favor completa todos los campos obligatorios' })
            return
        }

        try {
            setLoading(true)
            setMessage(null)

            await axiosInstance.post('/productos', {
                productName: productName,
                description: productDescription,
                price: parseFloat(productPrice),
                salePrice: parseFloat(productPrice),
                categoryIds: categoryId ? [categoryId] : [],
                productType: '0', // Producto simple
                status: 'ACTIVE',
                manageStock: false,
                inventoryStatus: 'IN_STOCK'
            })

            setMessage({ type: 'success', text: 'Producto creado exitosamente' })

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

    if (subStep === 0) {
        // Step 1: Crear categoría
        return (
            <Box>
                <Typography variant='h5' className='mb-2 font-semibold text-center'>
                    📂 Crear Categoría
                </Typography>
                <Typography variant='body2' className='mb-6 text-textSecondary text-center'>
                    Primero, crea una categoría para organizar tus productos
                </Typography>

                {message && (
                    <Alert severity={message.type} sx={{ mb: 3 }}>
                        {message.text}
                    </Alert>
                )}

                <form onSubmit={handleCategorySubmit}>
                    <TextField
                        fullWidth
                        label='Nombre de la Categoría'
                        value={categoryName}
                        onChange={e => setCategoryName(e.target.value)}
                        placeholder='Ej: Servicios, Productos, Membresías'
                        helperText='Nombre de la categoría para agrupar tus productos'
                        sx={{ mb: 3 }}
                        autoFocus
                    />

                    <Button
                        type='submit'
                        variant='contained'
                        size='large'
                        fullWidth
                        disabled={loading || !categoryName.trim()}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={20} className='mr-2' />
                                Creando...
                            </>
                        ) : (
                            'Siguiente'
                        )}
                    </Button>
                </form>
            </Box>
        )
    }

    // Step 2: Crear producto
    return (
        <Box>
            <Typography variant='h5' className='mb-2 font-semibold text-center'>
                📦 Crear Primer Producto
            </Typography>
            <Typography variant='body2' className='mb-2 text-textSecondary text-center'>
                Agrega la información básica de tu producto o servicio
            </Typography>
            <Alert severity='info' sx={{ mb: 4 }}>
                💡 Podrás ampliar la información (stock, imágenes, etc.) desde el menú <strong>Ventas → Inventario</strong>
            </Alert>

            {message && (
                <Alert severity={message.type} sx={{ mb: 3 }}>
                    {message.text}
                </Alert>
            )}

            <form onSubmit={handleProductSubmit}>
                <TextField
                    fullWidth
                    label='Nombre del Producto/Servicio'
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder='Ej: Corte de cabello, Consulta médica'
                    sx={{ mb: 3 }}
                    autoFocus
                    required
                />

                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label='Descripción'
                    value={productDescription}
                    onChange={e => setProductDescription(e.target.value)}
                    placeholder='Describe brevemente tu producto o servicio'
                    sx={{ mb: 3 }}
                />

                <TextField
                    fullWidth
                    type='number'
                    label='Valor de Venta'
                    value={productPrice}
                    onChange={e => setProductPrice(e.target.value)}
                    placeholder='0.00'
                    helperText='Precio de venta al público'
                    sx={{ mb: 3 }}
                    required
                    inputProps={{ min: 0, step: '0.01' }}
                />

                <Box className='flex gap-2'>
                    <Button
                        variant='outlined'
                        onClick={() => setSubStep(0)}
                        disabled={loading}
                    >
                        Atrás
                    </Button>
                    <Button
                        type='submit'
                        variant='contained'
                        size='large'
                        fullWidth
                        disabled={loading || !productName.trim() || !productPrice}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={20} className='mr-2' />
                                Creando...
                            </>
                        ) : (
                            'Finalizar'
                        )}
                    </Button>
                </Box>
            </form>
        </Box>
    )
}

export default ProductCreationStep

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel
} from '@mui/material'
import { Icon } from '@iconify/react'
import { productService } from '@/services/ventas/productService'
import { categoryService } from '@/services/ventas/categoryService'
import { Category } from '@/types/ventas/productTypes'
import { userMethods } from '@/utils/userMethods'

export default function CreateProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: 0,
    salePrice: 0,
    sku: '',
    barcode: '',
    inventoryQty: 0,
    manageStock: true,
    status: 'PUBLISHED',
    categoryIds: [] as number[],
    imageUrls: ['']
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const cats = await categoryService.getAllCategories()
      setCategories(cats || [])
    } catch (e) {
      console.error('Error al cargar categorías:', e)
    }
  }

  const handleChange = (e: any) => {
    const { name, value, checked, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const user = userMethods.getUserLogin()
      const tenantId = user?.customerId || user?.tenant_id
      
      const payload = {
        ...formData,
        tenantId: Number(tenantId),
        price: Number(formData.price),
        salePrice: Number(formData.salePrice),
        inventoryQty: Number(formData.inventoryQty)
      }
      
      await productService.saveProduct(payload)
      router.push('/ventas/productos/list')
    } catch (e) {
      console.error('Error al guardar producto:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => router.back()}
          startIcon={<Icon icon="tabler:arrow-left" />}
          sx={{ borderRadius: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Nuevo Producto</Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 4 }}>Información General</Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nombre del Producto"
                      name="productName"
                      value={formData.productName}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Descripción"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 6 }} />
                
                <Typography variant="h6" sx={{ mb: 4 }}>Precios e Inventario</Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Precio Base"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Precio de Oferta"
                      name="salePrice"
                      value={formData.salePrice}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SKU"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Código de Barras"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad Inicial"
                      name="inventoryQty"
                      value={formData.inventoryQty}
                      onChange={handleChange}
                      disabled={!formData.manageStock}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="manageStock"
                          checked={formData.manageStock}
                          onChange={handleChange}
                        />
                      }
                      label="Gestionar Stock"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 6 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 4 }}>Organización</Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        multiple
                        name="categoryIds"
                        value={formData.categoryIds}
                        onChange={handleChange}
                        label="Categoría"
                      >
                        {categories.map(cat => (
                          <MenuItem key={cat.id} value={cat.id}>{cat.categoryName}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Estado</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        label="Estado"
                      >
                        <MenuItem value="PUBLISHED">Publicado</MenuItem>
                        <MenuItem value="DRAFT">Borrador</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 3 }}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                size="large"
                loading={loading}
                sx={{ borderRadius: 2 }}
              >
                Guardar Producto
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() => router.push('/ventas/productos/list')}
                sx={{ borderRadius: 2 }}
              >
                Cancelar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}

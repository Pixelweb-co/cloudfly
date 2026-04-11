'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material'
import { Icon } from '@iconify/react'
import { productService } from '@/services/ventas/productService'
import { categoryService } from '@/services/ventas/categoryService'
import { Category } from '@/types/ventas/productTypes'
import { userMethods } from '@/utils/userMethods'
import MediaLibraryDialog from '@/components/media/MediaLibraryDialog'
import { Media } from '@/services/mediaService'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    id: 0,
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
    imageUrls: [] as string[]
  })
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [id])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [product, cats] = await Promise.all([
        productService.getProductById(Number(id)),
        categoryService.getAllCategories()
      ])
      
      setCategories(cats || [])
      if (product) {
        setFormData({
          id: product.id || Number(id),
          productName: product.productName || '',
          description: product.description || '',
          price: Number(product.price) || 0,
          salePrice: Number(product.salePrice) || 0,
          sku: product.sku || '',
          barcode: product.barcode || '',
          inventoryQty: product.inventoryQty || 0,
          manageStock: product.manageStock ?? true,
          status: product.status || 'PUBLISHED',
          categoryIds: (product as any).categoryIds || [],
          imageUrls: product.imageUrls || []
        })
      }
    } catch (e) {
      console.error('Error al cargar datos:', e)
    } finally {
      setLoading(false)
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
      setSaving(true)
      const user = userMethods.getUserLogin()
      const tenantId = user?.customerId || user?.tenant_id
      
      const payload = {
        ...formData,
        tenantId: Number(tenantId),
        price: Number(formData.price),
        salePrice: Number(formData.salePrice),
        inventoryQty: Number(formData.inventoryQty)
      }
      
      await productService.updateProduct(payload as any)
      router.push('/ventas/productos/list')
    } catch (e) {
      console.error('Error al actualizar producto:', e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/ventas/productos/list')}
          startIcon={<Icon icon="tabler:arrow-left" />}
          sx={{ borderRadius: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Editar Producto</Typography>
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
                <Typography variant="h6" sx={{ mb: 4 }}>Imagen del Producto</Typography>
                <Box 
                  sx={{ 
                    border: '1px dashed', 
                    borderColor: 'divider', 
                    borderRadius: 2, 
                    p: 4, 
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => setMediaDialogOpen(true)}
                >
                  {formData.imageUrls && formData.imageUrls.length > 0 ? (
                    <Box sx={{ position: 'relative' }}>
                      <img 
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${formData.imageUrls[0]}`} 
                        alt="Preview" 
                        style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} 
                      />
                      <Button 
                        size="small" 
                        variant="contained" 
                        sx={{ mt: 2 }}
                        startIcon={<Icon icon="tabler:photo" />}
                      >
                        Cambiar Imagen
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ py: 4 }}>
                      <Icon icon="tabler:plus" fontSize={32} />
                      <Typography sx={{ mt: 2 }}>Click para seleccionar imagen</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 6 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h6">Categorías</Typography>
                </Box>
                <Box sx={{ maxHeight: 250, overflow: 'auto', mb: 2 }}>
                  {categories.map(cat => (
                    <Box key={cat.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={formData.categoryIds.includes(cat.id)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setFormData(prev => ({
                                ...prev,
                                categoryIds: checked 
                                  ? [...prev.categoryIds, cat.id]
                                  : prev.categoryIds.filter(id => id !== cat.id)
                              }))
                            }}
                          />
                        }
                        label={cat.categoryName}
                      />
                    </Box>
                  ))}
                </Box>
                
                {addingCategory ? (
                  <Box sx={{ display: 'flex', gap: 2, mt: 4, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Nueva categoría..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      disabled={creatingCategory}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={async () => {
                        if (!newCategoryName.trim()) return
                        try {
                          setCreatingCategory(true)
                          const newCat = await categoryService.createCategory({
                            nombreCategoria: newCategoryName
                          })
                          if (newCat) {
                            setCategories(prev => [...prev, newCat])
                            setFormData(prev => ({
                                ...prev,
                                categoryIds: [...prev.categoryIds, newCat.id]
                            }))
                            setNewCategoryName('')
                            setAddingCategory(false)
                          }
                        } catch (err) {
                          console.error("Error creating category:", err)
                        } finally {
                          setCreatingCategory(false)
                        }
                      }}
                      disabled={creatingCategory}
                    >
                      {creatingCategory ? <CircularProgress size={20} color="inherit" /> : <Icon icon="tabler:device-floppy" fontSize={20} />}
                    </Button>
                    <Button 
                      variant="text" 
                      color="secondary" 
                      size="small" 
                      onClick={() => setAddingCategory(false)}
                      disabled={creatingCategory}
                    >
                      <Icon icon="tabler:x" fontSize={20} />
                    </Button>
                  </Box>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<Icon icon="tabler:plus" />}
                    onClick={() => setAddingCategory(true)}
                    sx={{ mt: 2 }}
                  >
                    Agregar Categoría
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, boxShadow: 3, mb: 6 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 4 }}>Organización</Typography>
                <Grid container spacing={4}>
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
                loading={saving}
                sx={{ borderRadius: 2 }}
              >
                Actualizar Producto
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

      <MediaLibraryDialog 
        open={mediaDialogOpen}
        onClose={() => setMediaDialogOpen(false)}
        onSelect={(media: Media) => {
          setFormData(prev => ({
            ...prev,
            imageUrls: [media.url]
          }))
        }}
      />
    </Box>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  Avatar,
  Tooltip
} from '@mui/material'
import { Icon } from '@iconify/react'
import { productService } from '@/services/ventas/productService'
import { Product } from '@/types/ventas/productTypes'
import { userMethods } from '@/utils/userMethods'

export default function ProductsListTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const user = userMethods.getUserLogin()
      const isManager = user?.roles?.some((r: any) => (r.name || r.role || '').includes('MANAGER'))
      const isAdmin = user?.roles?.some((r: any) => (r.name || r.role || '').includes('ADMIN'))
      
      const tenantId = (isManager || isAdmin) ? (user?.customerId || user?.tenant_id) : undefined
      const companyId = (isManager || isAdmin) ? (user?.activeCompanyId || user?.company_id) : undefined
      
      const productsData = await productService.getAllProducts(tenantId, companyId)
      setProducts(productsData || [])
    } catch (e) {
      console.error('Error al cargar productos:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    router.push(`/ventas/productos/${product.id}`)
  }

  const handleAdd = () => {
    router.push(`/ventas/productos/new`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro de eliminar este producto?')) return
    try {
      await productService.deleteProduct(id)
      await loadData()
    } catch (e) {
      console.error('Error al eliminar producto:', e)
    }
  }

  return (
    <Card>
      <Box sx={{ p: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Catálogo de Productos</Typography>
        <Button 
          variant="contained" 
          onClick={handleAdd} 
          startIcon={<Icon icon="tabler:plus" />}
          sx={{ borderRadius: 2, boxShadow: 3 }}
          color="primary"
        >
          Nuevo Producto
        </Button>
      </Box>
      
      {loading && <LinearProgress color="primary" />}
      
      <TableContainer>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ '& th': { borderBottom: '2px solid rgba(0, 0, 0, 0.12)' } }}>
              <TableCell>Producto</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay productos en tu catálogo aún.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} hover onClick={() => handleEdit(product)} sx={{ transition: 'all 0.2s', '&:hover': { backgroundColor: 'action.hover' }, cursor: 'pointer' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar 
                        src={product.imageUrls?.[0] || ''} 
                        variant="rounded"
                        sx={{ width: 48, height: 48, bgcolor: 'divider', boxShadow: 1 }}
                      >
                        <Icon icon="tabler:box" fontSize={24} />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {product.productName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SKU: {product.sku || 'N/A'} | Marca: {product.brand || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {product.productType || 'General'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ${Number(product.price).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {product.manageStock ? product.inventoryQty : '∞'}
                      </Typography>
                      {product.manageStock && product.inventoryQty !== undefined && product.inventoryQty < 5 && (
                        <Icon icon="tabler:alert-triangle" color="orange" width={16} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={product.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'} 
                      color={product.status === 'PUBLISHED' ? 'success' : 'secondary'} 
                      size="small" 
                      variant="filled"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleEdit(product)} color="info" sx={{ mr: 1, backgroundColor: 'action.hover' }}>
                        <Icon icon="tabler:edit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(product.id)} color="error" sx={{ backgroundColor: 'action.hover' }}>
                        <Icon icon="tabler:trash" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

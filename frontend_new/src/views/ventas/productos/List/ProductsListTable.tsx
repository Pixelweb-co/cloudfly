'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardHeader,
  Divider,
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
  Tooltip,
  TablePagination
} from '@mui/material'
import { Icon } from '@iconify/react'
import { productService } from '@/services/ventas/productService'
import { Product } from '@/types/ventas/productTypes'
import { userMethods } from '@/utils/userMethods'
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog'
import toast from 'react-hot-toast'
import ProductTableFilters from './ProductTableFilters'

export default function ProductsListTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)

  // Estados para filtros, ordenamiento y paginación
  const [filters, setFilters] = useState({
    status: '',
    categoryId: '',
    nameSearch: '',
    skuSearch: ''
  })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<string>('productName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

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

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(0) // Reiniciar a la primera página al cambiar filtros
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Filtrado reactivo en memoria
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filtro por Estado
      const matchStatus = filters.status ? product.status === filters.status : true

      // Filtro por Categoría (id numérico o coincidencia de nombre)
      const matchCategory = filters.categoryId
        ? product.categoryIds?.includes(parseInt(filters.categoryId)) ||
          product.categoryNames?.some(c => c.toLowerCase() === filters.categoryId.toLowerCase())
        : true

      // Buscador Nombre (Type-ahead debounced)
      const matchName = filters.nameSearch
        ? product.productName?.toLowerCase().includes(filters.nameSearch.toLowerCase())
        : true

      // Buscador SKU (Type-ahead debounced)
      const matchSku = filters.skuSearch
        ? product.sku?.toLowerCase().includes(filters.skuSearch.toLowerCase())
        : true

      return matchStatus && matchCategory && matchName && matchSku
    })
  }, [products, filters])

  // Ordenamiento reactivo en memoria
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts]
    sorted.sort((a, b) => {
      let valA: any = a[sortBy as keyof Product]
      let valB: any = b[sortBy as keyof Product]

      if (sortBy === 'price') {
        valA = Number(a.price || 0)
        valB = Number(b.price || 0)
      } else if (sortBy === 'inventoryQty') {
        valA = a.manageStock ? (a.inventoryQty || 0) : -1
        valB = b.manageStock ? (b.inventoryQty || 0) : -1
      } else {
        valA = String(valA || '').toLowerCase()
        valB = String(valB || '').toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredProducts, sortBy, sortOrder])

  // Paginación reactiva en memoria
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage
    return sortedProducts.slice(startIndex, startIndex + rowsPerPage)
  }, [sortedProducts, page, rowsPerPage])

  const handleEdit = (product: Product) => {
    router.push(`/ventas/productos/${product.id}`)
  }

  const handleAdd = () => {
    router.push(`/ventas/productos/new`)
  }

  const handleDeleteClick = (id: number) => {
    setProductToDelete(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return
    try {
      await productService.deleteProduct(productToDelete)
      toast.success('Producto eliminado')
      setConfirmOpen(false)
      setProductToDelete(null)
      await loadData()
    } catch (e) {
      console.error('Error al eliminar producto:', e)
      toast.error('Error al eliminar producto')
    }
  }

  return (
    <Card>
      {/* Sección de Filtros Avanzados */}
      <CardHeader title="Filtros Avanzados" sx={{ pb: 2 }} />
      <ProductTableFilters onFiltersChange={handleFiltersChange} />
      
      <Divider />

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
            <TableRow sx={{ '& th': { borderBottom: '2px solid rgba(0, 0, 0, 0.12)', cursor: 'pointer', userSelect: 'none' } }}>
              <TableCell onClick={() => handleSort('productName')}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Producto
                  {sortBy === 'productName' && (
                    <Icon icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('productType')}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Tipo
                  {sortBy === 'productType' && (
                    <Icon icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('price')}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Precio
                  {sortBy === 'price' && (
                    <Icon icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('inventoryQty')}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Stock
                  {sortBy === 'inventoryQty' && (
                    <Icon icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'} />
                  )}
                </Box>
              </TableCell>
              <TableCell onClick={() => handleSort('status')}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Estado
                  {sortBy === 'status' && (
                    <Icon icon={sortOrder === 'asc' ? 'tabler:chevron-up' : 'tabler:chevron-down'} />
                  )}
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ cursor: 'default' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">
                    No se encontraron productos con los filtros seleccionados.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
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
                    <Chip 
                      label={product.productType === 'SERVICE' ? 'Servicio' : 'Producto'} 
                      color={product.productType === 'SERVICE' ? 'info' : 'primary'} 
                      size="small"
                      variant="outlined"
                      icon={<Icon icon={product.productType === 'SERVICE' ? 'tabler:calendar' : 'tabler:package'} />}
                    />
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
                      <IconButton onClick={(e) => { e.stopPropagation(); handleDeleteClick(product.id); }} color="error" sx={{ backgroundColor: 'action.hover' }}>
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

      {/* Indicadores y controles de Paginación */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={filteredProducts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10))
          setPage(0)
        }}
        labelRowsPerPage="Filas por página"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

      <ConfirmationDialog 
        open={confirmOpen}
        setOpen={setConfirmOpen}
        entitYName="Eliminar Producto"
        name="confirm"
        onConfirmation={handleConfirmDelete}
      />
    </Card>
  )
}

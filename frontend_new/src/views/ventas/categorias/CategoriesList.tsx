'use client'

import React, { useState, useEffect } from 'react'
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
  Tooltip,
  TablePagination
} from '@mui/material'
import { Icon } from '@iconify/react'
import { categoryService } from '@/services/ventas/categoryService'
import { CategoryType as Category } from '@/types/apps/categoryType'
import { userMethods } from '@/utils/userMethods'
import CategoryFormDialog from './CategoryFormDialog'
import toast from 'react-hot-toast'

export default function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  
  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await categoryService.getAllCategories()
      setCategories(data || [])
    } catch (e) {
      console.error('Error al cargar categorías:', e)
      toast.error('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedCategory(null)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro de eliminar esta categoría?')) return
    try {
      await categoryService.deleteCategory(id)
      toast.success('Categoría eliminada')
      await loadData()
    } catch (e) {
      console.error('Error al eliminar categoría:', e)
      toast.error('Error al eliminar categoría')
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await categoryService.toggleCategoryStatus(id)
      toast.success('Estado actualizado')
      await loadData()
    } catch (e) {
      console.error('Error al cambiar estado:', e)
      toast.error('Error al actualizar estado')
    }
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ p: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Gestión de Categorías
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organiza tus productos por grupos lógicos
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={handleAdd} 
          startIcon={<Icon icon="tabler:plus" />}
          sx={{ borderRadius: 2, px: 4 }}
        >
          Nueva Categoría
        </Button>
      </Box>
      
      {loading && <LinearProgress color="primary" />}
      
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((category) => (
              <TableRow key={category.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Icon icon="tabler:category" fontSize={20} color="gray" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {category.nombreCategoria}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ 
                    maxWidth: 300, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {category.description || 'Sin descripción'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={category.status ? 'Activo' : 'Inactivo'} 
                    color={category.status ? 'success' : 'secondary'} 
                    size="small" 
                    variant="tonal"
                    onClick={() => category.id && handleToggleStatus(category.id)}
                    sx={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton onClick={() => handleEdit(category)} size="small" color="info">
                      <Icon icon="tabler:edit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton onClick={() => category.id && handleDelete(category.id)} size="small" color="error">
                      <Icon icon="tabler:trash" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!loading && categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">No hay categorías configuradas.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={categories.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página"
      />

      <CategoryFormDialog 
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        category={selectedCategory}
        onSaved={loadData}
      />
    </Card>
  )
}

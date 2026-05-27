'use client'

import { useState, useEffect } from 'react'
import { CardContent, Grid, MenuItem } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { categoryService } from '@/services/ventas/categoryService'
import { Category } from '@/types/ventas/productTypes'

interface ProductTableFiltersProps {
  onFiltersChange: (filters: {
    status: string
    categoryId: string
    nameSearch: string
    skuSearch: string
  }) => void
}

const ProductTableFilters = ({ onFiltersChange }: ProductTableFiltersProps) => {
  // Estados de filtros
  const [status, setStatus] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [nameSearch, setNameSearch] = useState<string>('')
  const [skuSearch, setSkuSearch] = useState<string>('')

  // Estado para la búsqueda type-ahead (debounced)
  const [debouncedName, setDebouncedName] = useState<string>('')
  const [debouncedSku, setDebouncedSku] = useState<string>('')

  // Lista de categorías cargada del backend
  const [categories, setCategories] = useState<Category[]>([])

  // Carga inicial de categorías
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getAllCategories()
        setCategories(data || [])
      } catch (err) {
        console.error('Error al cargar categorías para filtros:', err)
      }
    }
    loadCategories()
  }, [])

  // Efecto para debounce de búsqueda por Nombre (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(nameSearch)
    }, 300)

    return () => clearTimeout(handler)
  }, [nameSearch])

  // Efecto para debounce de búsqueda por SKU (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSku(skuSearch)
    }, 300)

    return () => clearTimeout(handler)
  }, [skuSearch])

  // Propagar cambios a la tabla de productos al actualizar cualquier filtro
  useEffect(() => {
    onFiltersChange({
      status,
      categoryId,
      nameSearch: debouncedName,
      skuSearch: debouncedSku
    })
  }, [status, categoryId, debouncedName, debouncedSku, onFiltersChange])

  return (
    <CardContent>
      <Grid container spacing={6}>
        {/* Buscador de Nombre (Type-ahead) */}
        <Grid item xs={12} sm={3}>
          <CustomTextField
            fullWidth
            placeholder="Buscar por nombre..."
            label="Buscador Nombre"
            value={nameSearch}
            onChange={e => setNameSearch(e.target.value)}
          />
        </Grid>

        {/* Buscador de SKU (Type-ahead) */}
        <Grid item xs={12} sm={3}>
          <CustomTextField
            fullWidth
            placeholder="Buscar por SKU..."
            label="Buscar por SKU"
            value={skuSearch}
            onChange={e => setSkuSearch(e.target.value)}
          />
        </Grid>

        {/* Filtro por Estado */}
        <Grid item xs={12} sm={3}>
          <CustomTextField
            select
            fullWidth
            label="Estado"
            value={status}
            onChange={e => setStatus(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">Todos los estados</MenuItem>
            <MenuItem value="PUBLISHED">Publicado</MenuItem>
            <MenuItem value="DRAFT">Borrador</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Filtro por Categoría */}
        <Grid item xs={12} sm={3}>
          <CustomTextField
            select
            fullWidth
            label="Categoría"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">Todas las categorías</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id.toString()}>
                {cat.nombreCategoria}
              </MenuItem>
            ))}
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default ProductTableFilters

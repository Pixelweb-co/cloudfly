'use client'

import React, { SyntheticEvent, useEffect, useState } from 'react'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import type { Editor } from '@tiptap/react'
import CustomIconButton from '@core/components/mui/IconButton'

import Image from 'next/image'
import axios from 'axios'

import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Checkbox,
  Tab,
  IconButton,
  MenuItem,
  Divider,
  FormControlLabel,
  FormControl,
  RadioGroup,
  Radio,
  ListItemButton,
  List,
  ListItem,
  ListItemText,
  Link,
  InputBase,
  Paper
} from '@mui/material'

import { axiosInstance } from '@/utils/axiosInstance'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import CustomTextField from '@/@core/components/mui/TextField'
import { userMethods } from '@/utils/userMethods'
import { CancelOutlined, SaveOutlined } from '@mui/icons-material'
import MediaModal from '@/components/dialogs/form-media'

/* -------------------------------------------------------------------------- */
/*                            Editor (igual que antes)                        */
/* -------------------------------------------------------------------------- */

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const editorState = useEditorState({
    editor,
    selector: ctx => {
      if (!ctx.editor) {
        return {
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isStrike: false,
          isLeftAligned: true,
          isCenterAligned: false,
          isRightAligned: false,
          isJustified: false
        }
      }

      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        isUnderline: ctx.editor.isActive('underline') ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        isLeftAligned: ctx.editor.isActive({ textAlign: 'left' }) ?? false,
        isCenterAligned: ctx.editor.isActive({ textAlign: 'center' }) ?? false,
        isRightAligned: ctx.editor.isActive({ textAlign: 'right' }) ?? false,
        isJustified: ctx.editor.isActive({ textAlign: 'justify' }) ?? false
      }
    }
  })

  if (!editor || !editorState) {
    return null
  }

  return (
    <div className='flex flex-wrap gap-x-3 gap-y-1 p-6'>
      <CustomIconButton
        {...(editorState.isBold && { color: 'primary' })}
        variant='outlined'
        size='small'
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <i className='tabler-bold' />
      </CustomIconButton>
      <CustomIconButton
        {...(editorState.isUnderline && { color: 'primary' })}
        variant='outlined'
        size='small'
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <i className='tabler-underline' />
      </CustomIconButton>
      <CustomIconButton
        {...(editorState.isItalic && { color: 'primary' })}
        variant='outlined'
        size='small'
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <i className='tabler-italic' />
      </CustomIconButton>
      <CustomIconButton
        {...(editorState.isStrike && { color: 'primary' })}
        variant='outlined'
        size='small'
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <i className='tabler-strikethrough' />
      </CustomIconButton>
      <CustomIconButton
        {...(editorState.isLeftAligned && { color: 'primary' })}
        variant='outlined'
        size='small'
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <i className='tabler-align-left' />
      </CustomIconButton>
      <CustomIconButton
        {...(editorState.isCenterAligned && { color: 'primary' })}
        variant='outlined'
        size='small'
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <i className='tabler-align-center' />
      </CustomIconButton>
      <CustomIconButton
        {...(editorState.isRightAligned && { color: 'primary' })}
        variant='outlined'
        size='small'
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <i className='tabler-align-right' />
      </CustomIconButton>
      <CustomIconButton
        {...(editorState.isJustified && { color: 'primary' })}
        variant='outlined'
        size='small'
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        <i className='tabler-align-justified' />
      </CustomIconButton>
    </div>
  )
}

const EditorBasic = ({ content, onChange }: { content?: string; onChange?: (content: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Escribe algo aquí...'
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Underline
    ],
    immediatelyRender: false,
    content:
      content ??
      `
      <p>.</p>
    `,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    }
  })

  return (
    <div className='border rounded-md'>
      <EditorToolbar editor={editor} />
      <Divider />
      <EditorContent editor={editor} className='bs-[200px] overflow-y-auto flex' />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Estado inicial de producto                      */
/* -------------------------------------------------------------------------- */

const initialProduct: any = {
  id: null,
  productName: '',
  description: '',
  productType: '0', // tipo de producto
  price: '',
  salePrice: '',
  sku: '',
  barcode: '',
  manageStock: false, // seg_cant_inv
  inventoryStatus: 'IN_STOCK', // Hay existencias / Agotado / Se puede reservar
  allowBackorders: 'NO', // NO | ALLOW | ALLOW_NOTIFY
  inventoryQty: '',
  soldIndividually: false,
  weight: '',
  dimensions: '',
  upsellProducts: '',
  crossSellProducts: '',
  status: 'ACTIVE', // Activo / Inactivo
  brand: '',
  model: '',
  // estos se llenan al guardar
  categoryIds: [] as number[],
  imageIds: [] as number[]
}

/* -------------------------------------------------------------------------- */
/*                              Componente principal                          */
/* -------------------------------------------------------------------------- */

const ProductViewLayout = () => {
  const [formTemplate, setFormTemplate] = useState<any[]>([])
  const [value, setValue] = useState<string>('1')
  const [seletedImage, setSeletedImage] = useState<any>(null)
  const [checked, setChecked] = useState<number[]>([0])
  const [showCategoryForm, setShowCategoryForm] = useState<boolean>(false)
  const [categoriesList, setCategoriesList] = useState<any[]>([])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [productImages, setProductImages] = useState<any[]>([])
  const [product, setProduct] = useState<any | null>(null)

  const [categoryNewName, setCategoryNewName] = useState<string>('')
  const [showMedia, setShowMedia] = useState<boolean>(false)

  // 🔴 errores de validación
  const [formErrors, setFormErrors] = useState<{ name?: string; price?: string }>({})

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  /* ------------------------------ Guardar categoría ------------------------------ */

  const saveCategory = async () => {
    try {
      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }
      const user = userMethods.getUserLogin()
      const id_customer = user.customer.id
      const newCategory = {
        nombreCategoria: categoryNewName,
        tenantId: id_customer,
        status: 'true',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parentCategory: '0',
        description: ''
      }
      const response = await axios.post(`${API_BASE_URL}/categorias`, newCategory, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log('Categoría guardada:', response.data)
      setCategoriesList([...categoriesList, response.data])
      setSelectedCategories([...selectedCategories, response.data.id])
      setCategoryNewName('')
      setShowCategoryForm(false)
    } catch (error) {
      console.error('Error al guardar la categoría:', error)
    }
  }

  /* ------------------------------ Guardar producto ------------------------------ */

  const saveProduct = async () => {
    try {
      const token = localStorage.getItem('AuthToken')
      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      if (!product) return

      // 🔴 VALIDACIÓN local
      const errors: { name?: string; price?: string } = {}

      if (!product.productName || !product.productName.trim()) {
        errors.name = 'El nombre del producto es obligatorio'
      }

      if (
        product.price === '' ||
        product.price === null ||
        product.price === undefined ||
        isNaN(Number(product.price)) ||
        Number(product.price) <= 0
      ) {
        errors.price = 'El precio es obligatorio y debe ser mayor que 0'
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        // nos aseguramos de que esté en la pestaña "General" donde está el precio
        setValue('1')
        return
      } else {
        setFormErrors({})
      }

      const payload = {
        ...product,
        tenantId: userMethods.getUserLogin().customer.id,
        productType: product.productType,
        price: product.price,
        salePrice: product.salePrice,
        sku: product.sku,
        barcode: product.barcode,
        manageStock: product.manageStock,
        inventoryStatus: product.inventoryStatus,
        allowBackorders: product.allowBackorders,
        inventoryQty: product.inventoryQty,
        soldIndividually: product.soldIndividually,
        weight: product.weight,
        dimensions: product.dimensions,
        upsellProducts: product.upsellProducts,
        crossSellProducts: product.crossSellProducts,
        status: product.status,
        categoryIds: selectedCategories,
        imageIds: productImages.map(img => img.id) // id de la tabla media
      }

      console.log('Payload a enviar:', payload)

      const response = await axiosInstance.post('/productos', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log('Producto guardado:', response.data)
      // aquí puedes redirigir o mostrar un toast
    } catch (error) {
      console.error('Error al guardar el producto:', error)
    }
  }

  /* ------------------------------ Cargar categorías ------------------------------ */

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      const user = userMethods.getUserLogin()
      const id_customer = user.customer.id

      const [categoriesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/categorias/customer/${id_customer}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ])

      console.log('categoriesRes:', categoriesRes.data)
      setCategoriesList(categoriesRes.data)

      return true
    } catch (error) {
      console.error('Error al obtener datos:', error)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  /* ------------------------------ Imagen seleccionada ------------------------------ */

  useEffect(() => {
    setSeletedImage(productImages.length > 0 ? productImages[0] : null)
  }, [productImages])

  useEffect(() => {
    console.log('form templates', formTemplate)
  }, [formTemplate])

  /* ------------------------------ Cargar product de localStorage ------------------------------ */

  useEffect(() => {
    const storedData = localStorage.getItem('productview')
    const productData = storedData ? JSON.parse(storedData) : null

    if (productData) {
      console.log('productData', productData)
      // mezclamos con el estado inicial para asegurar que existan las props
      const merged = {
        ...initialProduct,
        ...productData
      }
      setProduct(merged)
    }

    const getTemplates = async (item: any) => {
      if (!item) return

      try {
        const response = await axiosInstance.get(
          `/plantillas?marca=${item.brand}&modelo=${item.model}&tipoElement=${item.productType}`
        )

        const templates = response.data.map((t: any) => ({ nom: t.nom, tipo: '1' }))

        console.log('plantillas v :', templates)

        setFormTemplate(templates)
      } catch (error) {
        console.error('Error al obtener los datos:', error)
      }
    }

    getTemplates(productData)
  }, [])

  if (!product) {
    return <Typography>Cargando datos del producto...</Typography>
  }

  /* ------------------------------ Handlers UI ------------------------------ */

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  const handleToggle = (value: number) => () => {
    const currentIndex = checked.indexOf(value)
    const newChecked = [...checked]

    if (currentIndex === -1) {
      newChecked.push(value)
    } else {
      newChecked.splice(currentIndex, 1)
    }

    setChecked(newChecked)
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <Grid container spacing={2}>
      {/* ------------------------------------------------------------------ */}
      {/*                              Columna izq                           */}
      {/* ------------------------------------------------------------------ */}
      <Grid item xs={12} md={9}>
        {/* Nombre */}
        <Card sx={{ marginBottom: 5 }}>
          <CardHeader className='pbe-4' />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <CustomTextField
                  sx={{ marginBottom: 5 }}
                  fullWidth
                  value={product.productName}
                  onChange={e => {
                    setProduct({ ...product, productName: e.target.value })
                    setFormErrors(prev => ({ ...prev, name: undefined })) // limpiar error
                  }}
                  label='Nombre del producto'
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Descripción */}
        <Card sx={{ marginBottom: 5 }}>
          <CardHeader title='Descripcion del Producto' className='pbe-4' />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <EditorBasic
                  content={product.description}
                  onChange={content => setProduct({ ...product, description: content })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Detalles + tabs */}
        <Card sx={{ marginBottom: 5 }}>
          <CardHeader
            title='Detalles del Producto --'
            className='pbe-4'
            action={
              <div className='flex flex-row w-full'>
                <Typography variant='subtitle2' color='text.secondary'>
                  Tipo de Producto
                </Typography>

                <CustomTextField
                  className='mt-2'
                  placeholder='Tipo de producto'
                  select
                  fullWidth
                  value={product.productType}
                  onChange={e => {
                    setProduct({ ...product, productType: e.target.value })
                  }}
                >
                  <MenuItem value='0'>Producto simple</MenuItem>
                  <MenuItem value='1'>Producto agrupado</MenuItem>
                  <MenuItem value='2'>Producto con variantes</MenuItem>
                  <MenuItem value='3'>Servicio</MenuItem>
                  <MenuItem value='4'>Producto Suscripcion / Alquiler</MenuItem>
                  <MenuItem value='5'>Servicio Suscripcion / Alquiler</MenuItem>
                </CustomTextField>
              </div>
            }
          />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <TabContext value={value}>
                  <div className='flex'>
                    <TabList orientation='vertical' onChange={handleChange}>
                      <Tab value='1' label='General' />
                      <Tab value='2' label='Inventario' />
                      <Tab value='3' label='Envio' />
                      <Tab value='4' label='Relacionados' />
                    </TabList>

                    {/* -------------------- General -------------------- */}
                    <TabPanel value='1'>
                      <CustomTextField
                        sx={{ marginBottom: 5 }}
                        fullWidth
                        value={product.price}
                        onChange={e => {
                          setProduct({ ...product, price: e.target.value })
                          setFormErrors(prev => ({ ...prev, price: undefined })) // limpiar error
                        }}
                        label='Precio de Venta ($)'
                        error={!!formErrors.price}
                        helperText={formErrors.price}
                      />

                      <CustomTextField
                        fullWidth
                        sx={{ marginBottom: 5 }}
                        value={product.salePrice}
                        onChange={e => setProduct({ ...product, salePrice: e.target.value })}
                        label='Precio de Venta rebajado ($)'
                      />
                    </TabPanel>

                    {/* -------------------- Inventario -------------------- */}
                    <TabPanel value='2'>
                      <CustomTextField
                        sx={{ marginBottom: 5 }}
                        fullWidth
                        value={product.sku}
                        onChange={e => {
                          setProduct({ ...product, sku: e.target.value })
                        }}
                        label='SKU'
                      />
                      <CustomTextField
                        sx={{ marginBottom: 5 }}
                        fullWidth
                        value={product.barcode}
                        onChange={e => {
                          setProduct({ ...product, barcode: e.target.value })
                        }}
                        label='GTIN, UPC, EAN o ISBN'
                      />

                      <FormControlLabel
                        label='Hacer seguimiento de la cantidad de inventario de este producto'
                        control={
                          <Checkbox
                            name='manageStock'
                            color='success'
                            checked={product.manageStock}
                            onChange={e =>
                              setProduct({
                                ...product,
                                manageStock: e.target.checked
                              })
                            }
                          />
                        }
                      />

                      {!product.manageStock && (
                        <div className='mt-4'>
                          <Typography variant='subtitle2' className='mb-2'>
                            Estado del inventario
                          </Typography>

                          <FormControl className='flex-wrap flex-row'>
                            <RadioGroup
                              row
                              value={product.inventoryStatus}
                              onChange={e =>
                                setProduct({ ...product, inventoryStatus: e.target.value })
                              }
                            >
                              <FormControlLabel
                                value='IN_STOCK'
                                control={<Radio />}
                                label='Hay existencias'
                              />
                              <FormControlLabel
                                value='OUT_OF_STOCK'
                                control={<Radio />}
                                label='Agotado'
                              />
                              <FormControlLabel
                                value='ON_BACKORDER'
                                control={<Radio />}
                                label='Se puede reservar'
                              />
                            </RadioGroup>
                          </FormControl>
                        </div>
                      )}

                      {product.manageStock && (
                        <div className='mt-4'>
                          <Typography variant='subtitle2' className='mb-2'>
                            ¿Permitir reservas?
                          </Typography>

                          <FormControl className='flex-wrap flex-row'>
                            <RadioGroup
                              row
                              value={product.allowBackorders}
                              onChange={e =>
                                setProduct({ ...product, allowBackorders: e.target.value })
                              }
                            >
                              <FormControlLabel
                                value='ALLOW'
                                control={<Radio />}
                                label='Permitir'
                              />
                              <FormControlLabel
                                value='ALLOW_NOTIFY'
                                control={<Radio />}
                                label='Permitir, pero se avisa al cliente'
                              />
                              <FormControlLabel
                                value='NO'
                                control={<Radio />}
                                label='No permitir'
                              />
                            </RadioGroup>
                          </FormControl>

                          <CustomTextField
                            fullWidth
                            sx={{ marginTop: 4 }}
                            value={product.inventoryQty}
                            onChange={e =>
                              setProduct({ ...product, inventoryQty: e.target.value })
                            }
                            label='Cantidad en inventario'
                          />
                        </div>
                      )}

                      <Typography variant='subtitle2' className='mb-2 mt-4'>
                        ¿Vendido individualmente?
                      </Typography>
                      <FormControlLabel
                        label='Limitar compras a 1 artículo por pedido'
                        control={
                          <Checkbox
                            name='soldIndividually'
                            checked={product.soldIndividually}
                            onChange={e =>
                              setProduct({
                                ...product,
                                soldIndividually: e.target.checked
                              })
                            }
                          />
                        }
                      />
                    </TabPanel>

                    {/* -------------------- Envío -------------------- */}
                    <TabPanel value='3'>
                      <CustomTextField
                        sx={{ marginBottom: 5 }}
                        fullWidth
                        value={product.weight}
                        onChange={e => setProduct({ ...product, weight: e.target.value })}
                        label='Peso (kg)'
                      />
                      <CustomTextField
                        sx={{ marginBottom: 5 }}
                        fullWidth
                        value={product.dimensions}
                        onChange={e => setProduct({ ...product, dimensions: e.target.value })}
                        label='Dimensiones (L x An x Al) cm'
                      />
                    </TabPanel>

                    {/* -------------------- Relacionados -------------------- */}
                    <TabPanel value='4'>
                      <CustomTextField
                        sx={{ marginBottom: 5 }}
                        fullWidth
                        placeholder='Busca un producto'
                        value={product.upsellProducts}
                        onChange={e => setProduct({ ...product, upsellProducts: e.target.value })}
                        label='Ventas Dirigidas a (Productos)'
                      />
                      <CustomTextField
                        sx={{ marginBottom: 5 }}
                        fullWidth
                        placeholder='Busca un producto'
                        value={product.crossSellProducts}
                        onChange={e =>
                          setProduct({ ...product, crossSellProducts: e.target.value })
                        }
                        label='Ventas Cruzadas con (Productos)'
                      />
                    </TabPanel>
                  </div>
                </TabContext>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card sx={{ marginBottom: 5 }}>
          <CardHeader title='Detalles del Producto' className='pbe-4' />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Nombre del Producto
                </Typography>
                <Typography variant='body1' className='mb-4'>
                  {product.productName}
                </Typography>

                <Typography variant='subtitle2' color='text.secondary'>
                  SKU
                </Typography>
                <Typography variant='body1' className='mb-4'>
                  {product.sku || '-'}
                </Typography>

                <Typography variant='subtitle2' color='text.secondary'>
                  Precio
                </Typography>
                <Typography variant='body1' className='mb-4'>
                  {product.price || '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* ------------------------------------------------------------------ */}
      {/*                             Columna derecha                        */}
      {/* ------------------------------------------------------------------ */}
      <Grid item xs={12} md={3}>
        {/* Imágenes */}
        <Card sx={{ marginBottom: 5 }}>
          <CardHeader title='Imagenes' className='pbe-4' />
          <CardContent>
            {productImages.length === 0 ? (
              <Typography>No hay imágenes seleccionadas.</Typography>
            ) : (
              <>
                {seletedImage != null && (
                  <div>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}${seletedImage.url}`}
                      alt={seletedImage.originalFilename || 'Imagen del producto'}
                      width={250}
                      height={250}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                      unoptimized
                    />
                  </div>
                )}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {productImages.map((image, index) => (
                    <Grid item xs={4} sm={4} md={4} key={index}>
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}${image.url}`}
                        alt={image.originalFilename || 'Imagen del producto'}
                        width={50}
                        height={50}
                        style={{ objectFit: 'cover', borderRadius: 8, cursor: 'pointer' }}
                        unoptimized
                        onClick={() => {
                          console.log('imagen seleccionada:', image)
                          setSeletedImage(image)
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            <Link
              sx={{ paddingLeft: 4 }}
              component='button'
              variant='body2'
              onClick={() => {
                setShowMedia(true)
              }}
            >
              Agregar Imagenes
            </Link>
          </CardContent>
        </Card>

        {/* Categorías */}
        <Card sx={{ marginBottom: 5 }}>
          <CardHeader title='Categorias' className='pbe-4' />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <List
                  sx={{
                    width: '100%',
                    maxWidth: 360,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'auto',
                    maxHeight: 300,
                    '& ul': { padding: 0 }
                  }}
                >
                  {categoriesList.map((category, index) => (
                    <ListItem
                      key={index}
                      disablePadding
                      secondaryAction={
                        <Checkbox
                          edge='end'
                          tabIndex={-1}
                          disableRipple
                          onChange={() => {
                            if (!selectedCategories.includes(category.id)) {
                              setSelectedCategories([...selectedCategories, category.id])
                            } else {
                              setSelectedCategories(
                                selectedCategories.filter(id => id !== category.id)
                              )
                            }
                          }}
                          checked={category.id ? selectedCategories.indexOf(category.id) !== -1 : false}
                          inputProps={{ 'aria-labelledby': 'checkbox-list-label-0' }}
                        />
                      }
                    >
                      <ListItemButton onClick={handleToggle(0)}>
                        <ListItemText id='checkbox-list-label-0' primary={category.nombreCategoria} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>

                {showCategoryForm && (
                  <Paper
                    component='form'
                    sx={{
                      p: '2px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      marginTop: 2,
                      marginBottom: 2
                    }}
                  >
                    <InputBase
                      sx={{ flex: 1 }}
                      placeholder='Nombre de la categoría'
                      inputProps={{ 'aria-label': 'nombre de la categoría' }}
                      value={categoryNewName}
                      onChange={e => setCategoryNewName(e.target.value)}
                    />

                    <Divider sx={{ height: 28, m: 0.4 }} orientation='vertical' />
                    <IconButton
                      color='primary'
                      sx={{ p: '6px' }}
                      aria-label='guardar'
                      onClick={e => {
                        e.preventDefault()
                        saveCategory()
                      }}
                    >
                      <SaveOutlined />
                    </IconButton>
                    <IconButton
                      color='primary'
                      sx={{ p: '6px' }}
                      aria-label='cancelar'
                      onClick={e => {
                        e.preventDefault()
                        setShowCategoryForm(false)
                      }}
                    >
                      <CancelOutlined />
                    </IconButton>
                  </Paper>
                )}

                {!showCategoryForm && (
                  <Link
                    sx={{ paddingLeft: 4 }}
                    component='button'
                    variant='body2'
                    onClick={() => {
                      setShowCategoryForm(true)
                    }}
                  >
                    Crear nueva categoría
                  </Link>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Publicación */}
        <Card sx={{ marginBottom: 5 }}>
          <CardHeader title='Publicación' className='pbe-4' />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Estado
                </Typography>

                <CustomTextField
                  className='mt-2'
                  placeholder='Estado'
                  select
                  fullWidth
                  value={product.status}
                  onChange={e => {
                    setProduct({ ...product, status: e.target.value })
                  }}
                >
                  <MenuItem value='ACTIVE'>Activo</MenuItem>
                  <MenuItem value='INACTIVE'>Inactivo</MenuItem>
                </CustomTextField>

                <Divider sx={{ my: 2 }} />

                <Button
                  type='button'
                  variant='contained'
                  color='primary'
                  sx={{ width: '100%' }}
                  onClick={saveProduct}
                >
                  Guardar producto
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Modal de media */}
      {showMedia && (
        <MediaModal
          open={showMedia}
          onClose={(imageList: any[]) => {
            setShowMedia(false)
            console.log('imagenes seleccionadas:', imageList)
            setProductImages([...productImages, ...imageList])
          }}
        />
      )}
    </Grid>
  )
}

export default ProductViewLayout

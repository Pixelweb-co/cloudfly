'use client'
import type { SyntheticEvent } from 'react'
import React, { useEffect, useState } from 'react'
import { Delete, Add } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  MenuItem,
  Grid,
  CardContent,
  Card,
  Tab,
  Divider,
  Typography,
  CardHeader,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import axios from 'axios'
import dotenv from "dotenv";
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import { v4 as uuidv4 } from 'uuid';
import { toast, ToastContainer } from 'react-toastify'

import TabList from '@mui/lab/TabList'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
import CustomTextField from '@/@core/components/mui/TextField'
import axiosInstance from '@/utils/axiosInterceptor'
import JsonTreeBuilder from './treeBuilder'
import Equipment from './equipment'

const schema = yup.object().shape({
  templateName: yup.string().required("El nombre de la plantilla es obligatorio")
})

const VerificationForm = ({ open, onClose, rowSelect }: any) => {
  const [id, setId] = useState(0)
  const [valueT, setValueT] = useState('itemsf')

  const [editData, setEditData] = useState<any>({
    templateName: '',

  })

  const [typeDeviceList, setTypeDeviceList] = useState<any[]>([])
  const [customersList, setCustomersList] = useState<any[]>([])
  const [plantillasList, setPlantillasList] = useState<any[]>([])
  const [disabledAdd, setDisabledAdd] = useState(true)
  const [equimentlist, setEquipmentList] = useState<any>([{id:uuidv4(),equipment:{nom:''},groupsData:[{id:'1',name:'Grupo 1',options:[{id:'1',name:'Item 1'}]}]}])
  const [validate,setValidate] = useState<any>(false)
  const [formTemplate, setFormTemplate] = useState<any[]>()
 const [errorsEquipments, setErrorsEquipments] = useState<any>(0)
const [dataSend, setDataSend] = useState<any | null>(null)
 const [openCh, setOpenCh] = useState<boolean>(true)
 const [validForms, setValidForms] = useState<any>(0)


  const handleClick = () => {
    setOpenCh(!openCh)
  }

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      const [typeDeviceRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/type-device`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ])

      console.log('typeDeviceRes:', typeDeviceRes.data)
      setTypeDeviceList(typeDeviceRes.data)

      return true
    } catch (error) {
      console.error('Error al obtener datos:', error)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])


  useEffect(() => {

    console.log('validForms:', validForms)

    if(validForms > 0) {

      //enviar el formulario

      console.log('enviar el formulario',dataSend)

      onSubmit2(dataSend)

        setValidForms(0)
    }


  }, [validForms])

  useEffect(() => {



    console.log('errorsEquipments:', errorsEquipments)

    if(errorsEquipments === 0) {

      //enviar el formulario

      console.log('enviar el formulario',dataSend)

    }

  }, [errorsEquipments])

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      templateName:''
    },
    mode: 'onSubmit'
  })

  useEffect(() => {
    console.log('errors ', errors)
  }, [errors])

  const onSubmit = async (data: any) => {

    setErrorsEquipments(0)
    setValidate(true)
    setDataSend(data)
    console.log('data:', data)

    setTimeout(() => {
      setValidate(false)
    }
    , 1000)


  }

  const onSubmit2 = async (data: any) => {

    console.log('data:', data)


    try {
      // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo

      const method = 'post' // Actualización o Creación
      const apiUrl = `${API_BASE_URL}/plantillas-verificacion` // Creación

      const response = await axiosInstance({
        method: method, // Usa 'put' para actualización o 'post' para creación
        url: apiUrl,
        data: {
          templateName: data.templateName,
          equimentlist: JSON.stringify(equimentlist)
        }
      })

      setValidate(false)

      // Procesar la respuesta
      toast.success('Hey 👋!', {
        position: 'top-right'
      })
      console.log('Plantilla guardado con éxito:', response.data)

      fetchOptions()

      // Aquí puedes redirigir o mostrar un mensaje de éxito

      setValue('templateName', '')


      reset()
      setId(0)
      setEditData({
        templateName: ''
      })

      onClose()
    } catch (error) {
      console.error('Error al enviar los datos:', error)
      setValidate(false)
    }
  }

  const handleTabChange = (event: SyntheticEvent, newValue: string) => setValueT(newValue)

  const handleReset = () => {

    setValue('templateName', '')
    setEquipmentList([])

  }

  useEffect(() => {
    console.log('formTemplate:', formTemplate)


  }, [formTemplate])


  useEffect(() => {

    console.log('equimentlist:', equimentlist)

  }, [equimentlist])

  const onDeleteEquiment = (id:any) =>{

    console.log("eliminar equipo",id)

    const newData = equimentlist.filter((item:any)=>item.id !== id)

    setEquipmentList(newData)
  }

  const handleUpdateEquipment = (id: string, field: string, value: any) => {

    console.log('Update:', id, field, value)

    setEquipmentList((prevList:any) =>
      prevList.map((equipment:any) =>
        equipment.id === id
          ? { ...equipment, equipment: { ...equipment.equipment, [field]: value } }
          : equipment
      )
    );
  };


  const handleUpdateEquipmentGroupData = (id: string, field: string, value: any) => {
    console.log('Update:', id, field, value)
    setEquipmentList((prevList:any) =>
      prevList.map((equipment:any) =>
        equipment.id === id
          ? { ...equipment, groupsData: value  }
          : equipment
      )
    );
  };

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Plantila de verificación {errorsEquipments }</DialogTitle>

      <DialogContent>


        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Controller
              name='templateName'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  fullWidth
                  {...field}
                  onChange={(e) => {
                    setValue('templateName', e.target.value)
                    setEditData({ ...editData, templateName: e.target.value })
                  }}
                  label='Nombre plantillla'
                  error={Boolean(errors.templateName)}
                  helperText={errors.templateName?.message}
                />
              )}
            />


          </Grid>

          <Grid item xs={12} sm={8}>

              <div className='mb-4 text-right'>
          <Button startIcon={<Add />} variant="outlined" size="small" color='success' className='mb-6' onClick={() => setEquipmentList(
            [...equimentlist,
            {
              id:uuidv4(),
              equipment:{nom:''},
              groupsData:[]
            }])}>Agregar equipo</Button>

            </div>

          {equimentlist && equimentlist.slice().reverse().map((item: any, index: number) => (

            <div key={index}>

              <Equipment
                item={item}
                onDelete={(id:any)=>onDeleteEquiment(id)}
                onUpdate={handleUpdateEquipment}
                onUpdateGroupsData={handleUpdateEquipmentGroupData}
                validate={validate}
                onErrors={(haveErrors:boolean)=> haveErrors ? setErrorsEquipments(errorsEquipments + 1) : setErrorsEquipments(errorsEquipments)}
                onOkform={(okform:boolean)=> okform ? setValidForms(validForms + 1) : setValidForms(validForms)}
                />


            </div>
                  ))}
          </Grid>
        </Grid>



      </DialogContent>
      <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        <DialogActions>
          <Button color='error' onClick={handleReset}>
            Limpiar
          </Button>
          <Button onClick={onClose} color='secondary'>
            Cerrar
          </Button>
          <Button type='submit' variant='contained' color='primary'>
            Guardar datos
          </Button>
        </DialogActions>
      </Box>
      <ToastContainer />
    </Dialog>
  )
}

export default VerificationForm

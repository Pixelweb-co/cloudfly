import CustomTextField from '@/@core/components/mui/TextField';
import { Button, Card, CardContent, CardHeader, Divider, Grid, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import JsonTreeBuilder from './treeBuilder';
import { yupResolver } from '@hookform/resolvers/yup';


const Equipment = ({
  item, 
  onUpdate, 
  onDelete,
  onUpdateGroupsData,
  validate,
  onErrors,
  onOkform 
} : { 
  item: any, 
  onUpdate: any, 
  onDelete: any,
  onUpdateGroupsData:any,
  validate:boolean,
  onErrors:any, 
  onOkform:any
}) => {



  const schema = yup.object().shape({
    nom: yup.string().required("El nombre del equipo es requerido")
  });



  const {
    control,
    formState: { errors },
    setValue,
    trigger
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nom: item.equipment.nom
    },
    mode: 'onBlur'
  });

   // Efecto para validar cuando validate cambia a true
   useEffect(() => {

    console.log("validate p",validate)

    if (validate) {
      trigger(); // Valida el formulario manualmente
    }
  }, [validate, trigger]);

useEffect(() => {

  if(errors.nom){
    console.log("errors.nom",errors.nom)
    onErrors(true)
    onOkform(false)
  }else{
    onErrors(false) 
    onOkform(true)
  }

}, [errors]);


  const handleUpdateField = (field: string, value: any) => {
    console.log('update',field)
    console.log('value',value)
    onUpdate(item.id, field, value);
  };

  const handleUpdateGroupsData = (newGroupsData: any[]) => {

    console.log('newGroupsData',newGroupsData)

    onUpdateGroupsData(item.id, 'groupsData', newGroupsData);
  };
  
  return (
    <Card className="mt-5 bg-gray-100">
      <CardHeader 
        title="Equipo" 
        action={
          <Tooltip title="Eliminar equipo">
            <IconButton onClick={() => onDelete(item.id)} aria-label="delete" color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        }
      />
      
      <CardContent>
        <div className="p-2 border rounded border-gray-300 bg-white">
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Controller
                name="nom"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    {...field}
                    onBlur={e => {
                      setValue('nom', e.target.value);
                      handleUpdateField('nom', e.target.value);
                    }} 
                    label="Nombre"
                    error={Boolean(errors.nom)}
                    helperText={errors.nom?.message?.toString()}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                fullWidth
                value={item.equipment.serialNumber || ''}
                onChange={e => handleUpdateField('serialNumber', e.target.value)}
                label="Nro de serie"
              />
            </Grid>
            <Grid item xs={6}>
              <CustomTextField
                fullWidth
                value={item.equipment.brand || ''}
                onChange={e => handleUpdateField('brand', e.target.value)}
                label="Marca"
              />
            </Grid>
            <Grid item xs={6}>
              <CustomTextField
                fullWidth
                value={item.equipment.model || ''}
                onChange={e => handleUpdateField('model', e.target.value)}
                label="Modelo"
              />
            </Grid>
          </Grid>
        </div>
        <Divider className="mt-4 mb-4" />
        <h3>Opciones de verificación</h3>
        <JsonTreeBuilder groupsData={item.groupsData} onUpdate={handleUpdateGroupsData} />
      </CardContent>
    </Card>
  );
};

export default Equipment;

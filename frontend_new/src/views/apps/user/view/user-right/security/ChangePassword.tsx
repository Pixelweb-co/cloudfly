'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const ChangePassword = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)

  return (
    <Card>
      <CardHeader title='Cambiar contraseña' />
      <CardContent className='flex flex-col gap-4'>
        <Alert icon={false} severity='warning' onClose={() => {}}>
          <AlertTitle>Asegúrate de que se cumplan estos requisitos.</AlertTitle>
          Mínimo de 8 caracteres, con al menos una mayúscula un número y un símbolo.
        </Alert>
        <form>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Nueva Contraseña'
                type={isPasswordShown ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={() => setIsPasswordShown(!isPasswordShown)}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Confirmar Contraseña'
                type={isConfirmPasswordShown ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} className='flex gap-4'>
              <Button variant='contained'>Cambiar contraseña</Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangePassword

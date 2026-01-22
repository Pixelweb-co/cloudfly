'use client'

import React from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

const ConfiguracionView = () => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Typography variant='h4'>Configuración de Telefonía</Typography>
                <Typography variant='body2' color='text.secondary'>
                    Parámetros globales del servidor de telefonía (Asterisk / ARI).
                </Typography>
            </Grid>
        </Grid>
    )
}

export default ConfiguracionView

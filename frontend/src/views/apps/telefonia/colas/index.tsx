'use client'

import React from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

const ColasView = () => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Typography variant='h4'>Gestión de Colas</Typography>
                <Typography variant='body2' color='text.secondary'>
                    Configuración y monitoreo de colas de atención.
                </Typography>
            </Grid>
        </Grid>
    )
}

export default ColasView

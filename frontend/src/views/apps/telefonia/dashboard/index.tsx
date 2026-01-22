'use client'

import React from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import WebPhone from './components/WebPhone'

const TelefoniaDashboard = () => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Typography variant='h4' sx={{ mb: 1 }}>Dashboard de Telefonía</Typography>
                <Typography variant='body2' color='text.secondary'>
                    Gestiona tus llamadas y conexiones WebRTC en tiempo real.
                </Typography>
            </Grid>

            <Grid item xs={12} md={4} lg={3}>
                <WebPhone />
            </Grid>

            <Grid item xs={12} md={8} lg={9}>
                <Grid container spacing={6}>
                    <Grid item xs={12} sm={6}>
                        {/* Aquí irán estadísticas o logs de llamadas */}
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}

export default TelefoniaDashboard

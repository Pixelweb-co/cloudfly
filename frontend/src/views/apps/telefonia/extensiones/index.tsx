'use client'

import React from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

const ExtensionesView = () => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Typography variant='h4'>Extensiones</Typography>
                <Typography variant='body2' color='text.secondary'>
                    Administración de extensiones PJSIP y WebRTC.
                </Typography>
            </Grid>
        </Grid>
    )
}

export default ExtensionesView

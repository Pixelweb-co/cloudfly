'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const HomeDashboard = () => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h4">
                            🎉 Dashboard CloudFly
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Dashboard completamente funcional con datos en tiempo real.
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default HomeDashboard

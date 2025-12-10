'use client'

// MUI Imports
import Skeleton from '@mui/material/Skeleton'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'

const SkeletonStats = () => {
    return (
        <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item}>
                    <Card>
                        <CardContent>
                            <Box display='flex' justifyContent='space-between' alignItems='flex-start' mb={2}>
                                <Box flex={1}>
                                    <Skeleton variant='text' width='60%' height={20} sx={{ mb: 1 }} />
                                    <Skeleton variant='text' width='80%' height={40} />
                                </Box>
                                <Skeleton variant='circular' width={56} height={56} />
                            </Box>
                            <Skeleton variant='rectangular' width='100%' height={24} sx={{ borderRadius: 1 }} />
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    )
}

export default SkeletonStats

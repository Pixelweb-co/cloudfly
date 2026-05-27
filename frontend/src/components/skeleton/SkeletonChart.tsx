'use client'

// MUI Imports
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'

const SkeletonChart = () => {
    return (
        <Card>
            <CardHeader
                title={<Skeleton variant='text' width='40%' height={32} />}
                subheader={<Skeleton variant='text' width='30%' height={20} />}
                action={<Skeleton variant='rectangular' width={200} height={32} sx={{ borderRadius: 1 }} />}
            />
            <CardContent>
                <Box sx={{ position: 'relative', height: 350 }}>
                    {/* Simular ejes del gráfico */}
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                        <Skeleton variant='rectangular' width='100%' height={2} />
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, top: 0 }}>
                        <Skeleton variant='rectangular' width={2} height='100%' />
                    </Box>

                    {/* Simular barras/líneas del gráfico */}
                    <Box display='flex' alignItems='flex-end' justifyContent='space-around' height='100%' pt={2}>
                        {[60, 80, 70, 90, 85, 95, 75].map((height, index) => (
                            <Skeleton
                                key={index}
                                variant='rectangular'
                                width={40}
                                height={`${height}%`}
                                sx={{ borderRadius: 1 }}
                            />
                        ))}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    )
}

export default SkeletonChart

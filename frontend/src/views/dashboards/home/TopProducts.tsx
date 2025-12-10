// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'

// Icon Imports
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon from '@mui/icons-material/Remove'

interface Product {
    id: string
    name: string
    sales: number
    trend: 'up' | 'down' | 'stable'
    percentage: number
    maxSales: number
}

const TopProducts = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [maxSales, setMaxSales] = useState(0)

    useEffect(() => {
        fetchTopProducts()
    }, [])

    const fetchTopProducts = async () => {
        // TODO: Fetch real data from API
        const mockProducts: Product[] = [
            { id: '1', name: 'Coca Cola 350ml', sales: 45, trend: 'up', percentage: 0, maxSales: 0 },
            { id: '2', name: 'Pan Integral 500g', sales: 32, trend: 'up', percentage: 0, maxSales: 0 },
            { id: '3', name: 'Leche Entera 1L', sales: 28, trend: 'stable', percentage: 0, maxSales: 0 },
            { id: '4', name: 'Agua 500ml', sales: 25, trend: 'down', percentage: 0, maxSales: 0 },
            { id: '5', name: 'Café 250g', sales: 20, trend: 'up', percentage: 0, maxSales: 0 }
        ]

        const max = Math.max(...mockProducts.map(p => p.sales))
        setMaxSales(max)

        const productsWithPercentage = mockProducts.map(product => ({
            ...product,
            percentage: (product.sales / max) * 100,
            maxSales: max
        }))

        setProducts(productsWithPercentage)
    }

    const getTrendIcon = (trend: Product['trend']) => {
        switch (trend) {
            case 'up':
                return <TrendingUpIcon fontSize='small' />
            case 'down':
                return <TrendingDownIcon fontSize='small' />
            default:
                return <RemoveIcon fontSize='small' />
        }
    }

    const getTrendColor = (trend: Product['trend']) => {
        switch (trend) {
            case 'up':
                return 'success'
            case 'down':
                return 'error'
            default:
                return 'default'
        }
    }

    return (
        <Card>
            <CardHeader
                title='Productos Más Vendidos'
                subheader='Esta semana'
            />
            <CardContent sx={{ pt: 0 }}>
                <List sx={{ py: 0 }}>
                    {products.map((product, index) => (
                        <ListItem
                            key={product.id}
                            sx={{
                                px: 0,
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                mb: index < products.length - 1 ? 2 : 0
                            }}
                        >
                            <Box display='flex' justifyContent='space-between' width='100%' mb={1}>
                                <Box display='flex' alignItems='center' gap={1}>
                                    <Typography variant='h6' color='text.secondary' fontWeight={700}>
                                        #{index + 1}
                                    </Typography>
                                    <ListItemText
                                        primary={product.name}
                                        primaryTypographyProps={{
                                            variant: 'body2',
                                            fontWeight: 600
                                        }}
                                    />
                                </Box>
                                <Box display='flex' alignItems='center' gap={1}>
                                    <Chip
                                        icon={getTrendIcon(product.trend)}
                                        label={`${product.sales} ventas`}
                                        size='small'
                                        color={getTrendColor(product.trend)}
                                        variant='outlined'
                                    />
                                </Box>
                            </Box>
                            <LinearProgress
                                variant='determinate'
                                value={product.percentage}
                                sx={{
                                    width: '100%',
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: 'action.hover',
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        background: 'linear-gradient(90deg, #4A90E2 0%, #667eea 100%)'
                                    }
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
                <Button
                    fullWidth
                    variant='outlined'
                    sx={{ mt: 2 }}
                    onClick={() => (window.location.href = '/reportes/productos')}
                >
                    Ver Reporte Completo
                </Button>
            </CardContent>
        </Card>
    )
}

export default TopProducts

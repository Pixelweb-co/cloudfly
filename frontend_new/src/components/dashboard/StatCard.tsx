'use client'

import { useMemo } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TrendingUp from '@mui/icons-material/TrendingUp'
import TrendingDown from '@mui/icons-material/TrendingDown'
import type { SxProps, Theme } from '@mui/material'

interface StatCardProps {
    title: string
    value: string | number
    change?: number
    changeLabel?: string
    icon?: React.ReactNode
    color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
    loading?: boolean
}

const StatCard = ({ title, value, change, changeLabel, icon, color = 'primary', loading }: StatCardProps) => {
    const isPositive = change !== undefined && change >= 0

    const cardStyles: SxProps<Theme> = useMemo(
        () => ({
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                bgcolor: `${color}.main`
            }
        }),
        [color]
    )

    if (loading) {
        return (
            <Card sx={cardStyles}>
                <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1 }} />
                        <Box sx={{ height: 32, bgcolor: 'action.hover', borderRadius: 1, width: '60%' }} />
                        <Box sx={{ height: 16, bgcolor: 'action.hover', borderRadius: 1, width: '40%' }} />
                    </Box>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card sx={cardStyles}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" fontWeight={600}>
                            {value}
                        </Typography>
                    </Box>
                    {icon && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                bgcolor: `${color}.lighter`,
                                color: `${color}.main`
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>

                {change !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isPositive ? (
                            <TrendingUp fontSize="small" color="success" />
                        ) : (
                            <TrendingDown fontSize="small" color="error" />
                        )}
                        <Typography
                            variant="body2"
                            color={isPositive ? 'success.main' : 'error.main'}
                            fontWeight={500}
                        >
                            {isPositive ? '+' : ''}
                            {change}%
                        </Typography>
                        {changeLabel && (
                            <Typography variant="body2" color="text.secondary">
                                {changeLabel}
                            </Typography>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    )
}

export default StatCard

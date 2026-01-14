'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'

const CardStat = ({ title, value, color, icon }: { title: string, value: string, color: string, icon: string }) => (
    <Card>
        <CardContent className='flex flex-col gap-2'>
            <div className='flex items-center gap-4'>
                <Avatar variant='rounded' className={`bg-${color}-100`}>
                    <i className={`${icon} text-${color}-600 text-2xl`} />
                </Avatar>
                <Typography variant='h6'>{title}</Typography>
            </div>
            <Typography variant='h4' className='mt-2 font-bold'>{value}</Typography>
        </CardContent>
    </Card>
)

const PortfolioDashboard = ({ totalReceivable }: { totalReceivable: number }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <Grid container spacing={6}>
            <Grid item xs={12} sm={6} md={3}>
                <CardStat
                    title='Total Cartera'
                    value={formatCurrency(totalReceivable)}
                    color='primary'
                    icon='tabler-wallet'
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <CardStat
                    title='Vencido'
                    value={formatCurrency(0)}
                    color='error'
                    icon='tabler-alert-circle'
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <CardStat
                    title='Recaudado (Mes)'
                    value={formatCurrency(0)}
                    color='success'
                    icon='tabler-cash'
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <CardStat
                    title='Clientes en Mora'
                    value='0'
                    color='warning'
                    icon='tabler-users'
                />
            </Grid>

            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant='h5' className='mbe-4'>Acciones Rápidas</Typography>
                        <div className='flex gap-4'>
                            <button className='bg-primary text-white px-4 py-2 rounded shadow hover:opacity-90'>
                                <i className='tabler-plus me-2' />
                                Nuevo Recaudo
                            </button>
                            <button className='border border-gray-300 px-4 py-2 rounded hover:bg-gray-50'>
                                <i className='tabler-file-text me-2' />
                                Estado de Cuenta
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default PortfolioDashboard

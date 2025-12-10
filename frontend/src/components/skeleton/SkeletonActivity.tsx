'use client'

// MUI Imports
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Box from '@mui/material/Box'

const SkeletonActivity = () => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title={<Skeleton variant='text' width='50%' height={32} />}
                subheader={<Skeleton variant='text' width='40%' height={20} />}
            />
            <CardContent sx={{ pt: 0 }}>
                <List sx={{ py: 0 }}>
                    {[1, 2, 3, 4, 5].map((item) => (
                        <ListItem key={item} sx={{ px: 0, mb: 1 }}>
                            <ListItemAvatar>
                                <Skeleton variant='circular' width={40} height={40} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={<Skeleton variant='text' width='70%' height={20} />}
                                secondary={
                                    <Box mt={0.5}>
                                        <Skeleton variant='text' width='50%' height={16} />
                                        <Skeleton variant='text' width='30%' height={14} sx={{ mt: 0.5 }} />
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
                <Skeleton variant='rectangular' width='100%' height={40} sx={{ borderRadius: 1, mt: 2 }} />
            </CardContent>
        </Card>
    )
}

export default SkeletonActivity

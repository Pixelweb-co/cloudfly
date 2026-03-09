import { Box, Button, Typography } from '@mui/material'

interface Props {
    onSuccess: () => void
    mode?: string
}

const WhatsAppConfigForm = ({ onSuccess }: Props) => {
    return (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 4 }}>
                Configuración de WhatsApp pendiente de implementar.
            </Typography>
            <Button variant="contained" color="primary" onClick={onSuccess}>
                Continuar sin configurar
            </Button>
        </Box>
    )
}

export default WhatsAppConfigForm

'use client'

// React Imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import Link from '@components/Link'
import AuthIllustrationWrapperCustomer from './AuthIllustrationWrapperCustomer'
import FormCustomer from '@/views/apps/customers/form/page'
import ChannelConfigSetupForm from '@/views/apps/settings/channel-config/ChannelConfigSetupForm'
import ProductCreationStep from './ProductCreationStep'

const steps = [
  {
    title: 'Bienvenido',
    subtitle: 'Configuración inicial',
    icon: '👋'
  },
  {
    title: 'Tu Negocio',
    subtitle: 'Información comercial',
    icon: '🏢'
  },
  {
    title: 'Chatbot IA',
    subtitle: 'WhatsApp & Automatización',
    icon: '🤖'
  },
  {
    title: 'Productos',
    subtitle: 'Catálogo inicial',
    icon: '📦'
  }
]

const AccountSetup = () => {
  const [activeStep, setActiveStep] = useState(0)
  const router = useRouter()

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Finalizar wizard
      router.push('/home')
    } else {
      setActiveStep(prevActiveStep => prevActiveStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleCustomerSuccess = (customerData: any) => {
    // Cuando se crea el customer exitosamente, avanzar al siguiente paso
    handleNext()
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box className='text-center py-12'>
            <Typography variant='h2' className='mb-4 font-bold'>
              ¡Bienvenido a CloudFly! 🚀
            </Typography>
            <Typography variant='h5' className='mb-6 text-textSecondary font-normal'>
              Estamos emocionados de ayudarte a automatizar tu negocio
            </Typography>

            <Grid container spacing={3} className='max-w-4xl mx-auto mt-8'>
              <Grid item xs={12} md={6}>
                <Box className='p-6 rounded-xl border border-divider hover:border-primary transition-colors'>
                  <Typography fontSize='3rem' className='mb-2'>⚡</Typography>
                  <Typography variant='h6' className='mb-2 font-semibold'>
                    Configuración Rápida
                  </Typography>
                  <Typography variant='body2' className='text-textSecondary'>
                    Solo 4 pasos simples para tener tu sistema completamente operativo
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box className='p-6 rounded-xl border border-divider hover:border-primary transition-colors'>
                  <Typography fontSize='3rem' className='mb-2'>🤖</Typography>
                  <Typography variant='h6' className='mb-2 font-semibold'>
                    IA Integrada
                  </Typography>
                  <Typography variant='body2' className='text-textSecondary'>
                    Chatbot inteligente que responderá a tus clientes 24/7
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box className='p-6 rounded-xl border border-divider hover:border-primary transition-colors'>
                  <Typography fontSize='3rem' className='mb-2'>📊</Typography>
                  <Typography variant='h6' className='mb-2 font-semibold'>
                    Gestión Completa
                  </Typography>
                  <Typography variant='body2' className='text-textSecondary'>
                    Productos, ventas, clientes y reportes en un solo lugar
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box className='p-6 rounded-xl border border-divider hover:border-primary transition-colors'>
                  <Typography fontSize='3rem' className='mb-2'>🎯</Typography>
                  <Typography variant='h6' className='mb-2 font-semibold'>
                    Soporte Dedicado
                  </Typography>
                  <Typography variant='body2' className='text-textSecondary'>
                    Nuestro equipo está listo para ayudarte en cada paso
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box className='mt-8 p-4 bg-primary/10 rounded-xl max-w-2xl mx-auto'>
              <Typography variant='body1' className='font-medium'>
                💡 <strong>Tiempo estimado:</strong> 10-15 minutos para completar toda la configuración
              </Typography>
            </Box>
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant='h5' className='mb-2 font-semibold text-center'>
              Información de tu Negocio
            </Typography>
            <Typography variant='body2' className='mb-6 text-textSecondary text-center'>
              Esta información nos ayudará a personalizar CloudFly específicamente para tu empresa
            </Typography>
            <FormCustomer onSuccess={handleCustomerSuccess} />
          </Box>
        )

      case 2:
        return (
          <Box>
            <Typography variant='h5' className='mb-2 font-semibold text-center'>
              Configura tu Chatbot de WhatsApp
            </Typography>
            <Typography variant='body2' className='mb-6 text-textSecondary text-center'>
              Conecta tu número de WhatsApp Business y personaliza tu asistente IA
            </Typography>
            <ChannelConfigSetupForm onSuccess={handleNext} />
          </Box>
        )


      case 3:
        return (
          <ProductCreationStep onProductCreated={handleNext} />
        )

      default:
        return null
    }
  }

  return (
    <AuthIllustrationWrapperCustomer>
      <Card className='flex flex-col sm:is-[900px]'>
        <CardContent className='sm:!p-12'>
          <Link href={'/'} className='flex justify-center mbe-6'>
            <Logo />
          </Link>

          {/* Stepper */}
          <Stepper activeStep={activeStep} alternativeLabel className='mb-8'>
            {steps.map((step, index) => (
              <Step key={step.title}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: activeStep >= index ? 'primary.main' : 'action.hover',
                        color: activeStep >= index ? 'primary.contrastText' : 'text.secondary',
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                      }}
                    >
                      {activeStep > index ? '✓' : step.icon}
                    </Box>
                  )}
                >
                  <Typography variant='body2' className='font-semibold'>
                    {step.title}
                  </Typography>
                  <Typography variant='caption' className='text-textSecondary'>
                    {step.subtitle}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box className='min-h-[400px]'>
            <Box 
              key={activeStep} 
              className='wizard-step-container'
            >
              {renderStepContent(activeStep)}
            </Box>
          </Box>

          {/* Navigation Buttons */}
          {activeStep !== 1 && activeStep !== 2 && ( // Los pasos 1 y 2 (FormCustomer y ChatbotSetupForm) tienen sus propios botones
            <Box className='flex justify-between mt-8'>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant='outlined'
              >
                Atrás
              </Button>
              <Button
                variant='contained'
                onClick={handleNext}
                size='large'
                className='min-w-[120px] next-wizard-step'
              >
                {activeStep === steps.length - 1 ? 'Finalizar' : 'Continuar'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </AuthIllustrationWrapperCustomer>
  )
}

export default AccountSetup

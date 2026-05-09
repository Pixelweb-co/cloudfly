'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

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
import WhatsAppConfigForm from '@/views/apps/comunicaciones/canales/whatsapp/WhatsAppConfigForm'
import ProductCreationStep from './ProductCreationStep'
import { userMethods } from '@/utils/userMethods'
import { axiosInstance } from '@/utils/axiosInstance'

// Custom Step Icon Component extracted to avoid re-creation on each render
const CustomStepIcon = (props: { active: boolean; completed: boolean; icon: string; index: number }) => {
  const { active, completed, icon, index } = props

  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: active || completed ? 'primary.main' : 'action.hover',
        color: active || completed ? 'primary.contrastText' : 'text.secondary',
        fontSize: '1.25rem',
        fontWeight: 'bold',
        transition: 'all 0.3s'
      }}
    >
      {completed ? '✓' : icon}
    </Box>
  )
}

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
  const { update: updateSession } = useSession()
  const [activeStep, setActiveStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)

    // Resume logic from localStorage
    const savedStep = localStorage.getItem('account_setup_step')
    const user = userMethods.getUserLogin()

    if (savedStep) {
      const stepInt = parseInt(savedStep, 10)

      // Smart skip: If we have customerId but are in step 0 or 1, go to step 2
      if (user?.customerId && stepInt < 2) {
        setActiveStep(2)
        localStorage.setItem('account_setup_step', '2')
      } else {
        setActiveStep(stepInt)
      }
    } else if (user?.customerId) {
      // Fallback if no step saved but has customer
      setActiveStep(2)
      localStorage.setItem('account_setup_step', '2')
    }
  }, [])

  // Sync step to localStorage
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('account_setup_step', activeStep.toString())
    }
  }, [activeStep, isMounted])

  const finishOnboarding = async () => {
    try {
      const user = userMethods.getUserLogin()
      if (!user?.id) {
        router.push('/login')
        return
      }

      console.log('🏁 [WIZARD] Finalizing onboarding. User:', user.id);
      const response = await axiosInstance.post('/auth/complete-onboarding', { userId: user.id })
      
      console.log('📦 [WIZARD] Backend response received:', response.data.status, response.data.message);
      
      if (response.data.status) {
        console.log('✅ [WIZARD] Onboarding backend sync success.');
        
        // ACTUALIZAR TOKEN Y USERDATA (Trae el nuevo customerId y onboardingCompleted: true)
        if (response.data.jwt) {
          localStorage.setItem('jwt', response.data.jwt)
          console.log('🔑 [WIZARD] JWT Token refreshed. New token iat:', JSON.parse(atob(response.data.jwt.split('.')[1])).iat);
        }
        
        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user))
          
          if (response.data.user.activeCompanyId) {
            localStorage.setItem('activeCompanyId', response.data.user.activeCompanyId.toString())
          }
          if (response.data.user.customerId) {
            localStorage.setItem('activeTenantId', response.data.user.customerId.toString())
          }
        }
      }
      
      localStorage.removeItem('account_setup_step')
      
      // Update NextAuth session to reflect new user data (important for AuthSync)
      if (updateSession) {
        console.log('🔄 [WIZARD] Updating NextAuth session...')
        await updateSession()
      }

      // Use hard redirect to ensure all layouts and guards (like OnboardingGuard) 
      // are re-initialized with the new localStorage/session state.
      window.location.href = '/home'
    } catch (error) {
      console.error('❌ [ACCOUNT-SETUP] Error finishing onboarding:', error)
      window.location.href = '/home' // Fallback redirect
    }
  }

  const handleNext = async () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 1000); // 1s cooldown

    console.log(`➡️ [WIZARD] handleNext called. Current Step: ${activeStep}, Steps Length: ${steps.length}`);
    if (activeStep === steps.length - 1) {
      console.log('🎯 [WIZARD] Reached last step. Calling finishOnboarding...');
      await finishOnboarding()
      return
    }

    const nextStep = activeStep + 1
    console.log(`📍 [WIZARD] Moving to next step: ${nextStep}`);
    setActiveStep(nextStep)
    localStorage.setItem('account_setup_step', nextStep.toString())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleCustomerSuccess = (customerData: any) => {
    // Una vez configurado el negocio, avanzar al siguiente paso (WhatsApp)
    setActiveStep(2)
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
            <WhatsAppConfigForm onSuccess={handleNext} mode="onboarding" />
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
              <Step 
                key={step.title} 
                onClick={() => setActiveStep(index)}
                sx={{ cursor: 'pointer' }}
              >
                <StepLabel
                  StepIconComponent={() => (
                    <CustomStepIcon
                      active={activeStep === index}
                      completed={activeStep > index}
                      icon={step.icon}
                      index={index}
                    />
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
            {isMounted && (
              <Box
                key={activeStep}
                className='wizard-step-container'
              >
                {renderStepContent(activeStep)}
              </Box>
            )}
          </Box>

          {/* Navigation Buttons */}
          {activeStep !== 1 && activeStep !== 2 && activeStep !== 3 && ( // Pasos con botones propios
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

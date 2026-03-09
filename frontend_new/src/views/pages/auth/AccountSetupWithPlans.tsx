'use client'

// Next Imports
import { useParams } from 'next/navigation'
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import Link from '@components/Link'
import SelectPlanDialog from '@/components/dialogs/SelectPlanDialog'
import CheckoutDialog from '@/components/dialogs/CheckoutDialog'

// Styled Component Imports
import AuthIllustrationWrapperCustomer from './AuthIllustrationWrapperCustomer'
import FormCustomer from '@/views/apps/customers/form/page'

interface Plan {
  id: number
  name: string
  description: string
  price: number
  durationDays: number
  isActive: boolean
}

interface Customer {
  id: number
  name: string
  email: string
}

const AccountSetupWithPlans = () => {
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [formStep, setFormStep] = useState<'form' | 'plan' | 'checkout'>('form')

  const handleFormSuccess = (customerData: Customer) => {
    setCustomer(customerData)
    setFormStep('plan')
    setShowPlanDialog(true)
  }

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowPlanDialog(false)
    setShowCheckoutDialog(true)
    setFormStep('checkout')
  }

  const handleCheckoutClose = () => {
    setShowCheckoutDialog(false)
    // No cerrar el dialog de planes para permitir cambiar de plan
  }

  return (
    <AuthIllustrationWrapperCustomer>
      <Card className='flex flex-col sm:is-[750px]'>
        <CardContent className='sm:!p-12'>
          <Link href={'/'} className='flex justify-center mbe-6'>
            <Logo />
          </Link>

          {formStep === 'form' && (
            <>
              <div className='flex flex-col gap-1 mbe-6'>
                <Typography variant='h4'>Información del Negocio</Typography>
                <Typography>Proporciona la información para crear tu empresa:</Typography>
              </div>
              <FormCustomer onSuccess={handleFormSuccess} />
            </>
          )}

          {(formStep === 'plan' || formStep === 'checkout') && customer && (
            <div className='text-center'>
              <Typography variant='h5' sx={{ mb: 2 }}>
                ¡Empresa creada exitosamente! 🎉
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Ahora selecciona el plan que se adapte mejor a tus necesidades
              </Typography>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para seleccionar plan */}
      <SelectPlanDialog
        open={showPlanDialog}
        onClose={() => {
          setShowPlanDialog(false)
          setFormStep('form')
        }}
        onSelectPlan={handleSelectPlan}
      />

      {/* Dialog para checkout */}
      {customer && (
        <CheckoutDialog
          open={showCheckoutDialog}
          onClose={handleCheckoutClose}
          plan={selectedPlan}
          userId={customer.id}
          customerName={customer.name}
        />
      )}
    </AuthIllustrationWrapperCustomer>
  )
}

export default AccountSetupWithPlans

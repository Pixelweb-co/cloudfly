import React, { useState } from 'react'
import { ContactType } from '../types'
import { ContactService } from '../services/api'
import { X, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CreateCustomerModalProps {
    isOpen: boolean
    onClose: () => void
    onCustomerCreated: (customer: any) => void
    tenantId: number
}

interface FormErrors {
    name?: string
    phone?: string
    email?: string
    taxId?: string
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
    isOpen,
    onClose,
    onCustomerCreated,
    tenantId
}) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        taxId: ''
    })

    const [errors, setErrors] = useState<FormErrors>({})
    const [isLoading, setIsLoading] = useState(false)

    // Validación de campos
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        // Nombre es obligatorio
        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es obligatorio'
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'El nombre debe tener al menos 3 caracteres'
        }

        // Validar email si se proporciona
        if (formData.email && formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Email inválido'
            }
        }

        // Validar teléfono si se proporciona
        if (formData.phone && formData.phone.trim()) {
            const phoneRegex = /^[0-9+\-\s()]+$/
            if (!phoneRegex.test(formData.phone)) {
                newErrors.phone = 'Teléfono inválido (solo números, +, -, espacios y paréntesis)'
            } else if (formData.phone.replace(/\D/g, '').length < 7) {
                newErrors.phone = 'El teléfono debe tener al menos 7 dígitos'
            }
        }

        // Validar RUC/DNI si se proporciona
        if (formData.taxId && formData.taxId.trim()) {
            const taxIdClean = formData.taxId.replace(/\D/g, '')
            if (taxIdClean.length < 8) {
                newErrors.taxId = 'El RUC/DNI debe tener al menos 8 dígitos'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error('Por favor corrija los errores en el formulario')
            return
        }

        try {
            setIsLoading(true)
            const customer = await ContactService.create({
                ...formData,
                type: ContactType.CUSTOMER,
                tenantId
            })

            toast.success('Cliente creado exitosamente')
            onCustomerCreated(customer)
            handleClose()
        } catch (error: any) {
            console.error('Error creating customer:', error)
            toast.error(error?.message || 'Error al crear cliente')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setFormData({ name: '', phone: '', email: '', address: '', taxId: '' })
        setErrors({})
        onClose()
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Limpiar error del campo cuando el usuario empieza a escribir
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-2xl w-[550px] max-h-[90vh] flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Save size={20} />
                        Crear Nuevo Cliente
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-white hover:text-gray-200 transition-colors"
                        disabled={isLoading}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Nombre Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition-all ${errors.name
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                    }`}
                                placeholder="Ej: Juan Pérez"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition-all ${errors.phone
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                    }`}
                                placeholder="Ej: +51 999 888 777"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                disabled={isLoading}
                            />
                            {errors.phone && (
                                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition-all ${errors.email
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                    }`}
                                placeholder="Ej: cliente@ejemplo.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* RUC/DNI */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                RUC / DNI
                            </label>
                            <input
                                type="text"
                                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 transition-all ${errors.taxId
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-green-500'
                                    }`}
                                placeholder="Ej: 12345678 o 20123456789"
                                value={formData.taxId}
                                onChange={(e) => handleInputChange('taxId', e.target.value)}
                                disabled={isLoading}
                            />
                            {errors.taxId && (
                                <p className="mt-1 text-xs text-red-500">{errors.taxId}</p>
                            )}
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Dirección
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                                placeholder="Ej: Av. Principal 123, Lima"
                                rows={3}
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors font-medium"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || !formData.name.trim()}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Crear Cliente
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

import React, { useState, useEffect } from 'react'
import { Contact, ContactType } from '../types'
import { ContactService } from '../services/api'
import { Search, User, Plus, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { CreateCustomerModal } from './CreateCustomerModal'

interface CustomerSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (customer: Contact) => void
    tenantId: number
}

export const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    tenantId
}) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [customers, setCustomers] = useState<Contact[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadCustomers()
            setSearchTerm('')
        }
    }, [isOpen])

    const loadCustomers = async () => {
        try {
            setIsLoading(true)
            const data = await ContactService.getAll(tenantId)
            // Filtrar solo clientes
            const clientesOnly = data.filter(c => c.type === ContactType.CUSTOMER)
            setCustomers(clientesOnly)
        } catch (error) {
            console.error('Error loading customers:', error)
            toast.error('Error al cargar clientes')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = async (term: string) => {
        setSearchTerm(term)
        if (term.length < 2) {
            if (term.length === 0) loadCustomers()
            return
        }

        try {
            setIsLoading(true)
            const results = await ContactService.search(tenantId, term)
            const clientesOnly = results.filter(c => c.type === ContactType.CUSTOMER)
            setCustomers(clientesOnly)
        } catch (error) {
            console.error('Error searching customers:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCustomerCreated = (customer: Contact) => {
        // Recargar la lista de clientes
        loadCustomers()
        // Seleccionar el cliente recién creado automáticamente
        onSelect(customer)
        onClose()
    }

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[85vh] flex flex-col">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <User size={20} />
                            Seleccionar Cliente
                        </h2>
                        <button onClick={onClose} className="text-white hover:text-gray-200">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-500">Cargando...</p>
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <User size={48} className="mx-auto mb-2 text-gray-300" />
                                <p>No se encontraron clientes</p>
                                <p className="text-sm mt-1">Crea uno nuevo usando el botón de abajo</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {customers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        onClick={() => {
                                            onSelect(customer)
                                            onClose()
                                        }}
                                        className="p-3 hover:bg-blue-50 cursor-pointer rounded border border-transparent hover:border-blue-200 transition-colors flex justify-between items-center"
                                    >
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800">{customer.name}</div>
                                            <div className="text-xs text-gray-500 flex gap-3 mt-1">
                                                {customer.phone && <span>📞 {customer.phone}</span>}
                                                {customer.email && <span>✉️ {customer.email}</span>}
                                                {customer.taxId && <span>🆔 {customer.taxId}</span>}
                                            </div>
                                        </div>
                                        <div className="text-xs font-semibold bg-green-100 px-2 py-1 rounded text-green-700">
                                            CLIENTE
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-between">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 font-semibold transition-colors"
                        >
                            <Plus size={18} />
                            Crear Nuevo Cliente
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Creación de Cliente */}
            <CreateCustomerModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCustomerCreated={handleCustomerCreated}
                tenantId={tenantId}
            />
        </>
    )
}

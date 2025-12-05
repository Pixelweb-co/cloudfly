import React, { useEffect, useState } from 'react'
import { CartItem, PaymentMethod, OrderRequest, Contact } from './types'
import { ProductService, OrderService } from './services/api'
import { ProductType } from '@/types/apps/productType'
import { PosHeader } from './components/PosHeader'
import { TransactionTable } from './components/TransactionPanel'
import { RightPanel } from './components/RightPanel'
import { FunctionKeys } from './components/FunctionKeys'
import { PaymentModal } from './components/PaymentModal'
import { CustomerSelectionModal } from './components/CustomerSelectionModal'
import { TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AuthManager } from '@/utils/authManager'
import { userMethods } from '@/utils/userMethods'

const PosComponent: React.FC = () => {
  const [products, setProducts] = useState<ProductType[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<Contact | null>(null)

  const getTenantId = () => {
    const user = userMethods.getUserLogin();

    if (!user || !user.customer || !user.customer.id) {
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.')
      window.location.href = '/login'
      return null
    }

    return user.customer.id
  }

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await AuthManager.validateToken()
      if (!isValid) return

      fetchProducts()
    }

    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const data = await ProductService.getAll()
        setProducts(data)
      } catch (error) {
        console.error('Error al cargar productos:', error)
        toast.error('Error al cargar productos')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    const intervalId = setInterval(async () => {
      await AuthManager.validateToken()
    }, 60000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3) return

    const searchProduct = async () => {
      try {
        const productByBarcode = await ProductService.getByBarcode(searchTerm)

        if (productByBarcode) {
          addToCart(productByBarcode)
          setSearchTerm('')
          return
        }

        const productsByName = await ProductService.searchByName(searchTerm)

        if (productsByName.length === 1) {
          addToCart(productsByName[0])
          setSearchTerm('')
        } else if (productsByName.length > 1) {
          console.log('Múltiples productos encontrados:', productsByName)
        }
      } catch (error) {
        console.error('Error en búsqueda:', error)
      }
    }

    const timeoutId = setTimeout(searchProduct, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const addToCart = (product: ProductType) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)

      if (existing) {
        const newQuantity = existing.quantity + 1
        if (product.manageStock && product.inventoryQty !== null && newQuantity > product.inventoryQty) {
          toast.error(`Stock insuficiente. Disponible: ${product.inventoryQty}`)
          return prev
        }

        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        )
      }

      if (product.manageStock && product.inventoryQty !== null && product.inventoryQty < 1) {
        toast.error('Producto sin stock')
        return prev
      }

      return [...prev, { ...product, quantity: 1, discount: 0 }]
    })

    setSelectedItemId(product.id)
    toast.success(`${product.productName} agregado`)
  }

  const updateCartItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(prev =>
      prev.map(item => {
        if (item.id === productId) {
          if (item.manageStock && item.inventoryQty !== null && quantity > item.inventoryQty) {
            toast.error(`Stock insuficiente. Disponible: ${item.inventoryQty}`)
            return item
          }
          return { ...item, quantity }
        }
        return item
      })
    )
  }

  const updateCartItemDiscount = (productId: number, discount: number) => {
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, discount: Math.max(0, discount) } : item
      )
    )
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const price = item.salePrice || item.price
      return sum + (price * item.quantity)
    }, 0)
  }

  const calculateTotalDiscount = () => {
    return cart.reduce((sum, item) => sum + item.discount, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateTotalDiscount()
  }

  const processPayment = async (method: PaymentMethod) => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    const tenantId = getTenantId()
    if (!tenantId) {
      return
    }

    try {
      setIsLoading(true)

      const orderRequest: OrderRequest = {
        tenantId: tenantId,
        customerId: selectedCustomer ? selectedCustomer.id : null,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          discount: item.discount
        })),
        paymentMethod: method,
        tax: 0,
        discount: 0,
        createdBy: undefined
      }

      const order = await OrderService.create(orderRequest)

      toast.success(`Venta completada! Factura: ${order.invoiceNumber}`)
      setLastInvoice(order.invoiceNumber)

      setCart([])
      setSelectedCustomer(null)
      setIsPaymentModalOpen(false)

      const updatedProducts = await ProductService.getAll()
      setProducts(updatedProducts)

    } catch (error: any) {
      console.error('Error al procesar pago:', error)
      toast.error(error.message || 'Error al procesar la venta')
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
    setSelectedItemId(null)
  }

  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  )

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <PosHeader
          invoiceNo={lastInvoice || 'NUEVO'}
          lineCount={cart.length}
          totalQty={cart.reduce((sum, item) => sum + item.quantity, 0)}
          customerName={selectedCustomer?.name || 'Mostrador'}
          onCustomerClick={() => setIsCustomerModalOpen(true)}
        />

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Cargando productos...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                >
                  <h3 className="font-semibold text-sm mb-1">{product.productName}</h3>
                  <p className="text-xs text-gray-500 mb-2">Sin categoría</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-600">
                      ${product.salePrice || product.price}
                    </span>
                    {product.manageStock && (
                      <span className="text-xs text-gray-500">
                        Stock: {product.inventoryQty || 0}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <FunctionKeys onClearCart={clearCart} />
      </div>

      <div className="w-[422px] flex flex-col h-screen bg-white shadow-lg">
        <TransactionTable
          cart={cart}
          selectedItemId={selectedItemId}
          onQuantityChange={updateCartItemQuantity}
          onDiscountChange={updateCartItemDiscount}
          onRemove={removeFromCart}
          onSelectItem={setSelectedItemId}
        />

        <div className="flex-1 w-full">
          <RightPanel
            subtotal={calculateSubtotal()}
            discount={calculateTotalDiscount()}
            total={calculateTotal()}
            onCheckout={() => setIsPaymentModalOpen(true)}
          />
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={calculateTotal()}
        onConfirm={processPayment}
      />

      <CustomerSelectionModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={(customer: Contact) => {
          setSelectedCustomer(customer)
          setIsCustomerModalOpen(false)
        }}
        tenantId={getTenantId() || 0}
      />
    </div>
  )
}

export default PosComponent
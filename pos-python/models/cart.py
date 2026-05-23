class CartItem:
    def __init__(self, product, quantity=1, discount=0.0):
        self.product = product
        self.quantity = int(quantity)
        self.discount = float(discount)  # Descuento total asignado a esta línea

    @property
    def unit_price(self):
        """Retorna el precio de venta unitario actual (sale_price si existe, sino price)."""
        return self.product.sale_price if self.product.sale_price is not None else self.product.price

    @property
    def subtotal(self):
        """Retorna el subtotal de la línea antes de descuentos."""
        return self.unit_price * self.quantity

    @property
    def total(self):
        """Retorna el total de la línea aplicando el descuento asignado."""
        return max(0.0, self.subtotal - self.discount)

class Cart:
    def __init__(self):
        self.items = []
        self.global_discount_percent = 0.0
        self.global_discount_fixed = 0.0
        self.tax_percent = 0.0  # Porcentaje de IVA por ejemplo
        self.customer = None

    def clear(self):
        """Limpia todo el carrito."""
        self.items = []
        self.global_discount_percent = 0.0
        self.global_discount_fixed = 0.0
        self.customer = None

    def add_item(self, product, quantity=1):
        """Agrega un producto al carrito o incrementa su cantidad si ya existe."""
        for item in self.items:
            if item.product.id == product.id:
                item.quantity += quantity
                return item
        
        new_item = CartItem(product, quantity)
        self.items.append(new_item)
        return new_item

    def remove_item(self, product_id):
        """Elimina un producto del carrito."""
        self.items = [item for item in self.items if item.product.id != product_id]

    def update_quantity(self, product_id, quantity):
        """Actualiza la cantidad de un ítem."""
        for item in self.items:
            if item.product.id == product_id:
                item.quantity = max(1, int(quantity))
                break

    def update_discount(self, product_id, discount):
        """Actualiza el descuento acumulado de un ítem en particular."""
        for item in self.items:
            if item.product.id == product_id:
                item.discount = max(0.0, float(discount))
                break

    @property
    def line_count(self):
        """Retorna la cantidad de líneas/ítems diferentes."""
        return len(self.items)

    @property
    def total_quantity(self):
        """Retorna la suma total de unidades físicas agregadas al carrito."""
        return sum(item.quantity for item in self.items)

    @property
    def item_subtotal(self):
        """Suma de todos los subtotales de línea antes de descuentos."""
        return sum(item.subtotal for item in self.items)

    @property
    def item_discounts(self):
        """Suma de los descuentos individuales aplicados a nivel de ítem."""
        return sum(item.discount for item in self.items)

    @property
    def subtotal(self):
        """Subtotal antes de impuestos y descuentos globales."""
        return self.item_subtotal

    @property
    def discount(self):
        """Descuento total acumulado (ítems + descuento global fijo + descuento global porcentual)."""
        global_pct_val = self.item_subtotal * (self.global_discount_percent / 100.0)
        return round(self.item_discounts + self.global_discount_fixed + global_pct_val, 2)

    @property
    def tax(self):
        """Impuesto calculado sobre el subtotal neto después de aplicar el descuento."""
        net_amount = max(0.0, self.subtotal - self.discount)
        return round(net_amount * (self.tax_percent / 100.0), 2)

    @property
    def total(self):
        """Total definitivo de la venta."""
        net_amount = max(0.0, self.subtotal - self.discount)
        return round(net_amount + self.tax, 2)

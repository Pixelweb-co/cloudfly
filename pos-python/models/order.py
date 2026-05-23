class OrderItem:
    def __init__(self, product_id, product_name, quantity, price, discount, total):
        self.product_id = product_id
        self.product_name = product_name
        self.quantity = int(quantity)
        self.price = float(price)
        self.discount = float(discount)
        self.total = float(total)

    @classmethod
    def from_dict(cls, data):
        return cls(
            product_id=data.get('product_id'),
            product_name=data.get('product_name'),
            quantity=data.get('quantity'),
            price=data.get('price'),
            discount=data.get('discount', 0.0),
            total=data.get('total')
        )

class Order:
    def __init__(self, id, invoice_number, customer_id, customer_name, subtotal, discount, tax, total, payment_method, created_by, created_at, is_synced, items=None):
        self.id = id
        self.invoice_number = invoice_number
        self.customer_id = customer_id
        self.customer_name = customer_name
        self.subtotal = float(subtotal)
        self.discount = float(discount)
        self.tax = float(tax)
        self.total = float(total)
        self.payment_method = payment_method
        self.created_by = created_by
        self.created_at = created_at
        self.is_synced = int(is_synced)
        self.items = items if items is not None else []

    @classmethod
    def from_dict(cls, data):
        items_data = data.get('items', [])
        items = [OrderItem.from_dict(item) for item in items_data]
        return cls(
            id=data.get('id'),
            invoice_number=data.get('invoice_number'),
            customer_id=data.get('customer_id'),
            customer_name=data.get('customer_name', "Mostrador"),
            subtotal=data.get('subtotal'),
            discount=data.get('discount', 0.0),
            tax=data.get('tax', 0.0),
            total=data.get('total'),
            payment_method=data.get('payment_method'),
            created_by=data.get('created_by'),
            created_at=data.get('created_at'),
            is_synced=data.get('is_synced', 0),
            items=items
        )

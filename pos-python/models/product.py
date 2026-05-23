class Product:
    def __init__(self, id, backend_id, name, sku, price, sale_price=None, category=None, type="PRODUCT", duration_mins=0, stock=0, manage_stock=1, image_path=None):
        self.id = id
        self.backend_id = backend_id
        self.name = name
        self.sku = sku
        self.price = float(price)
        self.sale_price = float(sale_price) if sale_price is not None else float(price)
        self.category = category
        self.type = type  # 'PRODUCT' o 'SERVICE'
        self.duration_mins = int(duration_mins)
        self.stock = int(stock)
        self.manage_stock = int(manage_stock)
        self.image_path = image_path

    @classmethod
    def from_dict(cls, data):
        """Crea un objeto Product a partir de un diccionario."""
        return cls(
            id=data.get('id'),
            backend_id=data.get('backend_id'),
            name=data.get('name'),
            sku=data.get('sku'),
            price=data.get('price'),
            sale_price=data.get('sale_price'),
            category=data.get('category'),
            type=data.get('type', 'PRODUCT'),
            duration_mins=data.get('duration_mins', 0),
            stock=data.get('stock', 0),
            manage_stock=data.get('manage_stock', 1),
            image_path=data.get('image_path')
        )

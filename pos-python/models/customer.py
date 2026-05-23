class Customer:
    def __init__(self, id, backend_id, name, phone=None, email=None, address=None, points=0):
        self.id = id
        self.backend_id = backend_id
        self.name = name
        self.phone = phone
        self.email = email
        self.address = address
        self.points = int(points)

    @classmethod
    def from_dict(cls, data):
        """Crea un objeto Customer a partir de un diccionario."""
        return cls(
            id=data.get('id'),
            backend_id=data.get('backend_id'),
            name=data.get('name'),
            phone=data.get('phone'),
            email=data.get('email'),
            address=data.get('address'),
            points=data.get('points', 0)
        )

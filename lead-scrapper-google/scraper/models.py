from dataclasses import asdict, dataclass, fields


@dataclass
class Lead:
    nombre: str = ""
    telefono: str = ""
    whatsapp: str = ""
    email: str = ""
    sitio_web: str = ""
    fuente: str = ""
    titulo: str = ""
    ciudad: str = ""


def lead_fieldnames() -> list[str]:
    return [f.name for f in fields(Lead)]


def lead_to_dict(lead: Lead) -> dict:
    return asdict(lead)

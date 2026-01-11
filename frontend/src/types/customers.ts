export interface CustomersType {
    id?: number
    name?: string
    nit?: string
    phone?: string
    email?: string
    address?: string
    contact?: string
    position?: string
    type?: string
    status?: boolean | string
    businessType?: string
    businessDescription?: string

    // Contrato
    contrato?: {
        fechaInicio?: string
        fechaFinal?: string
        descripcionContrato?: string
    }

    // DIAN
    esEmisorFE?: boolean
    esEmisorPrincipal?: boolean
    tipoDocumentoDian?: string
    digitoVerificacion?: string
    razonSocial?: string
    nombreComercial?: string
    responsabilidadesFiscales?: string
    regimenFiscal?: string
    codigoDaneDepartamento?: string
    codigoDaneCiudad?: string
    departamentoDian?: string
    ciudadDian?: string
    paisCodigo?: string
    paisNombre?: string
    emailFacturacionDian?: string
    sitioWeb?: string
}

export interface DaneCode {
    codigo: string
    nombre: string
}

// Alias para compatibilidad con otros componentes
export type Customer = CustomersType

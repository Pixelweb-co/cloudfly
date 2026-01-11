/**
 * Customer interface with full DIAN support for electronic invoicing
 */
export interface Customer {
    // ========== BASIC FIELDS ==========
    id: number
    name: string
    nit: string | null
    phone: string | null
    email: string | null
    address: string | null
    contact: string | null
    position: string | null
    type: string | null
    status: boolean | null
    logoUrl: string | null
    dateRegister: string | null
    businessType: 'VENTAS' | 'AGENDAMIENTO' | 'SUSCRIPCION' | 'MIXTO' | null
    businessDescription: string | null

    // ========== DIAN FIELDS FOR ELECTRONIC INVOICING ==========

    // Tax Identification
    tipoDocumentoDian?: string | null // 13=CC, 22=CE, 31=NIT, 41=Passport
    digitoVerificacion?: string | null // Verification digit (for NIT)

    // Legal Names
    razonSocial?: string | null // Legal registered name
    nombreComercial?: string | null // Commercial name

    // Fiscal Responsibilities
    responsabilidadesFiscales?: string | null // Comma-separated: R-99-PN, O-13, etc
    regimenFiscal?: string | null // COMUN, SIMPLE, ESPECIAL
    obligacionesDian?: string | null // DIAN obligations

    // Geographic Location (DANE)
    codigoDaneCiudad?: string | null // City DANE code (5 digits)
    ciudadDian?: string | null // City name
    codigoDaneDepartamento?: string | null // Department DANE code (2 digits)
    departamentoDian?: string | null // Department name
    paisCodigo?: string | null // Country code (CO)
    paisNombre?: string | null // Country name
    codigoPostal?: string | null // Postal code

    // Economic Activity
    actividadEconomicaCiiu?: string | null // CIIU code
    actividadEconomicaDescripcion?: string | null // Activity description

    // Electronic Invoicing Contact
    emailFacturacionDian?: string | null // Invoice email
    sitioWeb?: string | null // Website

    // Legal Representative
    representanteLegalNombre?: string | null
    representanteLegalTipoDoc?: string | null
    representanteLegalNumeroDoc?: string | null

    // Electronic Invoicing Configuration
    esEmisorFE?: boolean | null // Is electronic invoice issuer
    esEmisorPrincipal?: boolean | null // Is principal issuer for tenant

    // Audit
    createdAt?: string | null
    updatedAt?: string | null
}

/**
 * DANE geographic codes for Colombia
 */
export interface DaneCode {
    id?: number
    tipo: 'DEPARTAMENTO' | 'CIUDAD'
    codigo: string
    nombre: string
    codigoDepartamento?: string | null // Only for cities
    activo?: boolean
    createdAt?: string
    updatedAt?: string
}

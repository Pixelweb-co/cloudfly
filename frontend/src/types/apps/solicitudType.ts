export interface SolicitudType {
  idSolicitud?: number // ID único de la solicitud
  fecha?: string // Fecha en formato string (YYYY-MM-DD o similar)
  hora?: string // Hora en formato string (HH:mm)
  equipo?: string // Identificador del equipo relacionado
  entidad?: string // Identificador de la entidad relacionada
  status?: statusd // Estado de la solicitud (puede ser un código, e.g., 'A', 'P', etc.)
  tipoServicio?: string // ID del tipo de servicio relacionado
  nombreAsig?:string
  nombreEntidad?:string
  nombreTipoServicio?:string
  nombreEquipo?:string
  estadoSolicitud?: string // Objeto de tipo EstadoSolicitud (opcional)
  nombreEstadoSolicitud?:string
  descripcion?:string
  asig?:string
  fchasg?:string
  horasg?:string
}

interface statusd {
  id?:number
  nombre?:string
}
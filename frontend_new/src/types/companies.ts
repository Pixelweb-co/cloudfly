export interface CompanyDTO {
  id: number;
  tenantId: number;
  name: string;
  nit: string;
  address: string;
  phone: string;
  logoUrl: string;
  status: boolean;
  isPrincipal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCreateRequest {
  name: string;
  nit: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  status?: boolean;
  isPrincipal?: boolean;
}

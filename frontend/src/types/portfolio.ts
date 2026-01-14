export type PortfolioDocumentType = 'RECEIVABLE' | 'PAYABLE';
export type PortfolioStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';
export type PortfolioPaymentType = 'INCOMING' | 'OUTGOING';

export interface PortfolioDocument {
    id: number;
    tenantId: number;
    contactId: number;
    contactName?: string;

    type: PortfolioDocumentType;
    documentSource: string; // 'INVOICE', etc.
    status: PortfolioStatus;
    documentNumber: string;

    issueDate: string; // ISO Date
    dueDate: string; // ISO Date

    totalAmount: number;
    balance: number;

    invoiceId?: number;
    notes?: string;
}

export interface PortfolioPayment {
    id: number;
    tenantId: number;
    contactId: number;

    type: PortfolioPaymentType;
    paymentDate: string;
    amount: number;
    unappliedAmount: number;

    paymentMethod?: string;
    reference?: string;
    notes?: string;
    status: string;
}

export interface CreatePaymentRequest {
    tenantId: number;
    contactId: number;
    type: PortfolioPaymentType;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    applications?: PaymentApplicationRequest[];
}

export interface PaymentApplicationRequest {
    documentId: number;
    amount: number;
}

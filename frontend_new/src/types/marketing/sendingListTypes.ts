export interface SendingList {
  id: number;
  tenantId: number;
  companyId: number;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  totalContacts: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendingListContact {
  id: number;
  sendingListId: number;
  contactId: number;
  status: 'ACTIVE' | 'UNSUBSCRIBED' | 'BOUNCED';
  addedAt: string;
}

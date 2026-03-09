
import {ProductType} from './productType';

export interface CartItem extends ProductType {
  quantity: number;
  discount: number; // Added for line-item discount
}

export interface Order {
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  PAYTM = 'PAYTM',
  GPAY = 'GPAY',
  WALLET = 'WALLET',
  // Fix: Added QR as it is used in PaymentModal
  QR = 'QR'
}

export interface Category {
  id: string;
  name: string;
  icon?: React.ReactNode;
}
export interface Product {
  id: string;
  name: string;
  category: 'pipa' | 'linha' | 'rabiola' | 'acessorio';
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
  timestamp: number;
  profit: number;
}

export interface Transaction {
  id: string;
  type: 'receita' | 'despesa';
  amount: number;
  description: string;
  category: string;
  timestamp: number;
}

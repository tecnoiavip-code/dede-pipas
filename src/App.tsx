/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Settings, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  AlertTriangle,
  CreditCard,
  Banknote,
  QrCode,
  ChevronRight,
  Download,
  Filter,
  X,
  Share2,
  Instagram,
  Facebook,
  MessageCircle,
  ExternalLink,
  Heart,
  MessageSquare,
  Send,
  Megaphone,
  Edit2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from './firebase';
import { cn } from './lib/utils';
import { Product, Sale, Transaction, SaleItem } from './types';

const Kite = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2L5 12l7 10 7-10-7-10z" />
    <path d="M12 2v20" />
    <path d="M5 12h14" />
    <path d="M12 22c0-3 2-4 4-4" />
  </svg>
);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  state: { hasError: boolean, error: Error | null } = { hasError: false, error: null };
  props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Ocorreu um erro inesperado.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) message = `Erro no Banco de Dados: ${parsed.error}`;
      } catch {
        message = this.state.error?.message || message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full mx-auto flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Ops! Algo deu errado</h2>
            <p className="text-slate-600">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-all"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Mock Initial Data ---
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Pipa Raia 40x40', category: 'pipa', price: 2.50, cost: 1.20, stock: 150, minStock: 50 },
  { id: '2', name: 'Pipa Brit 50x50', category: 'pipa', price: 4.00, cost: 2.00, stock: 80, minStock: 30 },
  { id: '3', name: 'Linha 10 Corrente 500yd', category: 'linha', price: 15.00, cost: 8.50, stock: 25, minStock: 10 },
  { id: '4', name: 'Rabiola de Seda 10m', category: 'rabiola', price: 3.50, cost: 1.50, stock: 200, minStock: 40 },
  { id: '5', name: 'Carretilha Madeira G', category: 'acessorio', price: 45.00, cost: 25.00, stock: 5, minStock: 3 },
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>({
    uid: 'public-user',
    email: 'public@dedepipas.com',
    displayName: 'Usuário Público',
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    providerId: 'google.com',
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => '',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({})
  } as any);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>('admin');
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'inventory' | 'finance' | 'marketing' | 'settings'>('dashboard');
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('week');
  const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string }>({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'selecting' | 'pix_qr' | 'processing' | 'success'>('idle');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormInputs, setProductFormInputs] = useState({
    price: '',
    cost: '',
    stock: '',
    minStock: ''
  });
  const [productFormData, setProductFormData] = useState<Partial<Product>>({
    name: '',
    category: 'pipa',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 0
  });

  const [settings, setSettings] = useState({
    storeName: 'Dedé Pipas',
    ownerName: 'Dedé',
    address: 'Rua das Pipas, 123 - São Paulo, SP',
    phone: '(11) 98765-4321',
    notifications: true,
    darkMode: false,
    pixKey: '',
    pixName: 'Dedé Pipas',
    pixCity: 'SAO PAULO',
    enablePixQR: false
  });

  // --- PIX Logic ---
  const generatePixPayload = (amount: number) => {
    if (!settings.pixKey) return '';
    
    const crc16 = (data: string) => {
      let crc = 0xFFFF;
      for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
          else crc <<= 1;
        }
      }
      return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    };

    const formatField = (id: string, value: string) => id + value.length.toString().padStart(2, '0') + value;
    const merchantAccountInfo = formatField('00', 'br.gov.bcb.pix') + formatField('01', settings.pixKey);
    
    let payload = '000201';
    payload += formatField('26', merchantAccountInfo);
    payload += '52040000';
    payload += '5303986';
    if (amount > 0) payload += formatField('54', amount.toFixed(2));
    payload += '5802BR';
    payload += formatField('59', settings.pixName.substring(0, 25).toUpperCase());
    payload += formatField('60', settings.pixCity.substring(0, 15).toUpperCase());
    payload += '62070503***';
    payload += '6304';
    
    return payload + crc16(payload);
  };

  // --- Social Sharing Logic ---
  const shareProduct = (product: Product, platform: 'whatsapp' | 'facebook' | 'instagram') => {
    const text = `Confira a ${product.name} na Dedé Pipas! Apenas R$ ${product.price.toFixed(2)}.`;
    const url = window.location.href;
    
    let shareUrl = '';
    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    } else if (platform === 'instagram') {
      // Instagram doesn't have a direct share URL for web, so we copy to clipboard or open profile
      navigator.clipboard.writeText(`${text} ${url}`);
      alert('Link copiado para o clipboard! Abra o Instagram para compartilhar.');
      shareUrl = 'https://www.instagram.com/';
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const shareApp = (platform: 'whatsapp' | 'facebook' | 'instagram') => {
    const text = `A Dedé Pipas agora tem um sistema de gestão profissional! Confira:`;
    const url = window.location.href;
    
    let shareUrl = '';
    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert('Link do app copiado! Compartilhe no seu Instagram.');
      shareUrl = 'https://www.instagram.com/';
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  // --- Product Management Logic ---
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData(product);
      setProductFormInputs({
        price: String(product.price).replace('.', ','),
        cost: String(product.cost).replace('.', ','),
        stock: String(product.stock),
        minStock: String(product.minStock)
      });
    } else {
      setEditingProduct(null);
      setProductFormData({
        name: '',
        category: 'pipa',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 0
      });
      setProductFormInputs({
        price: '',
        cost: '',
        stock: '',
        minStock: ''
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const path = 'products';
    try {
      if (editingProduct) {
        await setDoc(doc(db, path, editingProduct.id), { ...editingProduct, ...productFormData });
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, path, id), { ...productFormData, id });
      }
      setIsProductModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const path = `products/${productId}`;
    try {
      await deleteDoc(doc(db, 'products', productId));
      setCart(prev => prev.filter(item => item.productId !== productId));
      setProductToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Firebase Auth and Real-time Listeners (Bypassed for public access)
  useEffect(() => {
    // Mocking auth readiness
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    // Mocking user role
    setUserRole('admin');
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          const config = (db as any)._databaseId;
          const projectId = config?.projectId || 'Desconhecido';
          const databaseId = config?.databaseId || '(default)';
          console.error(`Erro de Configuração Firebase: Não foi possível conectar ao projeto "${projectId}", banco "${databaseId}". Verifique se o ID do projeto está correto no Firebase Console.`);
          alert(`ERRO DE CONEXÃO:\n\nO app não conseguiu conectar ao Firebase.\n\nProjeto: ${projectId}\nBanco: ${databaseId}\n\nVerifique se o ID do projeto está correto no seu Firebase Console.`);
        }
      }
    };
    testConnection();

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Product);
      setProducts(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('timestamp', 'desc')), (snapshot) => {
      setSales(snapshot.docs.map(doc => doc.data() as Sale));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sales'));

    const unsubTransactions = onSnapshot(query(collection(db, 'transactions'), orderBy('timestamp', 'desc')), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));

    return () => {
      unsubProducts();
      unsubSales();
      unsubTransactions();
    };
  }, [user, isAuthReady, userRole]);

  // Data Migration from localStorage
  useEffect(() => {
    if (!isAuthReady) return;

    const migrateData = async () => {
      const isMigrated = localStorage.getItem('dede_pipas_migrated');
      if (isMigrated === 'true') return;

      const localProducts = localStorage.getItem('dede_pipas_products');
      const localSales = localStorage.getItem('dede_pipas_sales');
      const localTransactions = localStorage.getItem('dede_pipas_transactions');

      const batch = writeBatch(db);
      let hasData = false;

      if (localProducts) {
        const data = JSON.parse(localProducts);
        data.forEach((p: Product) => {
          batch.set(doc(db, 'products', p.id), p);
          hasData = true;
        });
      }

      if (localSales) {
        const data = JSON.parse(localSales);
        data.forEach((s: Sale) => {
          batch.set(doc(db, 'sales', s.id), { ...s, uid: user.uid });
          hasData = true;
        });
      }

      if (localTransactions) {
        const data = JSON.parse(localTransactions);
        data.forEach((t: Transaction) => {
          batch.set(doc(db, 'transactions', t.id), { ...t, uid: user.uid });
          hasData = true;
        });
      }

      if (hasData) {
        try {
          await batch.commit();
          localStorage.setItem('dede_pipas_migrated', 'true');
          console.log('Data migrated to Firebase successfully');
        } catch (error) {
          console.error('Migration failed:', error);
        }
      } else {
        localStorage.setItem('dede_pipas_migrated', 'true');
      }
    };

    migrateData();
  }, [user, isAuthReady]);

  // Save settings to localStorage (settings are still local for now as per blueprint)
  useEffect(() => {
    const savedSettings = localStorage.getItem('dede_pipas_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem('dede_pipas_settings', JSON.stringify(settings));
  }, [settings]);

  // --- POS Logic ---
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } 
            : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, quantity: 1, price: product.price }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = Math.max(1, Math.min(item.quantity + delta, product?.stock || 999));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleExportSpreadsheet = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)'];
    const rows = transactions.map(tx => [
      format(tx.timestamp, 'dd/MM/yyyy HH:mm'),
      tx.type === 'receita' ? 'Receita' : 'Despesa',
      tx.description,
      tx.category,
      tx.amount.toFixed(2).replace('.', ',')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financeiro_dede_pipas_${format(new Date(), 'dd_MM_yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const finalizeSale = async (method: Sale['paymentMethod']) => {
    if (method === 'pix' && settings.enablePixQR && settings.pixKey) {
      setPaymentStep('pix_qr');
      return;
    }
    setPaymentStep('processing');
    
    try {
      const saleId = Math.random().toString(36).substr(2, 9);
      const newSale: Sale = {
        id: saleId,
        items: [...cart],
        total: cartTotal,
        paymentMethod: method,
        timestamp: Date.now(),
        profit: cart.reduce((sum, item) => {
          const product = products.find(p => p.id === item.productId);
          return sum + ((item.price - (product?.cost || 0)) * item.quantity);
        }, 0)
      };

      const batch = writeBatch(db);
      
      // Add sale
      batch.set(doc(db, 'sales', saleId), { ...newSale, uid: user.uid });

      // Update stock
      cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          batch.update(doc(db, 'products', product.id), {
            stock: product.stock - item.quantity
          });
        }
      });

      // Add transaction
      const txId = Math.random().toString(36).substr(2, 9);
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        type: 'receita',
        amount: cartTotal,
        description: `Venda #${saleId.toUpperCase()}`,
        category: 'Vendas',
        timestamp: Date.now(),
        uid: user.uid
      });

      await batch.commit();

      setCart([]);
      setPaymentStep('success');
      setTimeout(() => setPaymentStep('idle'), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales/transactions/products');
    }
  };

  // --- Financial Stats ---
  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const todaySales = sales.filter(s => s.timestamp >= today);
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    return {
      todayRevenue: todaySales.reduce((sum, s) => sum + s.total, 0),
      todaySalesCount: todaySales.length,
      totalRevenue,
      totalProfit,
      lowStockCount
    };
  }, [sales, products]);

  const chartData = useMemo(() => {
    // Last 7 days
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = d.setHours(0,0,0,0);
      const dayEnd = d.setHours(23,59,59,999);
      const daySales = sales.filter(s => s.timestamp >= dayStart && s.timestamp <= dayEnd);
      data.push({
        name: format(d, 'EEE', { locale: ptBR }),
        vendas: daySales.reduce((sum, s) => sum + s.total, 0),
        lucro: daySales.reduce((sum, s) => sum + s.profit, 0)
      });
    }
    return data;
  }, [sales]);

  const reportData = useMemo(() => {
    let startDate = new Date();
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (reportPeriod === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (reportPeriod === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (reportPeriod === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (reportPeriod === 'custom') {
      startDate = new Date(customDateRange.start);
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    }
    startDate.setHours(0, 0, 0, 0);

    const filteredSales = sales.filter(s => s.timestamp >= startDate.getTime() && s.timestamp <= endDate.getTime());
    
    // Group by day for the chart
    const days: { [key: string]: { date: Date, total: number, profit: number } } = {};
    let current = new Date(startDate);
    while (current <= endDate) {
      const key = format(current, 'yyyy-MM-dd');
      days[key] = { date: new Date(current), total: 0, profit: 0 };
      current.setDate(current.getDate() + 1);
    }

    filteredSales.forEach(s => {
      const key = format(s.timestamp, 'yyyy-MM-dd');
      if (days[key]) {
        days[key].total += s.total;
        days[key].profit += s.profit;
      }
    });

    const chart = Object.values(days).map(d => ({
      name: format(d.date, reportPeriod === 'year' ? 'MMM' : 'dd/MM', { locale: ptBR }),
      vendas: d.total,
      lucro: d.profit
    }));

    return {
      sales: filteredSales,
      totalRevenue: filteredSales.reduce((sum, s) => sum + s.total, 0),
      totalProfit: filteredSales.reduce((sum, s) => sum + s.profit, 0),
      count: filteredSales.length,
      chart
    };
  }, [sales, reportPeriod, customDateRange]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Remove login check to show app directly
  /*
  if (!user) {
    ...
  }
  */

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      {/* Sidebar / Bottom Nav on Mobile */}
      <aside className="fixed bottom-0 w-full md:relative md:w-64 bg-sky-700 text-white flex flex-row md:flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-xl z-50 md:z-20 flex-shrink-0">
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-sky-600/50">
          <div className="bg-white p-2 rounded-xl shadow-inner">
            <Kite className="text-sky-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Dedé Pipas</h1>
            <p className="text-sky-200 text-xs uppercase tracking-widest font-semibold">Gestão Profissional</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-row md:flex-col p-2 md:p-4 gap-1 md:space-y-2 overflow-x-auto md:overflow-visible no-scrollbar">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
              activeTab === 'dashboard' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
            )}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] md:text-base">Painel</span>
          </button>
          <button 
            onClick={() => setActiveTab('pos')}
            className={cn(
              "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
              activeTab === 'pos' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
            )}
          >
            <ShoppingCart size={20} />
            <span className="text-[10px] md:text-base">Caixa</span>
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
              activeTab === 'inventory' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
            )}
          >
            <Package size={20} />
            <span className="text-[10px] md:text-base">Estoque</span>
          </button>
          <button 
            onClick={() => setActiveTab('finance')}
            className={cn(
              "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
              activeTab === 'finance' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
            )}
          >
            <TrendingUp size={20} />
            <span className="text-[10px] md:text-base">Finanças</span>
          </button>
          <button 
            onClick={() => setActiveTab('marketing')}
            className={cn(
              "flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 min-w-[72px] md:min-w-0",
              activeTab === 'marketing' ? "bg-white/20 md:bg-white text-white md:text-sky-700 shadow-sm md:shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-200 md:text-sky-100"
            )}
          >
            <Megaphone size={20} />
            <span className="text-[10px] md:text-base">Mkt</span>
          </button>
          
          {/* Settings button visible only on mobile in the nav */}
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "md:hidden flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[72px]",
              activeTab === 'settings' ? "bg-white/20 text-white shadow-sm font-bold" : "hover:bg-sky-600/50 text-sky-200"
            )}
          >
            <Settings size={20} />
            <span className="text-[10px]">Config</span>
          </button>
        </nav>

        <div className="hidden md:block p-4 border-t border-sky-600/50">
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'settings' ? "bg-white text-sky-700 shadow-lg font-bold" : "hover:bg-sky-600/50 text-sky-100"
            )}
          >
            <Settings size={20} />
            Configurações
          </button>

          {deferredPrompt && (
            <button 
              onClick={handleInstallApp}
              className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500 text-white shadow-lg font-bold hover:bg-emerald-600 transition-all animate-bounce"
            >
              <Download size={20} />
              Instalar App
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pb-[72px] md:pb-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-slate-500 font-medium capitalize">
              {activeTab === 'dashboard' && 'Painel Administrativo'}
              {activeTab === 'pos' && 'Caixa Aberto'}
              {activeTab === 'inventory' && 'Controle de Estoque'}
              {activeTab === 'finance' && 'Relatórios Financeiros'}
              {activeTab === 'marketing' && 'Marketing & Redes Sociais'}
              {activeTab === 'settings' && 'Configurações do Sistema'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {stats.lowStockCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium border border-amber-100">
                <AlertTriangle size={16} />
                <span className="hidden md:inline">{stats.lowStockCount} itens com estoque baixo</span>
                <span className="md:hidden">{stats.lowStockCount}</span>
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold border-2 border-white shadow-sm">
              DP
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 border-l-4 border-l-sky-500">
                  <p className="text-slate-500 text-sm font-medium mb-1">Vendas Hoje</p>
                  <h3 className="text-2xl font-bold text-slate-800">R$ {stats.todayRevenue.toFixed(2)}</h3>
                  <p className="text-xs text-sky-600 mt-2 font-semibold">{stats.todaySalesCount} transações</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-emerald-500">
                  <p className="text-slate-500 text-sm font-medium mb-1">Lucro Total</p>
                  <h3 className="text-2xl font-bold text-slate-800">R$ {stats.totalProfit.toFixed(2)}</h3>
                  <p className="text-xs text-emerald-600 mt-2 font-semibold">Margem saudável</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-pipa-orange">
                  <p className="text-slate-500 text-sm font-medium mb-1">Faturamento Total</p>
                  <h3 className="text-2xl font-bold text-slate-800">R$ {stats.totalRevenue.toFixed(2)}</h3>
                  <p className="text-xs text-pipa-orange mt-2 font-semibold">Acumulado</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-amber-500">
                  <p className="text-slate-500 text-sm font-medium mb-1">Alertas de Estoque</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.lowStockCount}</h3>
                  <p className="text-xs text-amber-600 mt-2 font-semibold">Reposição necessária</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="font-bold text-slate-800 text-lg">Desempenho Semanal</h4>
                    <div className="flex gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-sky-500"></div> Vendas</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Lucro</div>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="vendas" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-8">
                  <h4 className="font-bold text-slate-800 text-lg mb-8">Últimas Vendas</h4>
                  <div className="space-y-6">
                    {sales.slice(0, 5).map(sale => (
                      <div key={sale.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                            {sale.paymentMethod === 'dinheiro' && <Banknote size={18} />}
                            {(sale.paymentMethod === 'cartao_credito' || sale.paymentMethod === 'cartao_debito') && <CreditCard size={18} />}
                            {sale.paymentMethod === 'pix' && <QrCode size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">R$ {sale.total.toFixed(2)}</p>
                            <p className="text-xs text-slate-500">{format(sale.timestamp, 'HH:mm')} • {sale.items.length} itens</p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-sky-400 transition-colors" />
                      </div>
                    ))}
                    {sales.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-slate-400 text-sm">Nenhuma venda hoje</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setActiveTab('finance')}
                    className="w-full mt-8 py-3 text-sky-600 text-sm font-bold hover:bg-sky-50 rounded-xl transition-colors"
                  >
                    Ver todo histórico
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pos' && (
            <div className="flex flex-col lg:flex-row gap-4 md:gap-8 h-full animate-in slide-in-from-right duration-500 overflow-y-auto lg:overflow-hidden pb-4 md:pb-0">
              {/* Product Selection */}
              <div className="flex-1 flex flex-col gap-4 md:gap-6 min-h-[500px] lg:min-h-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar produto por nome ou categoria..." 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-visible lg:overflow-y-auto pb-8">
                  {products.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={cn(
                        "group p-4 bg-white border border-slate-200 rounded-2xl text-left transition-all hover:shadow-md hover:border-sky-200 relative overflow-hidden",
                        product.stock <= 0 && "opacity-50 grayscale cursor-not-allowed"
                      )}
                    >
                      <div className="mb-3">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-md">
                          {product.category}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-sky-700 transition-colors">{product.name}</h5>
                      <p className="text-lg font-black text-slate-900">R$ {product.price.toFixed(2)}</p>
                      <p className={cn(
                        "text-[10px] mt-2 font-semibold",
                        product.stock <= product.minStock ? "text-amber-600" : "text-slate-400"
                      )}>
                        Estoque: {product.stock}
                      </p>
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center">
                          <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Esgotado</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart / Checkout */}
              <div className="w-full lg:w-[400px] flex flex-col gap-6 flex-shrink-0 min-h-[400px] lg:min-h-0">
                <div className="glass-card flex-1 flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <ShoppingCart size={18} className="text-sky-600" />
                      Carrinho
                    </h4>
                    <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-1 rounded-full">
                      {cart.reduce((sum, i) => sum + i.quantity, 0)} itens
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.map(item => (
                      <div key={item.productId} className="flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-500">R$ {item.price.toFixed(2)} un.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <button 
                              onClick={() => updateCartQuantity(item.productId, -1)}
                              className="p-1 hover:bg-white hover:text-sky-600 rounded-md transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.productId, 1)}
                              className="p-1 hover:bg-white hover:text-sky-600 rounded-md transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.productId)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 opacity-40">
                        <ShoppingCart size={48} className="mb-4" />
                        <p className="text-sm font-medium">Seu carrinho está vazio</p>
                        <p className="text-xs">Adicione itens para começar</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Subtotal</span>
                      <span className="text-slate-800 font-bold">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xl">
                      <span className="text-slate-800 font-black">Total</span>
                      <span className="text-sky-700 font-black">R$ {cartTotal.toFixed(2)}</span>
                    </div>
                    
                    <button 
                      disabled={cart.length === 0}
                      onClick={() => setPaymentStep('selecting')}
                      className="w-full py-4 bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 hover:bg-sky-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                    >
                      Finalizar Venda
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-800">Gestão de Estoque</h3>
                <button 
                  onClick={() => handleOpenProductModal()}
                  className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-700 transition-all shadow-md"
                >
                  <Plus size={20} />
                  Novo Produto
                </button>
              </div>

              <div className="glass-card overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Produto</th>
                      <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Categoria</th>
                      <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Preço Venda</th>
                      <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Custo</th>
                      <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Estoque</th>
                      <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Status</th>
                      <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="p-6">
                          <p className="font-bold text-slate-800">{product.name}</p>
                          <p className="text-[10px] text-slate-400">ID: {product.id}</p>
                        </td>
                        <td className="p-6">
                          <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded-md capitalize">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-6 font-bold text-slate-800">R$ {product.price.toFixed(2)}</td>
                        <td className="p-6 text-slate-500">R$ {product.cost.toFixed(2)}</td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-bold",
                              product.stock <= product.minStock ? "text-amber-600" : "text-slate-800"
                            )}>
                              {product.stock}
                            </span>
                            <span className="text-[10px] text-slate-400">/ min {product.minStock}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          {product.stock <= 0 ? (
                            <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Esgotado</span>
                          ) : product.stock <= product.minStock ? (
                            <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Baixo</span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">OK</span>
                          )}
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenProductModal(product)}
                              className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Editar Produto"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => setProductToDelete(product.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Excluir Produto"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-2xl font-bold text-slate-800">Relatórios Financeiros</h3>
                <div className="flex flex-wrap gap-3">
                  <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                    <button 
                      onClick={() => setReportPeriod('week')}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                        reportPeriod === 'week' ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      Semana
                    </button>
                    <button 
                      onClick={() => setReportPeriod('month')}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                        reportPeriod === 'month' ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      Mês
                    </button>
                    <button 
                      onClick={() => setReportPeriod('year')}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                        reportPeriod === 'year' ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      Ano
                    </button>
                    <button 
                      onClick={() => setReportPeriod('custom')}
                      className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                        reportPeriod === 'custom' ? "bg-sky-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      Personalizado
                    </button>
                  </div>
                  <button 
                    onClick={handleExportSpreadsheet}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <Download size={16} />
                    Exportar Planilha
                  </button>
                </div>
              </div>

              {reportPeriod === 'custom' && (
                <div className="glass-card p-6 flex flex-wrap items-end gap-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Inicial</label>
                    <input 
                      type="date" 
                      value={customDateRange.start}
                      onChange={e => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Final</label>
                    <input 
                      type="date" 
                      value={customDateRange.end}
                      onChange={e => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-l-4 border-l-sky-500">
                  <p className="text-slate-500 text-sm font-medium mb-1">Vendas no Período</p>
                  <h3 className="text-2xl font-bold text-slate-800">{reportData.count}</h3>
                  <p className="text-xs text-sky-600 mt-2 font-semibold">Transações realizadas</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-emerald-500">
                  <p className="text-slate-500 text-sm font-medium mb-1">Faturamento no Período</p>
                  <h3 className="text-2xl font-bold text-slate-800">R$ {reportData.totalRevenue.toFixed(2)}</h3>
                  <p className="text-xs text-emerald-600 mt-2 font-semibold">Receita bruta</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-amber-500">
                  <p className="text-slate-500 text-sm font-medium mb-1">Lucro no Período</p>
                  <h3 className="text-2xl font-bold text-slate-800">R$ {reportData.totalProfit.toFixed(2)}</h3>
                  <p className="text-xs text-amber-600 mt-2 font-semibold">Resultado líquido</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8">
                  <h4 className="font-bold text-slate-800 text-lg mb-8">Desempenho de Vendas</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.chart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="vendas" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="lucro" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-8">
                  <h4 className="font-bold text-slate-800 text-lg mb-8">Fluxo de Caixa</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.chart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Line type="monotone" dataKey="vendas" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 glass-card p-8">
                  <h4 className="font-bold text-slate-800 text-lg mb-8">Vendas Detalhadas</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Data</th>
                          <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Itens</th>
                          <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Pagamento</th>
                          <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Total</th>
                          <th className="p-4 text-xs uppercase tracking-widest font-bold text-slate-500">Lucro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.sales.map(sale => (
                          <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-sm text-slate-600">{format(sale.timestamp, 'dd/MM/yyyy HH:mm')}</td>
                            <td className="p-4 text-sm text-slate-600">{sale.items.length} itens</td>
                            <td className="p-4">
                              <span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                                {sale.paymentMethod.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-800">R$ {sale.total.toFixed(2)}</td>
                            <td className="p-4 font-bold text-emerald-600">R$ {sale.profit.toFixed(2)}</td>
                          </tr>
                        ))}
                        {reportData.sales.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400 italic">Nenhuma venda encontrada para este período.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-800">Marketing & Presença Digital</h3>
                <div className="flex gap-3">
                  <button 
                    onClick={() => shareApp('whatsapp')}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm"
                  >
                    <MessageCircle size={16} />
                    Divulgar App
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Social Feed Mock */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Instagram size={20} className="text-pink-600" />
                        Feed Dedé Pipas (Instagram)
                      </h4>
                      <button className="text-sky-600 text-sm font-bold flex items-center gap-1 hover:underline">
                        Ver no App <ExternalLink size={14} />
                      </button>
                    </div>
                    
                    <div className="space-y-8">
                      {/* Mock Post 1 */}
                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-0.5">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold">DP</div>
                          </div>
                          <span className="text-sm font-bold text-slate-800">dedepipas_oficial</span>
                        </div>
                        <img 
                          src="https://picsum.photos/seed/kites/800/600" 
                          alt="Post" 
                          className="w-full aspect-video object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-4 text-slate-700">
                            <Heart size={24} className="hover:text-rose-500 cursor-pointer transition-colors" />
                            <MessageSquare size={24} className="hover:text-sky-500 cursor-pointer transition-colors" />
                            <Send size={24} className="hover:text-emerald-500 cursor-pointer transition-colors" />
                          </div>
                          <p className="text-sm text-slate-800">
                            <span className="font-bold mr-2">dedepipas_oficial</span>
                            Chegaram as novas Raia 40x40! Cores vibrantes e prontas para o combate. 🪁💨 #pipas #dedepipas #festival
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Há 2 horas</p>
                        </div>
                      </div>

                      {/* Mock Post 2 */}
                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-0.5">
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold">DP</div>
                          </div>
                          <span className="text-sm font-bold text-slate-800">dedepipas_oficial</span>
                        </div>
                        <img 
                          src="https://picsum.photos/seed/line/800/600" 
                          alt="Post" 
                          className="w-full aspect-video object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-4 text-slate-700">
                            <Heart size={24} className="hover:text-rose-500 cursor-pointer transition-colors" />
                            <MessageSquare size={24} className="hover:text-sky-500 cursor-pointer transition-colors" />
                            <Send size={24} className="hover:text-emerald-500 cursor-pointer transition-colors" />
                          </div>
                          <p className="text-sm text-slate-800">
                            <span className="font-bold mr-2">dedepipas_oficial</span>
                            Linha 10 Corrente em estoque! Garanta a sua antes que acabe. 🧵✨
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Há 1 dia</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promotion Tools */}
                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h4 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                      <Share2 size={20} className="text-sky-600" />
                      Compartilhamento Rápido
                    </h4>
                    <div className="space-y-4">
                      <button 
                        onClick={() => shareApp('whatsapp')}
                        className="w-full flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group hover:bg-emerald-100 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <MessageCircle className="text-emerald-600" />
                          <span className="font-bold text-emerald-800">WhatsApp</span>
                        </div>
                        <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                      
                      <button 
                        onClick={() => shareApp('facebook')}
                        className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl group hover:bg-blue-100 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Facebook className="text-blue-600" />
                          <span className="font-bold text-blue-800">Facebook</span>
                        </div>
                        <ChevronRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button 
                        onClick={() => shareApp('instagram')}
                        className="w-full flex items-center justify-between p-4 bg-pink-50 border border-pink-100 rounded-2xl group hover:bg-pink-100 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Instagram className="text-pink-600" />
                          <span className="font-bold text-pink-800">Instagram</span>
                        </div>
                        <ChevronRight size={16} className="text-pink-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  <div className="glass-card p-6 bg-sky-600 text-white">
                    <h4 className="font-bold text-lg mb-2">Dica de Marketing</h4>
                    <p className="text-sky-100 text-sm leading-relaxed">
                      Compartilhar seus produtos no WhatsApp aumenta em até 40% a chance de venda rápida. Use fotos reais dos seus produtos!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-800">Configurações</h3>
                <button 
                  onClick={() => {
                    if(confirm('Deseja realmente resetar todos os dados? Esta ação não pode ser desfeita.')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="text-rose-600 text-sm font-bold hover:bg-rose-50 px-4 py-2 rounded-xl transition-all"
                >
                  Resetar Sistema
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="glass-card p-8 space-y-6">
                    <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4">Informações da Loja</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nome da Loja</label>
                        <input 
                          type="text" 
                          value={settings.storeName}
                          onChange={e => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nome do Proprietário</label>
                        <input 
                          type="text" 
                          value={settings.ownerName}
                          onChange={e => setSettings(prev => ({ ...prev, ownerName: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-slate-700">Endereço</label>
                        <input 
                          type="text" 
                          value={settings.address}
                          onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Telefone / WhatsApp</label>
                        <input 
                          type="text" 
                          value={settings.phone}
                          onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-8 space-y-6">
                    <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4">Pagamentos & PIX</h4>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100">
                        <div>
                          <p className="font-bold text-sky-900">Ativar QR Code PIX no Checkout</p>
                          <p className="text-xs text-sky-700">Mostra o QR Code automaticamente ao selecionar PIX</p>
                        </div>
                        <button 
                          onClick={() => setSettings(prev => ({ ...prev, enablePixQR: !prev.enablePixQR }))}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            settings.enablePixQR ? "bg-sky-600" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            settings.enablePixQR ? "left-7" : "left-1"
                          )}></div>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Chave PIX (CPF, CNPJ, Email ou Aleatória)</label>
                          <input 
                            type="text" 
                            placeholder="Sua chave PIX aqui"
                            value={settings.pixKey}
                            onChange={e => setSettings(prev => ({ ...prev, pixKey: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Nome do Beneficiário (Sem acentos)</label>
                          <input 
                            type="text" 
                            placeholder="Ex: JOSE DA SILVA"
                            value={settings.pixName}
                            onChange={e => setSettings(prev => ({ ...prev, pixName: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Cidade (Sem acentos)</label>
                          <input 
                            type="text" 
                            placeholder="Ex: SAO PAULO"
                            value={settings.pixCity}
                            onChange={e => setSettings(prev => ({ ...prev, pixCity: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                        <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                        <p className="text-xs text-amber-800 leading-relaxed">
                          <strong>Atenção:</strong> Esta integração gera um QR Code estático. A confirmação do pagamento deve ser feita manualmente conferindo o saldo no seu banco. Integrações automáticas (API) requerem um servidor backend.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-8 space-y-6">
                    <h4 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4">Preferências</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="font-bold text-slate-800">Notificações de Estoque</p>
                          <p className="text-xs text-slate-500">Avisar quando itens estiverem acabando</p>
                        </div>
                        <button 
                          onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            settings.notifications ? "bg-sky-600" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            settings.notifications ? "left-7" : "left-1"
                          )}></div>
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="font-bold text-slate-800">Modo Escuro (Beta)</p>
                          <p className="text-xs text-slate-500">Alterar aparência do sistema</p>
                        </div>
                        <button 
                          onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            settings.darkMode ? "bg-sky-600" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            settings.darkMode ? "left-7" : "left-1"
                          )}></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-6 bg-sky-700 text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                      <Kite className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Plano Profissional</h4>
                    <p className="text-sky-100 text-sm mb-4">
                      Você está utilizando a versão completa do sistema Dedé Pipas.
                    </p>
                    <div className="text-xs font-bold bg-white/10 p-3 rounded-xl">
                      Versão: 2.4.0-stable
                    </div>
                  </div>

                  <div className="glass-card p-6 space-y-4">
                    <h4 className="font-bold text-slate-800">Backup de Dados</h4>
                    <p className="text-xs text-slate-500">
                      Seus dados são salvos automaticamente neste navegador. Para segurança extra, exporte seu banco de dados.
                    </p>
                    <button 
                      onClick={() => {
                        const data = {
                          products,
                          sales,
                          transactions,
                          settings
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `backup_dede_pipas_${format(new Date(), 'yyyy-MM-dd')}.json`;
                        a.click();
                      }}
                      className="w-full py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Exportar JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal Overlay */}
      {paymentStep !== 'idle' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {paymentStep === 'selecting' && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-slate-800">Pagamento</h3>
                  <button onClick={() => setPaymentStep('idle')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>
                
                <div className="bg-sky-50 p-6 rounded-2xl mb-8 text-center">
                  <p className="text-sky-600 font-bold text-sm uppercase tracking-widest mb-1">Total a Pagar</p>
                  <h4 className="text-4xl font-black text-sky-700">R$ {cartTotal.toFixed(2)}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => finalizeSale('dinheiro')}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-slate-100 rounded-2xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
                  >
                    <Banknote size={32} className="text-slate-400 group-hover:text-sky-600" />
                    <span className="font-bold text-slate-700">Dinheiro</span>
                  </button>
                  <button 
                    onClick={() => finalizeSale('pix')}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-slate-100 rounded-2xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
                  >
                    <QrCode size={32} className="text-slate-400 group-hover:text-sky-600" />
                    <span className="font-bold text-slate-700">PIX</span>
                  </button>
                  <button 
                    onClick={() => finalizeSale('cartao_debito')}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-slate-100 rounded-2xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
                  >
                    <CreditCard size={32} className="text-slate-400 group-hover:text-sky-600" />
                    <span className="font-bold text-slate-700">Débito</span>
                  </button>
                  <button 
                    onClick={() => finalizeSale('cartao_credito')}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-slate-100 rounded-2xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
                  >
                    <CreditCard size={32} className="text-slate-400 group-hover:text-sky-600" />
                    <span className="font-bold text-slate-700">Crédito</span>
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'pix_qr' && (
              <div className="p-8 text-center space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800">Pagamento PIX</h3>
                  <button onClick={() => setPaymentStep('selecting')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-inner flex flex-col items-center gap-4">
                  <QRCodeSVG 
                    value={generatePixPayload(cartTotal)} 
                    size={200}
                    level="H"
                    includeMargin={true}
                    className="rounded-xl"
                  />
                  <div className="w-full space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chave PIX</p>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                      <code className="text-xs text-slate-600 break-all text-left">{settings.pixKey}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(settings.pixKey);
                          alert('Chave PIX copiada!');
                        }}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-sky-600 hover:bg-sky-50 transition-all"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Peça ao cliente para escanear o QR Code acima. Após o pagamento, confirme o recebimento no seu banco.
                  </p>
                <button 
                  onClick={async () => {
                    setPaymentStep('processing');
                    
                    try {
                      const saleId = Math.random().toString(36).substr(2, 9);
                      const newSale: Sale = {
                        id: saleId,
                        items: [...cart],
                        total: cartTotal,
                        paymentMethod: 'pix',
                        timestamp: Date.now(),
                        profit: cart.reduce((sum, item) => {
                          const product = products.find(p => p.id === item.productId);
                          return sum + ((item.price - (product?.cost || 0)) * item.quantity);
                        }, 0)
                      };

                      const batch = writeBatch(db);
                      batch.set(doc(db, 'sales', saleId), { ...newSale, uid: user.uid });

                      cart.forEach(item => {
                        const product = products.find(p => p.id === item.productId);
                        if (product) {
                          batch.update(doc(db, 'products', product.id), {
                            stock: product.stock - item.quantity
                          });
                        }
                      });

                      const txId = Math.random().toString(36).substr(2, 9);
                      batch.set(doc(db, 'transactions', txId), {
                        id: txId,
                        type: 'receita',
                        amount: cartTotal,
                        description: `Venda #${saleId.toUpperCase()} (PIX)`,
                        category: 'Vendas',
                        timestamp: Date.now(),
                        uid: user.uid
                      });

                      await batch.commit();

                      setCart([]);
                      setPaymentStep('success');
                      setTimeout(() => setPaymentStep('idle'), 2000);
                    } catch (error) {
                      handleFirestoreError(error, OperationType.WRITE, 'sales/transactions/products');
                    }
                  }}
                  className="w-full py-4 bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all flex items-center justify-center gap-2"
                >
                  Confirmar Recebimento
                </button>
                </div>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="p-12 text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-sky-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-sky-600 rounded-full border-t-transparent animate-spin"></div>
                  <CreditCard className="absolute inset-0 m-auto text-sky-600" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Processando...</h3>
                  <p className="text-slate-500">Aguardando comunicação com a maquininha de cartão.</p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-600">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Venda Concluída!</h3>
                  <p className="text-slate-500">O estoque foi atualizado e a transação registrada.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <h4 className="text-xl font-bold text-slate-800">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h4>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-4 md:p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nome do Produto</label>
                  <input 
                    required
                    type="text" 
                    value={productFormData.name}
                    onChange={e => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Pipa Raia 40x40"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Categoria</label>
                  <select 
                    value={productFormData.category}
                    onChange={e => setProductFormData(prev => ({ ...prev, category: e.target.value as Product['category'] }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  >
                    <option value="pipa">Pipa</option>
                    <option value="linha">Linha</option>
                    <option value="rabiola">Rabiola</option>
                    <option value="acessorio">Acessório</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Preço de Venda (R$)</label>
                  <input 
                    required
                    type="text" 
                    inputMode="decimal"
                    placeholder="0,00"
                    value={productFormInputs.price}
                    onChange={e => {
                      const valStr = e.target.value;
                      setProductFormInputs(prev => ({ ...prev, price: valStr }));
                      const numeric = parseFloat(valStr.replace(',', '.'));
                      setProductFormData(prev => ({ ...prev, price: isNaN(numeric) ? 0 : numeric }));
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Custo (R$)</label>
                  <input 
                    required
                    type="text" 
                    inputMode="decimal"
                    placeholder="0,00"
                    value={productFormInputs.cost}
                    onChange={e => {
                      const valStr = e.target.value;
                      setProductFormInputs(prev => ({ ...prev, cost: valStr }));
                      const numeric = parseFloat(valStr.replace(',', '.'));
                      setProductFormData(prev => ({ ...prev, cost: isNaN(numeric) ? 0 : numeric }));
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Estoque Atual</label>
                  <input 
                    required
                    type="text" 
                    inputMode="numeric"
                    value={productFormInputs.stock}
                    onChange={e => {
                      const valStr = e.target.value;
                      setProductFormInputs(prev => ({ ...prev, stock: valStr }));
                      const numeric = parseFloat(valStr.replace(',', '.'));
                      setProductFormData(prev => ({ ...prev, stock: isNaN(numeric) ? 0 : numeric }));
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Estoque Mínimo</label>
                  <input 
                    required
                    type="text" 
                    inputMode="numeric"
                    value={productFormInputs.minStock}
                    onChange={e => {
                      const valStr = e.target.value;
                      setProductFormInputs(prev => ({ ...prev, minStock: valStr }));
                      const numeric = parseFloat(valStr.replace(',', '.'));
                      setProductFormData(prev => ({ ...prev, minStock: isNaN(numeric) ? 0 : numeric }));
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all active:scale-95"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full mx-auto flex items-center justify-center">
              <Trash2 size={32} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Excluir Produto?</h4>
              <p className="text-slate-500 text-sm">Esta ação não pode ser desfeita e o produto será removido do estoque.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteProduct(productToDelete)}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

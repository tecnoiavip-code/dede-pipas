import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy, getDocs, writeBatch, getDocFromServer } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, auth, getFirebaseDebugInfo } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Product, Sale, Transaction, SaleItem } from '../types';
import { generatePixPayload as genPixPayload } from '../lib/pix';

// --- Handling Firestore Errors ---
export enum OperationType {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
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
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Pipa Raia 40x40', category: 'pipa', price: 2.50, cost: 1.20, stock: 150, minStock: 50 },
  { id: '2', name: 'Pipa Brit 50x50', category: 'pipa', price: 4.00, cost: 2.00, stock: 80, minStock: 30 },
  { id: '3', name: 'Linha 10 Corrente 500yd', category: 'linha', price: 15.00, cost: 8.50, stock: 25, minStock: 10 },
  { id: '4', name: 'Rabiola de Seda 10m', category: 'rabiola', price: 3.50, cost: 1.50, stock: 200, minStock: 40 },
  { id: '5', name: 'Carretilha Madeira G', category: 'acessorio', price: 45.00, cost: 25.00, stock: 5, minStock: 3 },
];

type Settings = {
  storeName: string;
  ownerName: string;
  address: string;
  phone: string;
  notifications: boolean;
  darkMode: boolean;
  pixKey: string;
  pixName: string;
  pixCity: string;
  enablePixQR: boolean;
};

interface StoreContextData {
  user: FirebaseUser | null;
  userRole: 'admin' | 'user' | null;
  isAuthReady: boolean;
  connectionStatus: 'checking' | 'connected' | 'error';
  debugInfo: any;
  activeTab: 'dashboard' | 'pos' | 'inventory' | 'finance' | 'marketing' | 'settings';
  setActiveTab: React.Dispatch<React.SetStateAction<'dashboard' | 'pos' | 'inventory' | 'finance' | 'marketing' | 'settings'>>;
  reportPeriod: 'week' | 'month' | 'year' | 'custom';
  setReportPeriod: React.Dispatch<React.SetStateAction<'week' | 'month' | 'year' | 'custom'>>;
  customDateRange: { start: string; end: string };
  setCustomDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
  products: Product[];
  sales: Sale[];
  transactions: Transaction[];
  cart: SaleItem[];
  setCart: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  paymentStep: 'idle' | 'selecting' | 'pix_qr' | 'processing' | 'success';
  setPaymentStep: React.Dispatch<React.SetStateAction<'idle' | 'selecting' | 'pix_qr' | 'processing' | 'success'>>;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  deferredPrompt: any;
  handleInstallApp: () => Promise<void>;
  generatePixPayload: (amount: number) => string;
  shareProduct: (product: Product, platform: 'whatsapp' | 'facebook' | 'instagram') => void;
  shareApp: (platform: 'whatsapp' | 'facebook' | 'instagram') => void;
  isProductModalOpen: boolean;
  setIsProductModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  productToDelete: string | null;
  setProductToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  editingProduct: Product | null;
  productFormInputs: { price: string; cost: string; stock: string; minStock: string };
  setProductFormInputs: React.Dispatch<React.SetStateAction<{ price: string; cost: string; stock: string; minStock: string }>>;
  productFormData: Partial<Product>;
  setProductFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  handleOpenProductModal: (product?: Product) => void;
  handleSaveProduct: (e: React.FormEvent) => Promise<void>;
  handleDeleteProduct: (productId: string) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  handleExportSpreadsheet: () => void;
  cartTotal: number;
  finalizeSale: (method: Sale['paymentMethod']) => Promise<void>;
  stats: any;
  chartData: any;
  reportData: any;
  seedDatabase: () => Promise<void>;
}

const StoreContext = createContext<StoreContextData | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>('admin');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [debugInfo] = useState(getFirebaseDebugInfo());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthReady(true);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Falha na autenticação silenciosa:', error);
          setIsAuthReady(true); // tenta prosseguir offline
        }
      }
    });
    return () => unsub();
  }, []);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'inventory' | 'finance' | 'marketing' | 'settings'>('dashboard');
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('week');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
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

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormInputs, setProductFormInputs] = useState({ price: '', cost: '', stock: '', minStock: '' });
  const [productFormData, setProductFormData] = useState<Partial<Product>>({
    name: '', category: 'pipa', price: 0, cost: 0, stock: 0, minStock: 0
  });

  const [settings, setSettings] = useState<Settings>({
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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const generatePixPayload = (amount: number) => genPixPayload(amount, settings);

  const shareProduct = (product: Product, platform: 'whatsapp' | 'facebook' | 'instagram') => {
    const text = `Confira a ${product.name} na Dedé Pipas! Apenas R$ ${product.price.toFixed(2)}.`;
    const url = window.location.href;
    let shareUrl = '';
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    else if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    else if (platform === 'instagram') {
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
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    else if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    else if (platform === 'instagram') {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert('Link do app copiado! Compartilhe no seu Instagram.');
      shareUrl = 'https://www.instagram.com/';
    }
    if (shareUrl) window.open(shareUrl, '_blank');
  };

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
        name: '', category: 'pipa', price: 0, cost: 0, stock: 0, minStock: 0
      });
      setProductFormInputs({ price: '', cost: '', stock: '', minStock: '' });
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
      alert('Erro ao salvar no banco de dados: Permissão Negada.\nVerifique se o "Login Anônimo" e as "Regras do Firestore" estão configurados no Firebase.');
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

  useEffect(() => {
    if (!isAuthReady) return;

    const testConnection = async () => {
      setConnectionStatus('checking');
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setConnectionStatus('connected');
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          setConnectionStatus('error');
        } else {
          setConnectionStatus('connected');
        }
      }
    };
    testConnection();

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => doc.data() as Product));
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
  }, [isAuthReady]);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const migrateData = async () => {
      const isMigrated = localStorage.getItem('dede_pipas_migrated');
      if (isMigrated === 'true') return;

      const localProducts = localStorage.getItem('dede_pipas_products');
      const localSales = localStorage.getItem('dede_pipas_sales');
      const localTransactions = localStorage.getItem('dede_pipas_transactions');

      const batch = writeBatch(db);
      let hasData = false;

      if (!localProducts && !localSales && !localTransactions) {
        try {
          const productsSnapshot = await getDocs(collection(db, 'products'));
          if (productsSnapshot.empty) {
            INITIAL_PRODUCTS.forEach(p => batch.set(doc(db, 'products', p.id), p));
            hasData = true;
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (localProducts) {
        JSON.parse(localProducts).forEach((p: Product) => { batch.set(doc(db, 'products', p.id), p); hasData = true; });
      }
      if (localSales) {
        JSON.parse(localSales).forEach((s: Sale) => { batch.set(doc(db, 'sales', s.id), { ...s, uid: user?.uid }); hasData = true; });
      }
      if (localTransactions) {
        JSON.parse(localTransactions).forEach((t: Transaction) => { batch.set(doc(db, 'transactions', t.id), { ...t, uid: user?.uid }); hasData = true; });
      }

      if (hasData) {
        try {
          await batch.commit();
          localStorage.setItem('dede_pipas_migrated', 'true');
        } catch (error) {
          console.error(error);
        }
      } else {
        localStorage.setItem('dede_pipas_migrated', 'true');
      }
    };

    migrateData();
  }, [user, isAuthReady]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('dede_pipas_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem('dede_pipas_settings', JSON.stringify(settings));
  }, [settings]);

  const seedDatabase = async () => {
    if (!confirm('Deseja popular o banco de dados com os produtos iniciais?')) return;
    const batch = writeBatch(db);
    INITIAL_PRODUCTS.forEach(p => batch.set(doc(db, 'products', p.id), p));
    try {
      await batch.commit();
      alert('Banco de dados populado com sucesso!');
    } catch {
      alert('Falha ao popular o banco de dados.');
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, quantity: 1, price: product.price }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.productId !== productId));

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
    const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
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
      batch.set(doc(db, 'sales', saleId), { ...newSale, uid: user?.uid });

      cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) batch.update(doc(db, 'products', product.id), { stock: product.stock - item.quantity });
      });

      const txId = Math.random().toString(36).substr(2, 9);
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        type: 'receita',
        amount: cartTotal,
        description: `Venda #${saleId.toUpperCase()}`,
        category: 'Vendas',
        timestamp: Date.now(),
        uid: user?.uid
      });

      await batch.commit();

      setCart([]);
      setPaymentStep('success');
      setTimeout(() => setPaymentStep('idle'), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales/transactions/products');
    }
  };

  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const todaySales = sales.filter(s => s.timestamp >= today);
    return {
      todayRevenue: todaySales.reduce((sum, s) => sum + s.total, 0),
      todaySalesCount: todaySales.length,
      totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
      totalProfit: sales.reduce((sum, s) => sum + s.profit, 0),
      lowStockCount: products.filter(p => p.stock <= p.minStock).length
    };
  }, [sales, products]);

  const chartData = useMemo(() => {
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

    if (reportPeriod === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (reportPeriod === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (reportPeriod === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
    else if (reportPeriod === 'custom') {
      startDate = new Date(customDateRange.start);
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    }
    startDate.setHours(0, 0, 0, 0);

    const filteredSales = sales.filter(s => s.timestamp >= startDate.getTime() && s.timestamp <= endDate.getTime());
    
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

    return {
      sales: filteredSales,
      totalRevenue: filteredSales.reduce((sum, s) => sum + s.total, 0),
      totalProfit: filteredSales.reduce((sum, s) => sum + s.profit, 0),
      count: filteredSales.length,
      chart: Object.values(days).map(d => ({ name: format(d.date, reportPeriod === 'year' ? 'MMM' : 'dd/MM', { locale: ptBR }), vendas: d.total, lucro: d.profit }))
    };
  }, [sales, reportPeriod, customDateRange]);

  const value = {
    user, userRole, isAuthReady, connectionStatus, debugInfo,
    activeTab, setActiveTab, reportPeriod, setReportPeriod, customDateRange, setCustomDateRange,
    products, sales, transactions, cart, setCart, paymentStep, setPaymentStep, settings, setSettings,
    deferredPrompt, handleInstallApp, generatePixPayload, shareProduct, shareApp,
    isProductModalOpen, setIsProductModalOpen, productToDelete, setProductToDelete,
    editingProduct, productFormInputs, setProductFormInputs, productFormData, setProductFormData,
    handleOpenProductModal, handleSaveProduct, handleDeleteProduct,
    addToCart, removeFromCart, updateCartQuantity, handleExportSpreadsheet, cartTotal, finalizeSale,
    stats, chartData, reportData, seedDatabase
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
}

import React from 'react';
import { Search, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { cn } from '../lib/utils';

export function POS() {
  const { products, cart, cartTotal, addToCart, removeFromCart, updateCartQuantity, setPaymentStep } = useStore();

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8 animate-in slide-in-from-right duration-500 overflow-y-auto lg:overflow-hidden pb-4 md:pb-0">
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
  );
}

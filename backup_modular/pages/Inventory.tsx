import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { cn } from '../lib/utils';

export function Inventory() {
  const { products, handleOpenProductModal, setProductToDelete } = useStore();

  return (
    <div className="flex-1 space-y-6 animate-in fade-in duration-500">
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
  );
}

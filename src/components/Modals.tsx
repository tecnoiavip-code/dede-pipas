import React from 'react';
import { X, Banknote, QrCode, CreditCard, Share2, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../contexts/StoreContext';
import { Product } from '../types';

export function Modals() {
  const { 
    paymentStep, setPaymentStep, cartTotal, finalizeSale, generatePixPayload, settings,
    isProductModalOpen, setIsProductModalOpen, editingProduct, productFormData, setProductFormData,
    productFormInputs, setProductFormInputs, handleSaveProduct,
    productToDelete, setProductToDelete, handleDeleteProduct
  } = useStore();

  return (
    <>
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
                
                <div className="bg-sky-50 p-6 rounded-2xl mb-6 text-center flex-shrink-0">
                  <p className="text-sky-600 font-bold text-sm uppercase tracking-widest mb-1">Total a Pagar</p>
                  <h4 className="text-4xl font-black text-sky-700">R$ {cartTotal.toFixed(2)}</h4>
                </div>

                {/* Resumo do Carrinho no Modal */}
                <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-3 min-h-[100px]">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-white pb-2">Resumo do Pedido</p>
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{item.quantity}x</span>
                        <span className="text-slate-600 truncate max-w-[180px]">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                  <button 
                    onClick={() => finalizeSale('dinheiro')}
                    className="flex flex-col items-center gap-3 p-4 border-2 border-slate-100 rounded-2xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
                  >
                    <Banknote size={28} className="text-slate-400 group-hover:text-sky-600" />
                    <span className="font-bold text-slate-700 text-sm">Dinheiro</span>
                  </button>
                  <button 
                    onClick={() => finalizeSale('pix')}
                    className="flex flex-col items-center gap-3 p-4 border-2 border-slate-100 rounded-2xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
                  >
                    <QrCode size={28} className="text-slate-400 group-hover:text-sky-600" />
                    <span className="font-bold text-slate-700 text-sm">PIX</span>
                  </button>
                  <button 
                    onClick={() => finalizeSale('cartao_debito')}
                    className="flex flex-col items-center gap-3 p-4 border-2 border-slate-100 rounded-2xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
                  >
                    <CreditCard size={28} className="text-slate-400 group-hover:text-sky-600" />
                    <span className="font-bold text-slate-700 text-sm">Débito</span>
                  </button>
                  <button 
                    onClick={() => finalizeSale('cartao_credito')}
                    className="flex flex-col items-center gap-3 p-4 border-2 border-slate-100 rounded-2xl hover:border-sky-500 hover:bg-sky-50 transition-all group"
                  >
                    <CreditCard size={28} className="text-slate-400 group-hover:text-sky-600" />
                    <span className="font-bold text-slate-700 text-sm">Crédito</span>
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
                    onClick={() => finalizeSale('pix')}
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
    </>
  );
}

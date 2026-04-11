import React from 'react';
import { MessageCircle, Instagram, ExternalLink, Heart, MessageSquare, Send, Share2, Facebook, ChevronRight } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

export function Marketing() {
  const { shareApp } = useStore();

  return (
    <div className="flex-1 space-y-8 animate-in fade-in duration-500">
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
  );
}

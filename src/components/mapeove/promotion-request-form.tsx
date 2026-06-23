"use client";

import { useState } from "react";
import { CheckCircle, Copy, AlertCircle } from "lucide-react";

interface PromotionRequestFormProps {
  businessId: string;
}

const PROMOTIONS = [
  {
    type: "FEATURED",
    title: "Negocio destacado",
    description: "Aparece arriba en búsquedas y listados dentro de tu zona.",
    basePrice: 5,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    titleColor: "text-yellow-900",
    descColor: "text-yellow-800",
    btnColor: "bg-yellow-600 hover:bg-yellow-700",
  },
  {
    type: "SPONSORED_CATEGORY",
    title: "Categoría patrocinada",
    description: "Aparece como patrocinado dentro de tu categoría.",
    basePrice: 10,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    titleColor: "text-blue-900",
    descColor: "text-blue-800",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    type: "LOCAL_BANNER",
    title: "Banner local",
    description: "Promociona una oferta visible para usuarios de tu ciudad.",
    basePrice: 15,
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    titleColor: "text-purple-900",
    descColor: "text-purple-800",
    btnColor: "bg-purple-600 hover:bg-purple-700",
  },
  {
    type: "PREMIUM",
    title: "Plan Premium",
    description: "Más fotos, promociones, videos y estadísticas cuando esté disponible.",
    basePrice: 5,
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    titleColor: "text-gray-900",
    descColor: "text-gray-600",
    btnColor: "bg-gray-800 hover:bg-gray-900",
  },
];

// Settings will be loaded from DB

export function PromotionRequestForm({ businessId }: PromotionRequestFormProps) {
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);
  const [transactionHash, setTransactionHash] = useState("");
  const [userNote, setUserNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedAlt, setCopiedAlt] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  // Fetch settings on mount
  import("react").then(React => {
    React.useEffect(() => {
      fetch("/api/payment-settings")
        .then(r => r.json())
        .then(data => {
          if (data && data.success && data.settings) {
            setPaymentSettings(data.settings);
          }
        })
        .catch(console.error);
    }, []);
  });


  const handleCopy = (isAlt: boolean = false) => {
    const address = isAlt ? paymentSettings?.binanceInfo : paymentSettings?.binanceWallet;
    if (!address) return;
    navigator.clipboard.writeText(address);
    if (isAlt) {
      setCopiedAlt(true);
      setTimeout(() => setCopiedAlt(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionHash.trim()) {
      setError("Debes ingresar el hash o comprobante de la transacción");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          type: selectedPromo.type,
          baseAmount: selectedPromo.basePrice,
          transactionHash,
          userNote,
        }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Ocurrió un error al enviar la solicitud");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión al servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="py-8 text-center space-y-4 animate-fade-in bg-green-50 p-6 rounded-xl border border-green-200">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
          <CheckCircle size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-gray-900">Comprobante recibido</h4>
          <p className="text-xs text-gray-600 px-4 leading-relaxed">
            Tu promoción aparecerá después de verificar el pago. Tiempo máximo estimado: 5 horas.
          </p>
        </div>
        <button
          onClick={() => {
            setSuccess(false);
            setSelectedPromo(null);
            setTransactionHash("");
            setUserNote("");
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all"
        >
          Pagar otra promoción
        </button>
      </div>
    );
  }

  if (selectedPromo) {
    const fee = paymentSettings?.binanceFeeValue || 1;
    const totalAmount = selectedPromo.basePrice + fee;

    return (
      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h4 className="text-sm font-bold text-gray-800">Completar Pago de Promoción</h4>
          <button
            type="button"
            onClick={() => setSelectedPromo(null)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Volver a opciones
          </button>
        </div>

        <div className={`${selectedPromo.bgColor} border ${selectedPromo.borderColor} p-4 rounded-xl`}>
          <h5 className={`text-sm font-bold ${selectedPromo.titleColor} mb-1`}>{selectedPromo.title}</h5>
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${selectedPromo.descColor}`}>Precio Base:</span>
            <span className={`text-xs font-bold ${selectedPromo.titleColor}`}>{selectedPromo.basePrice} USD</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs ${selectedPromo.descColor}`}>Comisión Operativa:</span>
            <span className={`text-xs font-bold ${selectedPromo.titleColor}`}>1 USD</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/10">
            <span className={`text-sm font-bold ${selectedPromo.titleColor}`}>Total a Pagar:</span>
            <span className={`text-sm font-black ${selectedPromo.titleColor}`}>{totalAmount} USDC</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-3">
          <p className="text-xs text-blue-900 leading-relaxed font-medium">
            {paymentSettings?.pagoMovilInfo || "Envía exactamente el total indicado en USDC por la red BNB Smart Chain (BEP20). El monto incluye 1 USD de comisión operativa. Después de pagar, coloca el hash o comprobante de la transacción. Tu promoción será revisada y activada en un plazo máximo de 5 horas."}
          </p>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-blue-800 uppercase">Billetera Principal (USDC BEP20)</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={paymentSettings?.binanceWallet || "0x1fded59b2460d421cc53f8256e2c7ac2ea771909"}
                className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs font-mono text-gray-700 outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy(false)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex shrink-0 items-center justify-center"
                title="Copiar billetera"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
            
            {(paymentSettings?.binanceInfo || "0x8bc72cc8ff3638aa1045869fe6c5efb6a87a92c4") && (
              <div className="pt-2">
                <label className="text-[10px] font-bold text-blue-800 uppercase">Billetera Alternativa (USDC BEP20)</label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    readOnly 
                    value={paymentSettings?.binanceInfo || "0x8bc72cc8ff3638aa1045869fe6c5efb6a87a92c4"}
                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs font-mono text-gray-700 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(true)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex shrink-0 items-center justify-center"
                    title="Copiar billetera"
                  >
                    {copiedAlt ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex gap-2 items-start">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Hash o Comprobante de Transacción *</label>
            <input
              type="text"
              required
              placeholder="Ej. 0x123...abc"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Nota (Opcional)</label>
            <input
              type="text"
              placeholder="Ej. Detalles de la transacción o título de mi oferta"
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Enviando comprobante...</span>
            </>
          ) : (
            <span>Enviar comprobante</span>
          )}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {PROMOTIONS.map((promo) => (
        <div key={promo.type} className={`${promo.bgColor} border ${promo.borderColor} p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between`}>
          <div>
            <h5 className={`text-sm font-bold ${promo.titleColor} mb-1`}>{promo.title}</h5>
            <p className={`text-xs ${promo.descColor}`}>{promo.description}</p>
            <p className={`text-xs font-bold ${promo.titleColor} mt-2`}>Sugerido: {promo.basePrice} USD / mes</p>
          </div>
          <button 
            type="button" 
            onClick={() => setSelectedPromo(promo)} 
            className={`w-full sm:w-auto px-4 py-2 text-white rounded-lg text-xs font-bold transition-colors ${promo.btnColor}`}
          >
            Pagar con USDC
          </button>
        </div>
      ))}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  ArrowRightLeft, 
  Info, 
  ChevronDown, 
  Check,
  Receipt,
  Percent,
  Coins,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Types ---

type CalculationMode = 'ADD' | 'REMOVE';

interface IndustryCategory {
  id: string;
  name: string;
  liablePercentage: number;
  description: string;
}

const VAT_RATE = 0.18; // 18%
const SSCL_RATE = 0.025; // 2.5%

const CATEGORIES: IndustryCategory[] = [
  { 
    id: 'import', 
    name: 'Importation', 
    liablePercentage: 1.0, 
    description: 'Importation of any good or service (100% liable)' 
  },
  { 
    id: 'manufacture', 
    name: 'Manufacture', 
    liablePercentage: 0.85, 
    description: 'Manufacture of any good or service (85% liable)' 
  },
  { 
    id: 'service', 
    name: 'Service Provider', 
    liablePercentage: 1.0, 
    description: 'Service provider (100% liable)' 
  },
  { 
    id: 'retail', 
    name: 'Wholesale & Retail', 
    liablePercentage: 0.5, 
    description: 'Wholesale and Retailer including import and sale (50% liable)' 
  },
  { 
    id: 'distributor', 
    name: 'Distributors', 
    liablePercentage: 0.25, 
    description: 'Distributors of Wholesale and Retail related to SL manufactures (25% liable)' 
  },
];

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 ${className}`}>
    {children}
  </div>
);

const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <label className={`block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 ${className}`}>
    {children}
  </label>
);

export default function App() {
  const [mode, setMode] = useState<CalculationMode>('REMOVE');
  const [inputValue, setInputValue] = useState<string>('1000');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(CATEGORIES[1].id); // Default to Manufacture
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  // New states for custom rates
  const [customLiablePercentage, setCustomLiablePercentage] = useState<number>(100);
  const [vatRate, setVatRate] = useState<number>(18);
  const [ssclRate, setSsclRate] = useState<number>(2.5);

  const selectedCategory = useMemo(() => {
    if (selectedCategoryId === 'custom') {
      return {
        id: 'custom',
        name: 'Custom Rate',
        liablePercentage: customLiablePercentage / 100,
        description: `User defined liability (${customLiablePercentage}%)`
      };
    }
    return CATEGORIES.find(c => c.id === selectedCategoryId) || CATEGORIES[1];
  }, [selectedCategoryId, customLiablePercentage]);

  const results = useMemo(() => {
    const amount = parseFloat(inputValue) || 0;
    const currentVatRate = vatRate / 100;
    const currentSsclRate = ssclRate / 100;
    const effectiveSSCLRate = currentSsclRate * selectedCategory.liablePercentage;
    
    if (mode === 'REMOVE') {
      // Input is Total Price (A)
      const totalPrice = amount;
      const priceWithSSCL = totalPrice / (1 + currentVatRate);
      const vatAmount = totalPrice - priceWithSSCL;
      
      // Base Price (C) = PriceWithSSCL * (1 - EffectiveSSCLRate)
      const basePrice = priceWithSSCL * (1 - effectiveSSCLRate);
      const ssclAmount = priceWithSSCL - basePrice;
      
      return {
        basePrice,
        ssclAmount,
        vatAmount,
        totalPrice,
        ssclFactor: 1 / (1 - effectiveSSCLRate)
      };
    } else {
      // Input is Base Price (C)
      const basePrice = amount;
      
      // PriceWithSSCL (B) = BasePrice / (1 - EffectiveSSCLRate)
      const priceWithSSCL = basePrice / (1 - effectiveSSCLRate);
      const ssclAmount = priceWithSSCL - basePrice;
      
      const totalPrice = priceWithSSCL * (1 + currentVatRate);
      const vatAmount = totalPrice - priceWithSSCL;
      
      return {
        basePrice,
        ssclAmount,
        vatAmount,
        totalPrice,
        ssclFactor: 1 / (1 - effectiveSSCLRate)
      };
    }
  }, [mode, inputValue, selectedCategory, vatRate, ssclRate]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="max-w-4xl mx-auto pt-12 pb-8 px-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Calculator size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Lanka Tax Calc</h1>
        </div>
        <p className="text-zinc-500 max-w-xl">
          Calculate Sri Lankan SSCL (2.5%) and VAT (18%) with precision. 
          Adjust calculations based on your industry's liable turnover percentage.
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="md:col-span-5 space-y-6">
          <Card>
            <div className="space-y-6">
              {/* Mode Toggle */}
              <div>
                <Label>Calculation Mode</Label>
                <div className="flex p-1 bg-zinc-100 rounded-xl">
                  <button
                    onClick={() => setMode('REMOVE')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      mode === 'REMOVE' 
                        ? 'bg-white text-zinc-900 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <ArrowDownLeft size={16} />
                    Remove Tax
                  </button>
                  <button
                    onClick={() => setMode('ADD')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      mode === 'ADD' 
                        ? 'bg-white text-zinc-900 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <ArrowUpRight size={16} />
                    Add Tax
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <Label>{mode === 'REMOVE' ? 'Total Price (Inc. Tax)' : 'Base Price (Exc. Tax)'}</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">
                    LKR
                  </div>
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <Label>Industry Category (SSCL)</Label>
                <button
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-zinc-300 transition-all text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{selectedCategory.name}</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-tight">
                      {selectedCategory.id === 'custom' ? `${customLiablePercentage}%` : `${selectedCategory.liablePercentage * 100}%`} Liability
                    </span>
                  </div>
                  <ChevronDown size={18} className={`text-zinc-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isCategoryOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsCategoryOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl z-20 overflow-hidden"
                      >
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategoryId(cat.id);
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0 ${
                              selectedCategoryId === cat.id ? 'bg-emerald-50/50' : ''
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${selectedCategoryId === cat.id ? 'text-emerald-700' : 'text-zinc-900'}`}>
                                {cat.name}
                              </span>
                              <span className="text-xs text-zinc-500">{cat.description}</span>
                            </div>
                            {selectedCategoryId === cat.id && (
                              <Check size={16} className="text-emerald-600" />
                            )}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setSelectedCategoryId('custom');
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 transition-colors ${
                            selectedCategoryId === 'custom' ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${selectedCategoryId === 'custom' ? 'text-emerald-700' : 'text-zinc-900'}`}>
                              Custom Rate
                            </span>
                            <span className="text-xs text-zinc-500">Define your own liability percentage</span>
                          </div>
                          {selectedCategoryId === 'custom' && (
                            <Check size={16} className="text-emerald-600" />
                          )}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Custom Rate Input (Conditional) */}
              <AnimatePresence>
                {selectedCategoryId === 'custom' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <Label>Custom Liability (%)</Label>
                    <div className="relative">
                      <input
                        type="number"
                        value={customLiablePercentage}
                        onChange={(e) => setCustomLiablePercentage(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-semibold"
                        min="0"
                        max="100"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">
                        %
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Advanced Settings Toggle */}
              <div className="pt-4 border-t border-zinc-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>VAT Rate (%)</Label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vatRate}
                        onChange={(e) => setVatRate(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-semibold"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-medium">
                        %
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>SSCL Rate (%)</Label>
                    <div className="relative">
                      <input
                        type="number"
                        value={ssclRate}
                        onChange={(e) => setSsclRate(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-semibold"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-medium">
                        %
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Info Panel */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex gap-3">
            <Info size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 leading-relaxed">
              <p className="font-semibold mb-1">Calculation Logic:</p>
              <ul className="space-y-1 opacity-90">
                <li>• VAT is fixed at {vatRate}% of the price with SSCL.</li>
                <li>• SSCL is {ssclRate}% on the liable portion of turnover.</li>
                <li>• Formula: Price with SSCL = Base / (1 - ({ssclRate / 100} × Liable%))</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="md:col-span-7">
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold">Tax Breakdown</h2>
              <div className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Live Preview
              </div>
            </div>

            <div className="flex-1 space-y-8">
              {/* Main Result */}
              <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <Label>{mode === 'REMOVE' ? 'Calculated Base Price' : 'Calculated Total Price'}</Label>
                <motion.div 
                  key={mode === 'REMOVE' ? results.basePrice : results.totalPrice}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-4xl font-black tracking-tighter text-emerald-600"
                >
                  {formatCurrency(mode === 'REMOVE' ? results.basePrice : results.totalPrice)}
                </motion.div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <BreakdownItem 
                  icon={<Coins size={18} />}
                  label="Base Price"
                  value={results.basePrice}
                  subtext="Excluding all taxes"
                  format={formatCurrency}
                />
                
                <div className="relative">
                  <div className="absolute left-9 top-0 bottom-0 w-px bg-zinc-100" />
                  <BreakdownItem 
                    icon={<Percent size={18} />}
                    label={`SSCL (${(ssclRate * selectedCategory.liablePercentage).toFixed(3)}%)`}
                    value={results.ssclAmount}
                    subtext={`Factor: ${results.ssclFactor.toFixed(5)}`}
                    format={formatCurrency}
                    highlight
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-9 top-0 bottom-0 w-px bg-zinc-100" />
                  <BreakdownItem 
                    icon={<Receipt size={18} />}
                    label={`VAT (${vatRate}%)`}
                    value={results.vatAmount}
                    subtext="Calculated on price with SSCL"
                    format={formatCurrency}
                    highlight
                  />
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <BreakdownItem 
                    icon={<ArrowRightLeft size={18} />}
                    label="Total Price"
                    value={results.totalPrice}
                    subtext="Final amount including all taxes"
                    format={formatCurrency}
                    bold
                  />
                </div>
              </div>
            </div>

            {/* Quick Summary Footer */}
            <div className="mt-12 p-4 bg-zinc-900 rounded-xl text-white flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Tax Component</span>
                <span className="text-lg font-bold">{formatCurrency(results.ssclAmount + results.vatAmount)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Tax Percentage</span>
                <div className="text-lg font-bold text-emerald-400">
                  {(( (results.ssclAmount + results.vatAmount) / results.basePrice) * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-zinc-200 text-center">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
          Sri Lanka Tax Calculator • 2024
        </p>
      </footer>
    </div>
  );
}

function BreakdownItem({ 
  icon, 
  label, 
  value, 
  subtext, 
  format, 
  highlight = false,
  bold = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  subtext: string; 
  format: (v: number) => string;
  highlight?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
          highlight ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100'
        }`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-semibold ${bold ? 'text-zinc-900' : 'text-zinc-600'}`}>
            {label}
          </span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-tight font-medium">
            {subtext}
          </span>
        </div>
      </div>
      <div className={`text-sm font-mono ${bold ? 'text-zinc-900 font-bold' : 'text-zinc-700'}`}>
        {format(value)}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Edit3,
  Check,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Smartphone,
  ShieldCheck,
  Crown,
  Search,
  Filter,
  Info,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { UserSession } from './AuthScreen';
import {
  subscribePackageFee,
  updatePackageFeeInFirestore,
  subscribePaymentAccountsList,
  updatePaymentAccountsInFirestore,
  subscribePaymentRecords,
  addPaymentRecordToFirestore,
  updatePaymentRecordStatusInFirestore
} from '../firebase';

export interface PaymentAccount {
  id: string;
  provider: 'bKash' | 'Nagad';
  number: string;
  type: 'Merchant' | 'Personal' | 'Agent' | 'Send Money';
  label: string;
  qrCodeUrl?: string;
  instructions: string;
}

interface PaymentRecord {
  id: string;
  studentName: string;
  rollNo: string;
  degreeType: string;
  totalFee: number;
  paidAmount: number;
  provider: 'bKash' | 'Nagad' | 'Cash';
  accountUsed: string;
  trxId: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  date: string;
  note?: string;
}

const DEFAULT_ACCOUNTS: PaymentAccount[] = [
  {
    id: 'bkash-1',
    provider: 'bKash',
    number: '01700-123456',
    type: 'Merchant',
    label: 'bKash Merchant Payment',
    instructions: '1. Open bKash App -> Select Make Payment\n2. Enter Merchant Number: 01700-123456\n3. Enter Amount (৳3500) and Reference (Your Roll No)\n4. Enter PIN to complete & save TrxID'
  },
  {
    id: 'bkash-2',
    provider: 'bKash',
    number: '01711-889900',
    type: 'Personal',
    label: 'bKash Personal (Send Money 1)',
    instructions: '1. Open bKash App -> Select Send Money\n2. Enter Number: 01711-889900\n3. Enter Amount (৳3500) & Reference (Roll No)\n4. Save TrxID and submit below'
  },
  {
    id: 'bkash-3',
    provider: 'bKash',
    number: '01722-334455',
    type: 'Send Money',
    label: 'bKash Personal (Send Money 2)',
    instructions: '1. Dial *247# or open bKash App -> Send Money\n2. Enter Number: 01722-334455\n3. Enter Amount & PIN\n4. Copy TrxID'
  },
  {
    id: 'nagad-1',
    provider: 'Nagad',
    number: '01800-654321',
    type: 'Merchant',
    label: 'Nagad Wallet Payment',
    instructions: '1. Open Nagad App -> Merchant Pay\n2. Enter Merchant Number: 01800-654321\n3. Enter Amount (৳3500) & Reference\n4. Complete payment & save TrxID'
  },
  {
    id: 'nagad-2',
    provider: 'Nagad',
    number: '01811-998877',
    type: 'Personal',
    label: 'Nagad Personal (Send Money)',
    instructions: '1. Open Nagad App -> Send Money\n2. Enter Number: 01811-998877\n3. Enter Amount & Roll No in reference\n4. Save TrxID'
  },
  {
    id: 'nagad-3',
    provider: 'Nagad',
    number: '01822-445566',
    type: 'Send Money',
    label: 'Nagad Personal Backup',
    instructions: '1. Nagad App or *167# -> Send Money\n2. Enter Number: 01822-445566\n3. Enter Amount & PIN\n4. Save TrxID'
  }
];

const INITIAL_RECORDS: PaymentRecord[] = [];

interface PaymentViewProps {
  currentUser: UserSession | null;
}

export const PaymentView: React.FC<PaymentViewProps> = ({ currentUser }) => {
  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Fee & Account state
  const [packageFee, setPackageFee] = useState<number>(3500);
  const [accounts, setAccounts] = useState<PaymentAccount[]>(DEFAULT_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('bkash-1');
  const [records, setRecords] = useState<PaymentRecord[]>(INITIAL_RECORDS);

  useEffect(() => {
    const unsubFee = subscribePackageFee(setPackageFee);
    const unsubAccounts = subscribePaymentAccountsList(setAccounts, DEFAULT_ACCOUNTS);
    const unsubRecords = subscribePaymentRecords(setRecords);

    return () => {
      unsubFee();
      unsubAccounts();
      unsubRecords();
    };
  }, []);

  // Copy state feedback
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Modals state
  const [isEditFeeOpen, setIsEditFeeOpen] = useState(false);
  const [tempFee, setTempFee] = useState('3500');

  const [editAccountsProvider, setEditAccountsProvider] = useState<'bKash' | 'Nagad' | null>(null);
  const [editingAccountsList, setEditingAccountsList] = useState<PaymentAccount[]>([]);

  // Student submission modal / form
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [subStudentName, setSubStudentName] = useState(currentUser?.name || '');
  const [subRollNo, setSubRollNo] = useState('DEG-88-008');
  const [subAmount, setSubAmount] = useState('3500');
  const [subTrxId, setSubTrxId] = useState('');
  const [subNote, setSubNote] = useState('');
  const [subProvider, setSubProvider] = useState<'bKash' | 'Nagad'>('bKash');
  const [subSuccess, setSubSuccess] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Verified' | 'Pending' | 'Rejected'>('All');

  const bkashAccounts = accounts.filter((a) => a.provider === 'bKash');
  const nagadAccounts = accounts.filter((a) => a.provider === 'Nagad');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num.replace(/-/g, ''));
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // Open Edit Fee Modal
  const handleOpenEditFee = () => {
    setTempFee(packageFee.toString());
    setIsEditFeeOpen(true);
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(tempFee);
    if (val > 0) {
      await updatePackageFeeInFirestore(val);
      setIsEditFeeOpen(false);
    }
  };

  // Open Account Edit Modal (bKash or Nagad)
  const handleOpenAccountEdit = (provider: 'bKash' | 'Nagad') => {
    const list = accounts.filter((a) => a.provider === provider);
    setEditingAccountsList(JSON.parse(JSON.stringify(list)));
    setEditAccountsProvider(provider);
  };

  // Remove number from edit list
  const handleRemoveEditingAccount = (index: number) => {
    if (editingAccountsList.length <= 1) return;
    setEditingAccountsList(editingAccountsList.filter((_, i) => i !== index));
  };

  // Add new number to edit list
  const handleAddEditingAccount = () => {
    if (!editAccountsProvider) return;
    const newAcc: PaymentAccount = {
      id: `${editAccountsProvider.toLowerCase()}-${Date.now()}`,
      provider: editAccountsProvider,
      number: '01700-000000',
      type: 'Personal',
      label: `${editAccountsProvider} Number ${editingAccountsList.length + 1}`,
      instructions: `1. Open ${editAccountsProvider} App -> Send Money\n2. Enter Number & Amount (৳${packageFee})\n3. Save TrxID`
    };
    setEditingAccountsList([...editingAccountsList, newAcc]);
  };

  const handleSaveAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccountsProvider) return;

    const otherAccounts = accounts.filter((a) => a.provider !== editAccountsProvider);
    const updated = [...otherAccounts, ...editingAccountsList];
    
    await updatePaymentAccountsInFirestore(updated);

    // If selected account was removed, update selected
    if (!updated.some((a) => a.id === selectedAccountId)) {
      setSelectedAccountId(updated[0]?.id || '');
    }

    setEditAccountsProvider(null);
  };

  // Student submit payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subStudentName || !subRollNo || !subTrxId) return;

    const newRecord: Omit<PaymentRecord, 'id'> = {
      studentName: subStudentName,
      rollNo: subRollNo,
      degreeType: 'Batch 88',
      totalFee: packageFee,
      paidAmount: Number(subAmount) || packageFee,
      provider: subProvider,
      accountUsed: selectedAccount ? `${selectedAccount.number} (${selectedAccount.type})` : subProvider,
      trxId: subTrxId,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      note: subNote
    };

    await addPaymentRecordToFirestore(newRecord);
    setSubSuccess(true);
    setTimeout(() => {
      setSubSuccess(false);
      setIsSubmitModalOpen(false);
      setSubTrxId('');
      setSubNote('');
    }, 1500);
  };

  // Admin status toggle
  const handleUpdateRecordStatus = async (id: string, newStatus: 'Verified' | 'Pending' | 'Rejected') => {
    await updatePaymentRecordStatusInFirestore(id, newStatus);
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.trxId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* 1. TOP CARD: Payment Gateway & Billing */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-800/60 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
              Payment Gateway & Billing
            </h2>
            {isAdminOrSuper && (
              <button
                onClick={handleOpenEditFee}
                className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-900/60 border border-indigo-700/60 hover:bg-indigo-800 transition-all cursor-pointer shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Fee</span>
              </button>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-slate-300 font-medium">Tour Package Fee:</span>
              <span className="text-white font-black font-mono">৳{packageFee} BDT</span>
            </div>

            <div className="flex items-center justify-between text-base sm:text-lg border-t border-indigo-900/60 pt-3">
              <span className="text-slate-200 font-bold">Total Payable Amount:</span>
              <span className="text-indigo-300 font-black font-mono text-xl sm:text-2xl drop-shadow">
                ৳{packageFee} BDT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ADMIN PAYMENT ACCOUNT CONTROLS CARD (Super Admin & Admin Only) */}
      {isAdminOrSuper && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-indigo-900/40 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Admin Payment Account Controls</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 text-[10px] font-extrabold uppercase border border-rose-500/30">
                  {currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                bKash এবং Nagad অ্যাকাউন্ট নম্বর (২টি বা ৩টি) অ্যাডমিন হিসেবে ইচ্ছামতো যুক্ত/মুছে এডিট করুন।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleOpenAccountEdit('bKash')}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit bKash ({bkashAccounts.length})</span>
            </button>

            <button
              onClick={() => handleOpenAccountEdit('Nagad')}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Nagad ({nagadAccounts.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SIDE-BY-SIDE GATEWAYS: bKash (Left Side) & Nagad (Right Side) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Select Payment Gateway & Number
        </h3>

        {/* 2 Columns: bKash on One Side, Nagad on Other Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT SIDE: bKash Gateway Column */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-pink-900/50 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-pink-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                  b
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-pink-400">bKash Payment Gateway</h4>
                  <p className="text-[10px] text-slate-400">{bkashAccounts.length} Active Numbers</p>
                </div>
              </div>

              {isAdminOrSuper && (
                <button
                  onClick={() => handleOpenAccountEdit('bKash')}
                  className="px-2.5 py-1 rounded-xl bg-pink-950/80 hover:bg-pink-900 text-pink-300 border border-pink-700/50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* bKash Numbers List */}
            <div className="space-y-2.5">
              {bkashAccounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setSubProvider('bKash');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-pink-950/60 border-pink-500 shadow-md shadow-pink-500/20 ring-1 ring-pink-500'
                        : 'bg-slate-950/70 border-slate-800 hover:border-pink-900/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-white truncate">{acc.label}</span>
                        <span className="px-1.5 py-0.5 rounded bg-pink-900/80 text-pink-200 text-[9px] font-extrabold uppercase">
                          {acc.type}
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-pink-400 mt-1">
                        {acc.number}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(acc.number);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all ${
                        copiedNumber === acc.number
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-pink-900/60 text-slate-200'
                      }`}
                    >
                      {copiedNumber === acc.number ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: Nagad Gateway Column */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-amber-900/50 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                  N
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-amber-400">Nagad Payment Gateway</h4>
                  <p className="text-[10px] text-slate-400">{nagadAccounts.length} Active Numbers</p>
                </div>
              </div>

              {isAdminOrSuper && (
                <button
                  onClick={() => handleOpenAccountEdit('Nagad')}
                  className="px-2.5 py-1 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/50 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Nagad Numbers List */}
            <div className="space-y-2.5">
              {nagadAccounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setSubProvider('Nagad');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-950/60 border-orange-500 shadow-md shadow-orange-500/20 ring-1 ring-orange-500'
                        : 'bg-slate-950/70 border-slate-800 hover:border-amber-900/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-white truncate">{acc.label}</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 text-[9px] font-extrabold uppercase">
                          {acc.type}
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-amber-400 mt-1">
                        {acc.number}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(acc.number);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all ${
                        copiedNumber === acc.number
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-amber-900/60 text-slate-200'
                      }`}
                    >
                      {copiedNumber === acc.number ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Account Display Box with QR & Step Instructions */}
        {selectedAccount && (
          <div
            className={`p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-5 transition-all ${
              selectedAccount.provider === 'bKash'
                ? 'bg-slate-900/95 border-pink-900/50'
                : 'bg-slate-900/95 border-orange-900/50'
            }`}
          >
            {/* Account Number & Copy */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-extrabold ${
                      selectedAccount.provider === 'bKash' ? 'text-pink-400' : 'text-amber-400'
                    }`}
                  >
                    {selectedAccount.label}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                    {selectedAccount.type}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 tracking-wider">
                  {selectedAccount.number}
                </div>
              </div>

              <button
                onClick={() => handleCopy(selectedAccount.number)}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all shrink-0 ${
                  copiedNumber === selectedAccount.number
                    ? 'bg-emerald-600 shadow-emerald-600/30'
                    : selectedAccount.provider === 'bKash'
                    ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/30'
                    : 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30'
                }`}
              >
                {copiedNumber === selectedAccount.number ? (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Number</span>
                  </>
                )}
              </button>
            </div>

            {/* Step Instructions */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>Payment Instructions</span>
              </h4>
              <div className="text-xs text-slate-300 space-y-2 whitespace-pre-line leading-relaxed font-sans">
                {selectedAccount.instructions}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm text-white shadow-xl cursor-pointer transition-all flex items-center justify-center gap-2 ${
                    selectedAccount.provider === 'bKash'
                      ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-600/30'
                      : 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>পেমেন্ট সাবমিট করুন (Submit Payment)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SUBMITTED PAYMENTS RECORDS TABLE (Super Admin & Admin Only) */}
      {isAdminOrSuper ? (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Submitted Payment History ({records.length})
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Entry</span>
              </button>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Name, Roll, TrxID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {(['All', 'Verified', 'Pending', 'Rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0 ${
                    filterStatus === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Student & Roll</th>
                    <th className="px-5 py-3.5">Provider & Account</th>
                    <th className="px-5 py-3.5">Amount (BDT)</th>
                    <th className="px-5 py-3.5">TrxID</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500 text-xs">
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-medium">
                          <div className="text-white font-bold">{rec.studentName}</div>
                          <div className="text-[11px] text-indigo-400 font-mono">{rec.rollNo}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              rec.provider === 'bKash'
                                ? 'bg-pink-950/80 text-pink-300 border border-pink-700/50'
                                : rec.provider === 'Nagad'
                                ? 'bg-orange-950/80 text-orange-300 border border-orange-700/50'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {rec.provider}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                            {rec.accountUsed}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">
                          ৳{rec.paidAmount}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-indigo-300">
                          {rec.trxId}
                        </td>
                        <td className="px-5 py-3.5">
                          {rec.status === 'Verified' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                          {rec.status === 'Pending' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                          {rec.status === 'Rejected' && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">{rec.date}</td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {rec.status !== 'Verified' && (
                              <button
                                onClick={() => handleUpdateRecordStatus(rec.id, 'Verified')}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Verify
                              </button>
                            )}
                            {rec.status !== 'Rejected' && (
                              <button
                                onClick={() => handleUpdateRecordStatus(rec.id, 'Rejected')}
                                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => {
                                // Add edit logic here
                                console.log('Edit payment:', rec.id);
                              }}
                              className="p-1 text-blue-400 hover:bg-blue-500/20 rounded cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this payment record?')) {
                                  await deletePaymentFromFirestore(rec.id);
                                }
                              }}
                              className="p-1 text-rose-400 hover:bg-rose-500/20 rounded cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 mt-4">
          <ShieldCheck className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
          <span>পেমেন্ট সাবমিট করার পর এডমিনদের ভেরিফিকেশনের জন্য পাঠানো হবে। সাবমিটেড হিস্ট্রি দেখার সুবিধা শুধুমাত্র এডমিনদের জন্য।</span>
        </div>
      )}

      {/* MODAL 1: EDIT TOUR PACKAGE FEE */}
      {isEditFeeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <span>Edit Tour Package Fee</span>
            </h3>

            <form onSubmit={handleSaveFee} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">
                  Package Amount (BDT)
                </label>
                <input
                  type="number"
                  required
                  value={tempFee}
                  onChange={(e) => setTempFee(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-base font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditFeeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-md"
                >
                  Save Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT bKash OR NAGAD NUMBERS WITH DYNAMIC ADD/DELETE (3 to 2, 1, etc) */}
      {editAccountsProvider && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit3
                  className={`w-4 h-4 ${
                    editAccountsProvider === 'bKash' ? 'text-pink-400' : 'text-amber-400'
                  }`}
                />
                <span>Edit {editAccountsProvider} Numbers ({editingAccountsList.length})</span>
              </h3>
              <button
                onClick={() => setEditAccountsProvider(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccounts} className="space-y-4">
              {editingAccountsList.map((acc, index) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">
                      {editAccountsProvider} Number #{index + 1}
                    </span>

                    {editingAccountsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEditingAccount(index)}
                        className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-rose-500/30"
                        title="Remove number"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Display Label
                      </label>
                      <input
                        type="text"
                        required
                        value={acc.label}
                        onChange={(e) => {
                          const copy = [...editingAccountsList];
                          copy[index].label = e.target.value;
                          setEditingAccountsList(copy);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        value={acc.number}
                        onChange={(e) => {
                          const copy = [...editingAccountsList];
                          copy[index].number = e.target.value;
                          setEditingAccountsList(copy);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Account Type
                    </label>
                    <select
                      value={acc.type}
                      onChange={(e) => {
                        const copy = [...editingAccountsList];
                        copy[index].type = e.target.value as any;
                        setEditingAccountsList(copy);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Merchant">Merchant</option>
                      <option value="Personal">Personal</option>
                      <option value="Send Money">Send Money</option>
                      <option value="Agent">Agent</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Payment Instructions (পেমেন্ট নির্দেশনাবলী)
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={acc.instructions}
                      onChange={(e) => {
                        const copy = [...editingAccountsList];
                        copy[index].instructions = e.target.value;
                        setEditingAccountsList(copy);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                      placeholder="পেমেন্ট করার ধাপগুলো এখানে লিখুন..."
                    />
                  </div>
                </div>
              ))}

              {/* Add New Number Button */}
              {editingAccountsList.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddEditingAccount}
                  className="w-full py-2.5 rounded-2xl border border-dashed border-slate-700 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-slate-950/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New {editAccountsProvider} Number</span>
                </button>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditAccountsProvider(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer ${
                    editAccountsProvider === 'bKash'
                      ? 'bg-pink-600 hover:bg-pink-500'
                      : 'bg-orange-600 hover:bg-orange-500'
                  }`}
                >
                  Save {editAccountsProvider} Numbers ({editingAccountsList.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STUDENT SUBMIT PAYMENT */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                পেমেন্ট তথ্য সাবমিট করুন
              </h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {subSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">পেমেন্ট সাবমিট সফল হয়েছে!</h4>
                <p className="text-xs text-slate-400">
                  এডমিন শীঘ্রই আপনার Transaction ID টি ভেরিফাই করবেন।
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    শিক্ষার্থীর নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={subStudentName}
                    onChange={(e) => setSubStudentName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    রোল / রেজিস্ট্রেশন নম্বর
                  </label>
                  <input
                    type="text"
                    required
                    value={subRollNo}
                    onChange={(e) => setSubRollNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      পেমেন্ট মেথড
                    </label>
                    <select
                      value={subProvider}
                      onChange={(e) => setSubProvider(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      টাকার পরিমাণ (BDT)
                    </label>
                    <input
                      type="number"
                      required
                      value={subAmount}
                      onChange={(e) => setSubAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: BK88219901"
                    value={subTrxId}
                    onChange={(e) => setSubTrxId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    নোট বা বিশেষ তথ্য (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: বিকাশ মার্চেন্ট অপশন থেকে পেমেন্ট করেছি"
                    value={subNote}
                    onChange={(e) => setSubNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-md"
                  >
                    ভেরিফিকেশনের জন্য পাঠান
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


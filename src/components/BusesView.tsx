import React, { useState, useEffect, useRef } from 'react';
import { BusPackage, BusSeat, Batchmate } from '../types';
import { UserSession } from './AuthScreen';
import {
  Bus,
  Plus,
  Edit3,
  Trash2,
  Phone,
  User,
  ShieldCheck,
  X,
  Armchair,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import {
  subscribeBuses,
  addBusToFirestore,
  updateBusInFirestore,
  deleteBusFromFirestore
} from '../firebase';
import { createDefaultSeatsMap, getNormalizedSeatsMap, sanitizeSeatsMapForFirestore, INITIAL_BUSES } from '../data/initialData';

interface BusesViewProps {
  currentUser?: UserSession | null;
  batchmates?: Batchmate[];
}

// Compress image to small base64 (~20-50KB) for fast Firestore storage
const compressAvatarFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return resolve('');
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 350;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = (err) => reject(err);
  });
};

export const BusesView: React.FC<BusesViewProps> = ({ currentUser, batchmates }) => {
  const [buses, setBuses] = useState<BusPackage[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>('');

  // Selected Seat Modal state
  const [selectedSeat, setSelectedSeat] = useState<BusSeat | null>(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  // Add / Edit Bus Modal state
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusPackage | null>(null);

  // Bus Form Fields
  const [busName, setBusName] = useState('');
  const [busRegNo, setBusRegNo] = useState('');
  const [busType, setBusType] = useState('2+2 AC Luxury Coach');
  const [busTotalSeats, setBusTotalSeats] = useState<number>(45);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');

  // Student Booking Inputs inside modal
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingGender, setBookingGender] = useState<'male' | 'female'>('male');
  const [bookingPhotoUrl, setBookingPhotoUrl] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Auto-fill student info when phone number is typed by admin/superadmin
  useEffect(() => {
    if (isAdminOrSuper && bookingPhone && bookingPhone.length >= 10) {
      const match = batchmates?.find((b) => b.phone?.trim() === bookingPhone.trim());
      if (match) {
        if (!bookingName) setBookingName(match.name);
        if (match.photoUrl) setBookingPhotoUrl(match.photoUrl);
      }
    }
  }, [bookingPhone, isAdminOrSuper, batchmates, bookingName]);

  // Subscribe to buses in realtime
  useEffect(() => {
    const unsub = subscribeBuses((data) => {
      setBuses(data);
      if (!selectedBusId && data.length > 0) {
        setSelectedBusId(data[0].id);
      }
    });
    return () => unsub();
  }, []);

  const activeBus = buses.find((b) => b.id === selectedBusId) || buses[0] || INITIAL_BUSES[0];

  // Helper to get seats array from activeBus seats map (guaranteeing ALL seats exist in exact order)
  const getSeatsArray = (bus: BusPackage): BusSeat[] => {
    const normalizedMap = getNormalizedSeatsMap(bus);
    const seatsList = Object.values(normalizedMap);

    // Sort strictly by Row Letter (A, B, C...) then Column Number (1, 2, 3, 4)
    return seatsList.sort((a, b) => {
      const rowA = a.id.charAt(0);
      const rowB = b.id.charAt(0);
      if (rowA !== rowB) {
        return rowA.localeCompare(rowB);
      }
      const numA = parseInt(a.id.substring(1), 10) || 0;
      const numB = parseInt(b.id.substring(1), 10) || 0;
      return numA - numB;
    });
  };

  // Open Bus Edit Modal
  const handleOpenEditBus = () => {
    if (!activeBus) return;
    setEditingBus(activeBus);
    setBusName(activeBus.name);
    setBusRegNo(activeBus.regNo);
    setBusType(activeBus.type || '2+2 AC Luxury Coach');
    setBusTotalSeats(activeBus.totalSeats || 45);
    setDriverName(activeBus.driverName || '');
    setDriverPhone(activeBus.driverPhone || '');
    setLeaderName(activeBus.leaderName || '');
    setLeaderPhone(activeBus.leaderPhone || '');
    setIsBusModalOpen(true);
  };

  // Open Add Bus Modal
  const handleOpenAddBus = () => {
    setEditingBus(null);
    setBusName('');
    setBusRegNo('Dhaka Metro-Ba-');
    setBusType('2+2 AC Luxury Coach');
    setBusTotalSeats(45);
    setDriverName('Md. Driver');
    setDriverPhone('01700-000000');
    setLeaderName(currentUser?.name || 'Bus Leader');
    setLeaderPhone(currentUser?.phone || '01800-000000');
    setIsBusModalOpen(true);
  };

  // Save Bus (Add or Edit)
  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busName.trim()) return;

    const busData = {
      name: busName.trim(),
      regNo: busRegNo.trim() || 'N/A',
      type: busType.trim() || '2+2 AC Luxury Coach',
      totalSeats: Number(busTotalSeats) || 45,
      driverName: driverName.trim() || 'N/A',
      driverPhone: driverPhone.trim() || 'N/A',
      leaderName: leaderName.trim() || 'N/A',
      leaderPhone: leaderPhone.trim() || 'N/A',
      seats: editingBus?.seats || createDefaultSeatsMap(Number(busTotalSeats) || 45)
    };

    if (editingBus) {
      setBuses((prev) =>
        prev.map((b) => (b.id === editingBus.id ? { ...b, ...busData } : b))
      );
      await updateBusInFirestore(editingBus.id, busData);
    } else {
      const tempId = 'bus-' + Date.now();
      setBuses((prev) => [...prev, { id: tempId, ...busData }]);
      const newId = await addBusToFirestore(busData);
      setSelectedBusId(newId || tempId);
    }

    setIsBusModalOpen(false);
  };

  // Delete Bus
  const handleDeleteBus = async () => {
    if (!activeBus) return;
    setBuses((prev) => prev.filter((b) => b.id !== activeBus.id));
    const remaining = buses.filter((b) => b.id !== activeBus.id);
    if (remaining.length > 0) {
      setSelectedBusId(remaining[0].id);
    } else {
      setSelectedBusId('');
    }
    await deleteBusFromFirestore(activeBus.id);
  };

  // Open Seat Click Modal
  const handleSeatClick = (seat: BusSeat) => {
    setSelectedSeat(seat);
    setBookingError('');
    const initialName = seat.status === 'booked' ? (seat.bookedBy || '') : '';
    const initialPhone = seat.status === 'booked' ? (seat.bookedPhone || '') : '';
    setBookingName(initialName);
    setBookingPhone(initialPhone);
    setBookingGender(seat.gender || (seat.status === 'female_only' ? 'female' : 'male'));

    // Auto find student photo from seat or batchmates
    let foundPhoto = seat.bookedPhotoUrl || '';
    if (!foundPhoto && initialName) {
      const match = batchmates?.find(
        (b) =>
          b.name.trim().toLowerCase() === initialName.trim().toLowerCase() ||
          (b.phone && initialPhone && b.phone.trim() === initialPhone.trim())
      );
      if (match?.photoUrl) {
        foundPhoto = match.photoUrl;
      }
    }
    setBookingPhotoUrl(foundPhoto);
    setIsSeatModalOpen(true);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    try {
      const compressed = await compressAvatarFile(file);
      if (compressed) {
        setBookingPhotoUrl(compressed);
      }
    } catch (err) {
      console.error('Photo compression failed:', err);
    } finally {
      setIsCompressingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Update a seat's status in the active bus
  const updateSeatStatus = async (
    seatId: string,
    newStatus: 'available' | 'booked' | 'male_only' | 'female_only' | 'locked',
    bName?: string,
    bPhone?: string,
    bGender?: 'male' | 'female',
    bPhotoUrl?: string
  ) => {
    if (!activeBus) return;

    // Get complete normalized map so no seats are lost or misplaced
    const normalizedSeatsMap = getNormalizedSeatsMap(activeBus);

    const isBooked = newStatus === 'booked';
    const isMaleOnly = newStatus === 'male_only';
    const isFemaleOnly = newStatus === 'female_only';

    const updatedSeat: BusSeat = {
      ...normalizedSeatsMap[seatId],
      id: seatId,
      status: newStatus,
      bookedBy: isBooked ? bName : undefined,
      bookedPhone: isBooked ? bPhone || '' : undefined,
      bookedPhotoUrl: isBooked ? bPhotoUrl || '' : undefined,
      gender: isBooked ? (bGender || 'male') : (isMaleOnly ? 'male' : isFemaleOnly ? 'female' : undefined)
    };

    const updatedSeatsMap = {
      ...normalizedSeatsMap,
      [seatId]: updatedSeat
    };

    // Local Optimistic Update
    setBuses((prev) =>
      prev.map((b) =>
        b.id === activeBus.id ? { ...b, seats: updatedSeatsMap } : b
      )
    );

    setSelectedSeat(updatedSeat);

    // Save to Firestore
    await updateBusInFirestore(activeBus.id, { seats: sanitizeSeatsMapForFirestore(updatedSeatsMap) });
  };

  // Handle student or admin booking submit
  const handleBookSeat = () => {
    if (!selectedSeat) return;

    if (!bookingName.trim()) {
      setBookingError('দয়া করে শিক্ষার্থীর নাম লিখুন।');
      return;
    }

    // If seat is booked by another student and current user is neither admin/super nor the owner
    if (
      selectedSeat.status === 'booked' &&
      selectedSeat.bookedBy &&
      selectedSeat.bookedBy !== currentUser?.name &&
      !isAdminOrSuper
    ) {
      setBookingError('এই সিটটি অন্য শিক্ষার্থীর নামে বুক করা আছে। আপনি এটি পরিবর্তন করতে পারবেন না।');
      return;
    }

    setBookingError('');
    updateSeatStatus(
      selectedSeat.id,
      'booked',
      bookingName.trim(),
      bookingPhone.trim(),
      bookingGender,
      bookingPhotoUrl
    );
    setIsSeatModalOpen(false);
  };

  const seatsList = activeBus ? getSeatsArray(activeBus) : [];

  // Group seats into 4-seat rows for 2x2 layout
  const rows: BusSeat[][] = [];
  for (let i = 0; i < seatsList.length; i += 4) {
    rows.push(seatsList.slice(i, i + 4));
  }

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Bus & Seat Booking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">পছন্দের বাস ও সিট বুক করুন</p>
        </div>

        {isAdminOrSuper && (
          <button
            onClick={handleOpenAddBus}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bus</span>
          </button>
        )}
      </div>

      {/* BUS SELECTOR TABS */}
      {buses.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {buses.map((bus) => {
            const isSelected = bus.id === activeBus?.id;
            return (
              <button
                key={bus.id}
                onClick={() => setSelectedBusId(bus.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all text-left shrink-0 flex items-center gap-3 cursor-pointer min-w-[220px] ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-400'
                  }`}
                >
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm line-clamp-1">{bus.name}</h3>
                  <span className="text-[11px] opacity-80 block font-medium mt-0.5">
                    {bus.totalSeats || 45} Seats
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ACTIVE BUS INFO CARD */}
      {activeBus && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">{activeBus.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeBus.totalSeats || 45} Seats (2x2)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Reg: {activeBus.regNo} • {activeBus.type || '2+2 AC Luxury Coach'}
              </p>
            </div>

            {/* Admin Bus Edit / Delete Controls */}
            {isAdminOrSuper && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleOpenEditBus}
                  className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Bus</span>
                </button>
                <button
                  onClick={handleDeleteBus}
                  className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Bus</span>
                </button>
              </div>
            )}
          </div>

          {/* Driver & Leader Info Footer */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-slate-400 font-normal">Driver:</strong> {activeBus.driverName}
              </span>
              <a
                href={`tel:${activeBus.driverPhone}`}
                className="text-emerald-400 font-mono font-bold flex items-center gap-1 hover:underline ml-auto sm:ml-2"
              >
                <Phone className="w-3 h-3" />
                {activeBus.driverPhone}
              </a>
            </div>

            {activeBus.leaderName && (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong className="text-slate-400 font-normal">Leader:</strong> {activeBus.leaderName}
                </span>
                <a
                  href={`tel:${activeBus.leaderPhone}`}
                  className="text-indigo-400 font-mono font-bold flex items-center gap-1 hover:underline ml-auto sm:ml-2"
                >
                  <Phone className="w-3 h-3" />
                  {activeBus.leaderPhone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEGEND BAR */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-300 font-semibold shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span>Available (খালি)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
          <span>Booked (বুকড)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50" />
          <span>Male Only (ছেলের জন্য)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50" />
          <span>Female Only (মেয়েদের জন্য)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-600 shadow-sm" />
          <span>Locked (লকড)</span>
        </div>
      </div>

      {/* BUS SEATING CONTAINER */}
      {activeBus && (
        <div className="p-5 sm:p-8 rounded-3xl bg-slate-950/90 border border-slate-800 max-w-xl mx-auto shadow-2xl space-y-6">
          {/* FRONT CABIN BAR */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <span>🚪 FRONT DOOR</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <span>🛞 DRIVER</span>
            </div>
          </div>

          {/* 2x2 SEAT GRID */}
          <div className="space-y-3">
            {rows.map((rowSeats, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-5 gap-2 sm:gap-3 items-center">
                {/* Left 2 seats (Col 1 & Col 2) */}
                {rowSeats.slice(0, 2).map((seat) => renderSeatButton(seat))}

                {/* AISLE Middle Gap */}
                <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center select-none">
                  AISLE
                </div>

                {/* Right 2 seats (Col 3 & Col 4) */}
                {rowSeats.slice(2, 4).map((seat) => renderSeatButton(seat))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEAT DETAILS MODAL */}
      {isSeatModalOpen && selectedSeat && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-center relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSeatModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Armchair Icon & Title */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                <Armchair className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">
                Seat Details ({selectedSeat.id})
              </h3>
            </div>

            {/* Status Display */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Status:</span>
              <span
                className={`px-3 py-1 rounded-xl font-black uppercase tracking-wider text-[11px] ${
                  selectedSeat.status === 'available'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : selectedSeat.status === 'booked'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : selectedSeat.status === 'male_only'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : selectedSeat.status === 'female_only'
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {selectedSeat.status === 'available'
                  ? 'AVAILABLE'
                  : selectedSeat.status === 'booked'
                  ? 'BOOKED'
                  : selectedSeat.status === 'male_only'
                  ? 'MALE ONLY'
                  : selectedSeat.status === 'female_only'
                  ? 'FEMALE ONLY'
                  : 'LOCKED'}
              </span>
            </div>

            {/* Booked Student Profile Info Card */}
            {selectedSeat.status === 'booked' && (
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-left text-xs space-y-3">
                <div className="flex items-center gap-3">
                  {selectedSeat.bookedPhotoUrl ? (
                    <img
                      src={selectedSeat.bookedPhotoUrl}
                      alt={selectedSeat.bookedBy}
                      className="w-14 h-14 rounded-full object-cover border-2 border-indigo-400 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-indigo-600 text-white font-black text-lg flex items-center justify-center border-2 border-indigo-400 shadow-md shrink-0">
                      {(selectedSeat.bookedBy || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      {selectedSeat.bookedBy || 'Student'}
                    </h4>
                    {selectedSeat.bookedPhone && (
                      <p className="text-slate-300 font-mono text-[11px] mt-0.5">
                        Phone: {selectedSeat.bookedPhone}
                      </p>
                    )}
                    {selectedSeat.gender && (
                      <p className="text-indigo-300 text-[10px] font-bold uppercase mt-1">
                        Gender: {selectedSeat.gender}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {bookingError && (
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold text-left">
                {bookingError}
              </div>
            )}

            {/* Booking Form Inputs (When seat is available or modifying) */}
            {selectedSeat.status !== 'locked' && (
              <div className="space-y-3 text-left pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-white">
                  {selectedSeat.status === 'booked' ? 'বুকিং এর তথ্য পরিবর্তন করুন:' : 'বুকিং শিক্ষার্থীর তথ্য:'}
                </p>

                {/* Name */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    শিক্ষার্থীর নাম (Student Name)
                  </label>
                  <input
                    type="text"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="যেমন: Tanvir Tuhin"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    ফোন নম্বর (Phone Number)
                  </label>
                  <input
                    type="text"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="01700-000000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Photo Selection / Upload */}
                {(!isAdminOrSuper || bookingPhotoUrl) && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      প্রোফাইল ফটো (Profile Photo)
                    </label>
                    <div className="flex items-center gap-3">
                      {bookingPhotoUrl ? (
                        <img
                          src={bookingPhotoUrl}
                          alt="Preview"
                          className="w-10 h-10 rounded-full object-cover border border-indigo-400 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      
                      {!isAdminOrSuper && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isCompressingPhoto}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{bookingPhotoUrl ? 'ছবি পরিবর্তন' : 'ফটো আপলোড'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Gender */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    জেন্ডার (Gender)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingGender('male')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        bookingGender === 'male'
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Male (ছাত্র)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingGender('female')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        bookingGender === 'female'
                          ? 'bg-fuchsia-600 border-fuchsia-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      Female ( ছাত্রী)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN CONTROLS (SET SEAT TYPE / STATUS) */}
            {isAdminOrSuper && (
              <div className="space-y-2 text-left pt-2 border-t border-slate-800">
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider text-center">
                  Admin Controls (Set Seat Type/Status):
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSeatStatus(selectedSeat.id, 'male_only')}
                    className="py-2.5 rounded-xl bg-sky-950 hover:bg-sky-900 border border-sky-700/60 text-sky-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    Male Only
                  </button>

                  <button
                    onClick={() => updateSeatStatus(selectedSeat.id, 'female_only')}
                    className="py-2.5 rounded-xl bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-700/60 text-fuchsia-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    Female Only
                  </button>

                  <button
                    onClick={() => updateSeatStatus(selectedSeat.id, 'locked')}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                  >
                    Lock Seat
                  </button>

                  <button
                    onClick={() => updateSeatStatus(selectedSeat.id, 'available')}
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition-all shadow-md"
                  >
                    Make Free
                  </button>
                </div>
              </div>
            )}

            {/* MODAL BOTTOM ACTION BUTTONS */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSeatModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-extrabold text-xs transition-all cursor-pointer"
              >
                Close
              </button>

              {selectedSeat.status !== 'locked' && (
                <button
                  type="button"
                  onClick={handleBookSeat}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/30"
                >
                  {selectedSeat.status === 'booked' ? 'Update Booking' : 'Book Seat Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT BUS MODAL */}
      {isBusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-indigo-400" />
                <span>{editingBus ? 'Edit Bus' : 'Add New Bus'}</span>
              </h3>
              <button
                onClick={() => setIsBusModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBus} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Bus Name</label>
                <input
                  type="text"
                  required
                  value={busName}
                  onChange={(e) => setBusName(e.target.value)}
                  placeholder="e.g. Green Line Volvo - AC Luxury Coach"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Registration No</label>
                  <input
                    type="text"
                    required
                    value={busRegNo}
                    onChange={(e) => setBusRegNo(e.target.value)}
                    placeholder="Dhaka Metro-Ba-14-9821"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Total Seats</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="60"
                    value={busTotalSeats}
                    onChange={(e) => setBusTotalSeats(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Coach Type</label>
                <input
                  type="text"
                  value={busType}
                  onChange={(e) => setBusType(e.target.value)}
                  placeholder="2+2 AC Luxury Coach"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Md. Driver"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="01711-223344"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Leader Name</label>
                  <input
                    type="text"
                    value={leaderName}
                    onChange={(e) => setLeaderName(e.target.value)}
                    placeholder="Tanvir Tuhin"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Leader Phone</label>
                  <input
                    type="text"
                    value={leaderPhone}
                    onChange={(e) => setLeaderPhone(e.target.value)}
                    placeholder="01800-000000"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBusModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white font-extrabold bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer transition-all"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper render for single seat button displaying student photo & name when booked
  function renderSeatButton(seat: BusSeat) {
    const isBooked = seat.status === 'booked';
    const isMaleOnly = seat.status === 'male_only';
    const isFemaleOnly = seat.status === 'female_only';
    const isLocked = seat.status === 'locked';

    // Find student photo for booked seat
    let studentPhoto = seat.bookedPhotoUrl || '';
    if (isBooked && !studentPhoto) {
      const match = batchmates?.find(
        (b) =>
          b.name.trim().toLowerCase() === (seat.bookedBy || '').trim().toLowerCase() ||
          (b.phone && seat.bookedPhone && b.phone.trim() === seat.bookedPhone.trim())
      );
      if (match?.photoUrl) {
        studentPhoto = match.photoUrl;
      } else if (currentUser?.avatarUrl && currentUser.name === seat.bookedBy) {
        studentPhoto = currentUser.avatarUrl;
      }
    }

    let style = 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300 hover:bg-emerald-900 shadow-emerald-950/50';
    let statusLabel = 'Free';

    if (isBooked) {
      style = 'bg-indigo-950/90 border-indigo-500/80 text-indigo-200 hover:bg-indigo-900 shadow-indigo-950/50';
      statusLabel = 'Booked';
    } else if (isMaleOnly) {
      style = 'bg-sky-950/80 border-sky-500/80 text-sky-300 hover:bg-sky-900 shadow-sky-950/50';
      statusLabel = 'Male';
    } else if (isFemaleOnly) {
      style = 'bg-pink-950/80 border-pink-500/80 text-pink-300 hover:bg-pink-900 shadow-pink-950/50';
      statusLabel = 'Female';
    } else if (isLocked) {
      style = 'bg-slate-900/90 border-slate-700 text-slate-500 cursor-not-allowed';
      statusLabel = 'Locked';
    }

    return (
      <button
        key={seat.id}
        onClick={() => handleSeatClick(seat)}
        className={`p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col items-center justify-between cursor-pointer shadow-md min-h-[82px] sm:min-h-[92px] w-full relative overflow-hidden ${style}`}
      >
        {/* Seat ID Header */}
        <div className="flex items-center justify-between w-full text-[10px] sm:text-[11px] font-black z-10">
          <span className="px-1.5 py-0.5 rounded-md bg-black/50 border border-white/10 text-white font-mono">
            {seat.id}
          </span>
          {isBooked && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Booked" />
          )}
        </div>

        {/* Center Content: Booked -> Student Photo & Name 100% */}
        {isBooked ? (
          <div className="flex flex-col items-center my-0.5 w-full z-10 space-y-1">
            {studentPhoto ? (
              <img
                src={studentPhoto}
                alt={seat.bookedBy || 'Student'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-indigo-400 shadow-md"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center border-2 border-indigo-400 shadow-md">
                {(seat.bookedBy || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[10px] font-bold text-white truncate max-w-full px-1 text-center leading-tight">
              {seat.bookedBy || 'Student'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center my-1 space-y-1">
            <Armchair className="w-5 h-5 opacity-90" />
            <span className="text-[10px] font-extrabold tracking-wide uppercase opacity-85">
              {statusLabel}
            </span>
          </div>
        )}
      </button>
    );
  }
};

import React, { useState, useEffect } from 'react';
import { TourPackage } from '../types';
import { UserSession } from './AuthScreen';
import {
  Compass,
  Plus,
  Search,
  Calendar,
  MapPin,
  User,
  Phone,
  DollarSign,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  subscribeTours,
  addTourToFirestore,
  updateTourInFirestore,
  deleteTourFromFirestore
} from '../firebase';

interface ToursViewProps {
  currentUser: UserSession | null;
}

export const ToursView: React.FC<ToursViewProps> = ({ currentUser }) => {
  const [tours, setTours] = useState<TourPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTourId, setSelectedTourId] = useState<string>(() => {
    return localStorage.getItem('degree_tour_selected_id') || '';
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<TourPackage | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formEmergencyContact, setFormEmergencyContact] = useState('');
  const [formFee, setFormFee] = useState<number>(3200);
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Upcoming' | 'Completed'>('Active');

  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Subscribe to real-time tours
  useEffect(() => {
    const unsub = subscribeTours((data) => {
      setTours(data);
      // If no selected tour yet, auto-select first active tour
      if (!selectedTourId && data.length > 0) {
        const active = data.find((t) => t.status === 'Active') || data[0];
        setSelectedTourId(active.id);
        localStorage.setItem('degree_tour_selected_id', active.id);
      }
    });
    return () => unsub();
  }, []);

  const handleSelectTour = (tour: TourPackage) => {
    setSelectedTourId(tour.id);
    localStorage.setItem('degree_tour_selected_id', tour.id);
    localStorage.setItem('degree_tour_selected_name', tour.name);
    localStorage.setItem('degree_tour_selected_fee', tour.fee.toString());
  };

  const handleOpenCreateModal = () => {
    setEditingTour(null);
    setFormName('');
    setFormDestination('');
    setFormStartDate('');
    setFormEndDate('');
    setFormOrganizer(currentUser?.name || 'Degree Tour Committee');
    setFormEmergencyContact(currentUser?.phone || '01700-123456');
    setFormFee(3200);
    setFormDescription('');
    setFormStatus('Active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tour: TourPackage) => {
    setEditingTour(tour);
    setFormName(tour.name);
    setFormDestination(tour.destination);
    setFormStartDate(tour.startDate);
    setFormEndDate(tour.endDate);
    setFormOrganizer(tour.organizer);
    setFormEmergencyContact(tour.emergencyContact);
    setFormFee(tour.fee);
    setFormDescription(tour.description || '');
    setFormStatus(tour.status || 'Active');
    setIsModalOpen(true);
  };

  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDestination.trim()) return;

    const tourData = {
      name: formName.trim(),
      destination: formDestination.trim(),
      startDate: formStartDate || new Date().toISOString().split('T')[0],
      endDate: formEndDate || new Date().toISOString().split('T')[0],
      organizer: formOrganizer.trim() || 'Tour Committee',
      emergencyContact: formEmergencyContact.trim() || '01700-000000',
      fee: Number(formFee) || 0,
      description: formDescription.trim(),
      status: formStatus,
      createdAt: editingTour?.createdAt || Date.now()
    };

    if (editingTour) {
      // Optimistic update
      setTours((prev) =>
        prev.map((t) => (t.id === editingTour.id ? { ...t, ...tourData } : t))
      );
      await updateTourInFirestore(editingTour.id, tourData);
    } else {
      // Create new
      const tempId = 'tour-' + Date.now();
      setTours((prev) => [...prev, { id: tempId, ...tourData }]);
      await addTourToFirestore(tourData);
    }

    setIsModalOpen(false);
  };

  const handleDeleteTour = async (id: string, name: string) => {
    setTours((prev) => prev.filter((t) => t.id !== id));
    if (selectedTourId === id) {
      setSelectedTourId('');
      localStorage.removeItem('degree_tour_selected_id');
    }
    await deleteTourFromFirestore(id);
  };

  const filteredTours = tours.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.organizer.toLowerCase().includes(q)
    );
  });

  const selectedTour = tours.find((t) => t.id === selectedTourId);

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <span>Tours</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
              {tours.length} {tours.length === 1 ? 'tour' : 'tours'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAdminOrSuper
              ? 'অ্যাডমিন হিসেবে ট্যুর প্যাকেজ তৈরি, এডিট ও কাস্টমাইজ করুন।'
              : 'শিক্ষার্থীরা উপলব্ধ ট্যুর প্যাকেজ দেখে নির্বাচন করুন।'}
          </p>
        </div>

        {isAdminOrSuper && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tour</span>
          </button>
        )}
      </div>

      {/* Selected Tour Banner (For Students & Admins) */}
      {selectedTour && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-md">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  আপনার নির্বাচিত ট্যুর (Selected Tour)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Choice
                </span>
              </div>
              <h3 className="font-extrabold text-white text-sm sm:text-base mt-0.5">
                {selectedTour.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">ট্যুর ফি</span>
              <span className="text-sm font-black text-amber-400">৳{selectedTour.fee.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tours..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500/80 transition-all shadow-inner"
        />
      </div>

      {/* EMPTY STATE */}
      {filteredTours.length === 0 && (
        <div className="p-10 sm:p-16 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400 shadow-xl">
            <Compass className="w-8 h-8" />
          </div>

          <div className="space-y-1 max-w-sm">
            <h3 className="text-lg font-extrabold text-white">No tours scheduled</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create new tours here for students to view and select.
            </p>
          </div>

          {isAdminOrSuper && (
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Tour</span>
            </button>
          )}
        </div>
      )}

      {/* TOURS LIST GRID */}
      {filteredTours.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTours.map((tour) => {
            const isSelected = selectedTourId === tour.id;

            return (
              <div
                key={tour.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            tour.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : tour.status === 'Upcoming'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {tour.status || 'Active'}
                        </span>

                        {isSelected && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3 text-indigo-400" />
                            Selected
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-white mt-2 leading-snug">
                        {tour.name}
                      </h3>
                    </div>

                    {/* Admin Action Buttons (Edit & Delete) */}
                    {isAdminOrSuper && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(tour)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60"
                          title="Edit Tour"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTour(tour.id, tour.name)}
                          className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-all cursor-pointer border border-rose-900/50"
                          title="Delete Tour"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-200">{tour.destination}</span>
                  </div>

                  {/* Dates & Organizer */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">ভ্রমণ তারিখ</span>
                      <span className="text-slate-300 font-mono font-semibold flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        {tour.startDate}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">ফেরার তারিখ</span>
                      <span className="text-slate-300 font-mono font-semibold flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        {tour.endDate}
                      </span>
                    </div>
                  </div>

                  {/* Details Description */}
                  {tour.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {tour.description}
                    </p>
                  )}

                  {/* Organizer & Contact */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {tour.organizer}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {tour.emergencyContact}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Fee & Select Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">ট্যুর ফি</span>
                    <span className="text-base font-black text-amber-400">
                      ৳{tour.fee.toLocaleString()}
                    </span>
                  </div>

                  {isSelected ? (
                    <div className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>নির্বাচিত (Selected)</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectTour(tour)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>ট্যুর নির্বাচন করুন</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT TOUR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <span>{editingTour ? 'Edit Tour' : 'Create Tour'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTour} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tour Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Degree Tour 3.0: Sajek Valley"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  required
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  placeholder="e.g. Sajek Valley, Khagrachari"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tour Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Return Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Organizer
                  </label>
                  <input
                    type="text"
                    required
                    value={formOrganizer}
                    onChange={(e) => setFormOrganizer(e.target.value)}
                    placeholder="e.g. Tour Committee"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    required
                    value={formEmergencyContact}
                    onChange={(e) => setFormEmergencyContact(e.target.value)}
                    placeholder="e.g. 01700-000000"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tour Fee (BDT)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={formFee}
                    onChange={(e) => setFormFee(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-extrabold text-amber-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description / Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Additional information or highlights..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer transition-all"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

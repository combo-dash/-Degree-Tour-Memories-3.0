import React from 'react';
import { ScheduleItem } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Bus,
  Hotel,
  Mountain,
  Utensils,
  Music,
  Camera,
  Phone,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

interface TourItineraryProps {
  schedule: ScheduleItem[];
}

export const TourItinerary: React.FC<TourItineraryProps> = ({ schedule }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'bus':
        return <Bus className="w-5 h-5 text-amber-400" />;
      case 'hotel':
        return <Hotel className="w-5 h-5 text-sky-400" />;
      case 'mountain':
        return <Mountain className="w-5 h-5 text-emerald-400" />;
      case 'food':
        return <Utensils className="w-5 h-5 text-rose-400" />;
      case 'party':
      case 'music':
        return <Music className="w-5 h-5 text-indigo-400" />;
      default:
        return <Camera className="w-5 h-5 text-amber-400" />;
    }
  };

  // Group by Day Number
  const days = [1, 2, 3, 4, 5];

  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-amber-400" />
          <span>Tour Itinerary</span>
        </h2>
      </div>

      {/* Days Loop */}
      <div className="space-y-6">
        {days.map((dayNum) => {
          const itemsForDay = schedule.filter((s) => s.dayNumber === dayNum);
          if (itemsForDay.length === 0) return null;

          return (
            <div
              key={dayNum}
              className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl"
            >
              {/* Day Header */}
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md">
                  দিন {dayNum}
                </span>
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {itemsForDay[0]?.dayTitle || `দিন ${dayNum} কার্যক্রম`}
                </h3>
              </div>

              {/* Day Items Timeline */}
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-800 ml-3">
                {itemsForDay.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-[35px] top-0.5 p-1.5 rounded-full bg-slate-800 border-2 border-slate-700 group-hover:border-amber-400 transition-colors shadow-md">
                      {getIcon(item.iconType)}
                    </div>

                    {/* Content Box */}
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2 hover:border-slate-600 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {item.time}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          {item.location}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm sm:text-base">
                        {item.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {item.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency Contacts & Accommodation Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>জরুরী তথ্য ও হেল্পলাইন (Emergency Contacts)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <strong className="text-rose-400 block text-sm">ট্যুর কনভেনার ও হেল্পলাইন</strong>
            <p className="text-slate-300">Degree Tour Management Team</p>
            <p className="text-slate-400 flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3 text-emerald-400" /> 01700-123456
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <strong className="text-amber-400 block text-sm">জরুরী মেডিকেল ও সাপোর্ট</strong>
            <p className="text-slate-300">Tour Support Committee</p>
            <p className="text-slate-400 flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3 text-emerald-400" /> 01800-654321
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

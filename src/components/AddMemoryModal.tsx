import React, { useState, useRef } from 'react';
import { Memory } from '../types';
import { X, UploadCloud, Film, CheckCircle2, Loader2, Link as LinkIcon, Camera } from 'lucide-react';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (memory: Omit<Memory, 'id' | 'likes' | 'timestamp' | 'comments'>) => void;
  currentUser?: { name: string; role: string } | null;
}

// Canvas-based image compressor to avoid giant base64 strings
const compressImageFile = (file: File): Promise<string> => {
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
        const maxDim = 750;

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
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = (err) => reject(err);
  });
};

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [selectedFileUrl, setSelectedFileUrl] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('Sajek Valley');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    setErrorMsg('');
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));

    setIsProcessing(true);
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file);
        setSelectedFileUrl(compressed);
      } else if (file.type.startsWith('video/')) {
        if (file.size > 15 * 1024 * 1024) {
          setErrorMsg('ভিডিওটি সাইজে ১৫ মেগাবাইটের বেশি। অনুগ্রহ করে ছোট ক্লিপ বা লিঙ্ক ব্যবহার করুন।');
          setIsProcessing(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedFileUrl(e.target?.result as string || '');
          setIsProcessing(false);
        };
        reader.readAsDataURL(file);
        return;
      } else {
        setErrorMsg('অনুগ্রহ করে ছবি বা ভিডিও ফাইল সিলেক্ট করুন।');
      }
    } catch (err) {
      console.error('File processing error:', err);
      setErrorMsg('ফাইলটি রিড করতে সমস্যা হয়েছে!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalUrl = activeTab === 'upload' ? selectedFileUrl : urlInput.trim();

    if (!finalUrl) {
      setErrorMsg('অনুগ্রহ করে ফটো/ভিডিও ফাইল নির্বাচন করুন অথবা লিঙ্ক প্রদান করুন।');
      return;
    }

    const isVideo =
      finalUrl.startsWith('data:video') ||
      finalUrl.endsWith('.mp4') ||
      finalUrl.endsWith('.webm') ||
      fileName.endsWith('.mp4');

    const finalTitle = title.trim() || fileName || 'Tour Memory';
    const finalAuthor = currentUser?.name || 'Batchmate';

    onSubmit({
      title: finalTitle,
      description: finalTitle,
      category: isVideo ? 'Video' : 'Photo',
      authorName: finalAuthor,
      authorRole: currentUser?.role === 'superadmin' ? 'Super Admin' : currentUser?.role === 'admin' ? 'Admin' : 'Batchmate',
      imageUrl: finalUrl,
      location: location.trim() || 'Degree Tour Spot',
      date: new Date().toISOString().split('T')[0],
      tags: ['DegreeTour3.0'],
      likedBy: []
    });

    // Reset & Close
    setSelectedFileUrl('');
    setUrlInput('');
    setFileName('');
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Upload Photo or Video to Gallery</h3>
            <p className="text-xs text-slate-400">
              ডিভাইস থেকে ফটো/ভিডিও সিলেক্ট করুন অথবা মিডিয়া লিঙ্ক প্রদান করুন
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>ডিভাইস আপলোড (Device)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'url'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>মিডিয়া লিঙ্ক (URL)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {errorMsg}
            </p>
          )}

          {activeTab === 'upload' ? (
            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                isDragOver
                  ? 'border-blue-500 bg-blue-500/10'
                  : selectedFileUrl
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700 hover:border-blue-500/50 bg-slate-950/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />

              {isProcessing ? (
                <div className="space-y-2 flex flex-col items-center text-blue-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-bold text-slate-300">ফাইল প্রসেসিং হচ্ছে...</p>
                </div>
              ) : selectedFileUrl ? (
                <div className="space-y-2 flex flex-col items-center">
                  {selectedFileUrl.startsWith('data:video') || fileName.endsWith('.mp4') ? (
                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400">
                      <Film className="w-8 h-8" />
                    </div>
                  ) : (
                    <img
                      src={selectedFileUrl}
                      alt="Preview"
                      className="w-28 h-28 object-cover rounded-2xl border border-slate-700 shadow-md"
                    />
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{fileName || 'ফাইল প্রস্তুত'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">পরিবর্তন করতে পুনরায় ক্লিক করুন</span>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      গ্যালারি থেকে ফটো বা ভিডিও পছন্দ করুন
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, MP4 ইত্যাদি ফাইল সাপোর্ট করে
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">মিডিয়া URL লিঙ্ক</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/photo.jpg or video.mp4"
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Title / Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">স্মৃতির শিরোনাম (Title)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: সাজেক ভ্যালির সূর্যাস্ত"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Location Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">স্থান (Location)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="যেমন: Sajek Valley / Cox's Bazar"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-700"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isProcessing || (activeTab === 'upload' ? !selectedFileUrl : !urlInput.trim())}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all shadow-md flex items-center gap-1.5 ${
                (activeTab === 'upload' ? selectedFileUrl : urlInput.trim()) && !isProcessing
                  ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>গ্যালারিতে যোগ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

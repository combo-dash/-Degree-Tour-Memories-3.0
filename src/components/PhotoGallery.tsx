import React, { useState } from 'react';
import { Memory } from '../types';
import { Image as ImageIcon, Film, UploadCloud, Folder, MapPin, X, Heart, Download, Trash2 } from 'lucide-react';
import { UserSession } from './AuthScreen';

interface PhotoGalleryProps {
  memories: Memory[];
  onLike: (memoryId: string, currentLikes: number) => void;
  onAddMemoryClick?: () => void;
  currentUser?: UserSession | null;
  onDeleteMemory?: (memoryId: string) => void;
  onClearAllMemories?: () => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  memories,
  onLike,
  onAddMemoryClick,
  currentUser,
  onDeleteMemory,
  onClearAllMemories
}) => {
  const [filterType, setFilterType] = useState<'all' | 'photos' | 'videos'>('all');
  const [activePhoto, setActivePhoto] = useState<Memory | null>(null);

  const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Helper to check if memory is video
  const isVideoMedia = (m: Memory) =>
    (m.imageUrl && (m.imageUrl.startsWith('data:video') || m.imageUrl.endsWith('.mp4') || m.imageUrl.endsWith('.webm'))) ||
    m.category === 'Video';

  // Filter memories
  const photoMemories = memories.filter((m) => m.imageUrl && m.imageUrl.length > 5);

  const filteredPhotos = photoMemories.filter((m) => {
    if (filterType === 'photos') return !isVideoMedia(m);
    if (filterType === 'videos') return isVideoMedia(m);
    return true;
  });

  const handleDelete = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation();
    if (onDeleteMemory) {
      onDeleteMemory(photoId);
    }
    if (activePhoto?.id === photoId) {
      setActivePhoto(null);
    }
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* Tour Photo & Video Gallery Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Tour Photo & Video Gallery</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct file upload & memory management {canDelete && '• Admin deletion enabled'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canDelete && photoMemories.length > 0 && onClearAllMemories && (
            <button
              onClick={() => {
                onClearAllMemories();
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
              title="Delete all photos from gallery"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Clear Gallery</span>
            </button>
          )}

          <button
            onClick={onAddMemoryClick}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Photo/Video</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>
      </div>

      {/* Media Type Filter Pills */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'all'
              ? 'bg-slate-800 text-white border-slate-700 shadow-md'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          All Media ({photoMemories.length})
        </button>

        <button
          onClick={() => setFilterType('photos')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            filterType === 'photos'
              ? 'bg-slate-800 text-white border-slate-700 shadow-md'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <span>Photos</span>
          <span className="text-xs">📸</span>
        </button>

        <button
          onClick={() => setFilterType('videos')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            filterType === 'videos'
              ? 'bg-slate-800 text-white border-slate-700 shadow-md'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <span>Videos</span>
          <span className="text-xs">📹</span>
        </button>
      </div>

      {/* Grid or Empty State */}
      {filteredPhotos.length === 0 ? (
        <div className="p-20 text-center rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-1">
            <Folder className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-slate-300">No photos or videos uploaded yet</p>
          <button
            onClick={onAddMemoryClick}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            Upload First Memory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/80 group cursor-pointer shadow-lg hover:border-amber-500/50 transition-all"
            >
              {/* Image or Video preview */}
              {isVideoMedia(photo) ? (
                <video
                  src={photo.imageUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}

              {/* Admin Delete Button on Card */}
              {canDelete && (
                <button
                  onClick={(e) => handleDelete(e, photo.id)}
                  title="Delete memory (Admin)"
                  className="absolute top-3 right-3 p-2 rounded-2xl bg-rose-600/90 text-white hover:bg-rose-500 shadow-lg z-20 cursor-pointer transition-transform hover:scale-110"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {photo.location}
                </span>
                <h4 className="text-sm font-bold text-white leading-tight mt-1 line-clamp-1">
                  {photo.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-300 mt-2 pt-2 border-t border-slate-800/80">
                  <span>By: {photo.authorName}</span>
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    {photo.likes || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Upload Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={onAddMemoryClick}
          className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/40 flex items-center gap-2 transition-all cursor-pointer"
        >
          <UploadCloud className="w-5 h-5" />
          <span>Upload Photo/Video</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-all z-10 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
            {/* Image Box */}
            <div className="md:w-2/3 bg-black flex items-center justify-center relative min-h-[300px]">
              {isVideoMedia(activePhoto) ? (
                <video
                  src={activePhoto.imageUrl}
                  controls
                  className="max-h-[70vh] md:max-h-[85vh] w-auto object-contain"
                />
              ) : (
                <img
                  src={activePhoto.imageUrl}
                  alt={activePhoto.title}
                  className="max-h-[70vh] md:max-h-[85vh] w-auto object-contain"
                />
              )}
            </div>

            {/* Photo Details Sidebar */}
            <div className="md:w-1/3 p-6 flex flex-col justify-between space-y-4 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activePhoto.category}
                  </span>
                  <span className="text-xs text-slate-400">{activePhoto.date}</span>
                </div>

                <h3 className="text-xl font-black text-white">{activePhoto.title}</h3>
                
                <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {activePhoto.location}
                </p>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {activePhoto.description}
                </p>

                {/* Tags */}
                {activePhoto.tags && activePhoto.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {activePhoto.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Uploaded by: <strong className="text-white">{activePhoto.authorName}</strong>
                  </span>
                  <button
                    onClick={() => onLike(activePhoto.id, activePhoto.likes || 0)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs hover:bg-rose-500/30 transition-all cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    <span>{activePhoto.likes || 0}</span>
                  </button>
                </div>

                <a
                  href={activePhoto.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Original File</span>
                </a>

                {canDelete && (
                  <button
                    onClick={(e) => handleDelete(e, activePhoto.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Photo (Admin)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



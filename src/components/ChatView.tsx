import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Video,
  Crown,
  Shield,
  X,
  Trash2,
  Loader2,
  Maximize2,
  Link as LinkIcon
} from 'lucide-react';
import { UserSession } from './AuthScreen';
import { ChatMessage } from '../types';
import { subscribeMessages, sendMessageToFirestore, deleteMessageFromFirestore } from '../firebase';
import { getPublicAdminAvatar } from '../utils/adminAvatars';

interface ChatViewProps {
  currentUser: UserSession | null;
}

const LOCAL_STORAGE_CHAT_KEY = 'degree_tour_chat_messages_v3';

// Compress images using canvas to guarantee base64 string is small (~30KB-90KB) for Firestore
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
        const maxDim = 650; // max 650px for fast loading & small size

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
        // JPEG quality 0.55 ensures ~30KB - 80KB file size
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.55);
        resolve(compressedDataUrl);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = (err) => reject(err);
  });
};

export const ChatView: React.FC<ChatViewProps> = ({ currentUser }) => {
  // Load initial messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [input, setInput] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    fileName: string;
  } | null>(null);

  const [showUrlModal, setShowUrlModal] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaUrlType, setMediaUrlType] = useState<'image' | 'video'>('image');

  const [isUploading, setIsUploading] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive current user info
  const currentUserName = currentUser?.name || localStorage.getItem('degree_tour_user_name') || 'Student';
  const currentUserRole = (currentUser?.role || localStorage.getItem('degree_tour_user_role') || 'student') as 'student' | 'admin' | 'superadmin';

  // Save messages to LocalStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('LocalStorage quota limit reached:', e);
    }
  }, [messages]);

  // Subscribe to real-time chat messages from Firestore
  useEffect(() => {
    const unsubscribe = subscribeMessages((remoteMessages) => {
      if (remoteMessages && Array.isArray(remoteMessages)) {
        setMessages(remoteMessages);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom on new message or selected media
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedMedia]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedUrl = await compressImageFile(file);
      if (compressedUrl) {
        setSelectedMedia({
          url: compressedUrl,
          type: 'image',
          fileName: file.name
        });
      }
    } catch (err) {
      console.error('Image compression error:', err);
      alert('ছবি প্রসেস করতে সমস্যা হয়েছে!');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit video file size to 15MB for optimal browser performance
    if (file.size > 15 * 1024 * 1024) {
      alert('ভিডিও ফাইলটি সাইজে ১৫ মেগাবাইটের চেয়ে বড়। অনুগ্রহ করে ছোট ক্লিপ আপলোড করুন।');
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setSelectedMedia({
          url: result,
          type: 'video',
          fileName: file.name
        });
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('ভিডিও প্রসেস করতে সমস্যা হয়েছে!');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleAddUrlMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrlInput.trim()) return;

    setSelectedMedia({
      url: mediaUrlInput.trim(),
      type: mediaUrlType,
      fileName: mediaUrlType === 'image' ? 'Image Link' : 'Video Link'
    });
    setMediaUrlInput('');
    setShowUrlModal(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedMedia) return;

    const textToSend = input.trim();
    const mediaToSend = selectedMedia;

    // Reset input states immediately
    setInput('');
    setSelectedMedia(null);

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    const timestamp = Date.now();
    const tempId = 'msg-' + timestamp + '-' + Math.random().toString(36).substr(2, 4);

    const newMsgObj: ChatMessage = {
      id: tempId,
      sender: currentUserName,
      senderId: currentUser?.phone || currentUserName,
      role: currentUserRole,
      text: textToSend,
      mediaUrl: mediaToSend?.url || '',
      mediaType: mediaToSend?.type,
      time: formattedTime,
      timestamp
    };

    // 1. Instantly update local state & LocalStorage so it shows without delay
    setMessages((prev) => [...prev, newMsgObj]);

    // 2. Persist to Firestore asynchronously
    try {
      const docId = await sendMessageToFirestore({
        sender: newMsgObj.sender,
        senderId: newMsgObj.senderId,
        role: newMsgObj.role,
        text: newMsgObj.text,
        mediaUrl: newMsgObj.mediaUrl,
        mediaType: newMsgObj.mediaType,
        time: newMsgObj.time,
        timestamp: newMsgObj.timestamp
      });

      if (docId && !docId.startsWith('temp-')) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: docId } : m))
        );
      }
    } catch (err) {
      console.error('Failed to sync message with Firestore:', err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (window.confirm('মেসেজটি মুছে ফেলতে চান?')) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      await deleteMessageFromFirestore(msgId);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col justify-between space-y-3 relative">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*,video/mp4,video/webm"
        className="hidden"
        onChange={handleVideoSelect}
      />

      {/* Messages Header / Info Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-white">Degree Tour 3.0 Chatroom</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
            Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Logged as:</span>
          <span className="font-bold text-amber-400 flex items-center gap-1">
            {currentUserName}
            {currentUserRole === 'superadmin' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
            {currentUserRole === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
          </span>
        </div>
      </div>

      {/* Messages Scroll Box */}
      <div className="flex-1 bg-slate-950/80 rounded-3xl border border-slate-800/80 p-3 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-white">Tour Chatroom is Ready</h3>
              <p className="text-xs text-slate-400">
                শিক্ষার্থী ও এডমিন সবাই এখানে বার্তা, ফটো ও ভিডিও পাঠাতে পারেন। প্রথম বার্তাটি আপনিই পাঠান!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === currentUserName;
            const canDelete =
              currentUserRole === 'superadmin' ||
              currentUserRole === 'admin' ||
              msg.sender === currentUserName;

            return (
              <div key={msg.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender Header */}
                <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                  {(msg.role === 'admin' || msg.role === 'superadmin') && (
                    (() => {
                      const adminAvatar = getPublicAdminAvatar(msg.role, undefined, msg.sender);
                      return adminAvatar ? (
                        <img
                          src={adminAvatar}
                          alt={msg.sender}
                          className="w-5 h-5 rounded-full object-cover border border-indigo-400 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : null;
                    })()
                  )}
                  <span className="font-bold text-slate-300">{msg.sender}</span>
                  {msg.role === 'superadmin' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  {msg.role === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                  <span>• {msg.time}</span>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-500 hover:text-red-400 p-0.5 rounded"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Message Content Bubble */}
                <div
                  className={`max-w-xs sm:max-w-md space-y-2 p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-900 text-slate-200 rounded-bl-none border border-slate-800'
                  }`}
                >
                  {/* Media Attachment */}
                  {msg.mediaUrl && (
                    <div className="rounded-xl overflow-hidden bg-black/50 border border-white/10 relative group/media">
                      {msg.mediaType === 'video' ||
                      msg.mediaUrl.startsWith('data:video') ||
                      msg.mediaUrl.endsWith('.mp4') ||
                      msg.mediaUrl.endsWith('.webm') ? (
                        <video
                          src={msg.mediaUrl}
                          controls
                          className="w-full max-h-64 rounded-xl object-contain bg-black"
                        />
                      ) : (
                        <div
                          className="relative cursor-pointer"
                          onClick={() => setActiveMediaModal({ url: msg.mediaUrl!, type: 'image' })}
                        >
                          <img
                            src={msg.mediaUrl}
                            alt="Attachment"
                            className="w-full max-h-64 object-cover rounded-xl hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Media Attachment Preview */}
      {selectedMedia && (
        <div className="p-3 bg-slate-900/95 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            {selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-lg border border-slate-700"
              />
            ) : (
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-amber-400 shrink-0">
                <Video className="w-6 h-6" />
              </div>
            )}
            <div className="truncate text-xs">
              <p className="font-semibold text-white truncate">{selectedMedia.fileName}</p>
              <p className="text-slate-400 text-[10px]">
                {selectedMedia.type === 'image' ? 'ছবি প্রস্তুত (Compressed)' : 'ভিডিও প্রস্তুত'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors shrink-0"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Action Controls */}
      <form
        onSubmit={handleSend}
        className="p-2 sm:p-3 rounded-full bg-slate-900/90 border border-slate-800 flex items-center gap-2 shadow-xl shrink-0"
      >
        {/* Select Photo Button */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading}
          className="w-10 h-10 rounded-full flex items-center justify-center text-blue-400 hover:bg-slate-800 transition-all cursor-pointer shrink-0 disabled:opacity-50"
          title="ছবি নির্বাচন করুন (Photo Upload)"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> : <ImageIcon className="w-5 h-5" />}
        </button>

        {/* Select Video Button */}
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          disabled={isUploading}
          className="w-10 h-10 rounded-full flex items-center justify-center text-amber-400 hover:bg-slate-800 transition-all cursor-pointer shrink-0 disabled:opacity-50"
          title="ভিডিও নির্বাচন করুন (Video Upload)"
        >
          <Video className="w-5 h-5" />
        </button>

        {/* Paste Media URL Link Button */}
        <button
          type="button"
          onClick={() => setShowUrlModal(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-400 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
          title="মিডিয়া লিঙ্ক দিন (Add Image/Video Link)"
        >
          <LinkIcon className="w-5 h-5" />
        </button>

        {/* Text Input Field */}
        <input
          type="text"
          placeholder="এখানে বার্তা লিখুন..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!input.trim() && !selectedMedia) || isUploading}
          className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-blue-600/30 shrink-0 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* URL Link Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowUrlModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-emerald-400" />
              <span>মিডিয়া লিঙ্ক যোগ করুন</span>
            </h3>
            <p className="text-xs text-slate-400">
              ইন্টারনেট থেকে সরাসরি কোনো ছবি বা ভিডিও এর URL কপি করে পেস্ট করুন।
            </p>

            <form onSubmit={handleAddUrlMedia} className="space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMediaUrlType('image')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    mediaUrlType === 'image'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  ছবি (Image)
                </button>
                <button
                  type="button"
                  onClick={() => setMediaUrlType('video')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    mediaUrlType === 'video'
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  ভিডিও (Video)
                </button>
              </div>

              <input
                type="url"
                required
                placeholder="https://example.com/image.jpg or video.mp4"
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                >
                  সংযুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo preview */}
      {activeMediaModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveMediaModal(null)}
        >
          <button
            onClick={() => setActiveMediaModal(null)}
            className="absolute top-4 right-4 p-2 text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeMediaModal.url}
            alt="Full Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

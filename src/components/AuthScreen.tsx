import React, { useState, useEffect } from 'react';
import {
  Crown,
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
  Globe,
  Sun,
  Moon,
  Bus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Camera,
  Upload,
  User,
  Phone
} from 'lucide-react';
import { getPublicAdminAvatar } from '../utils/adminAvatars';
import { subscribeUsers, addUserToFirestore } from '../firebase';
import { AppUser } from '../types';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  role: 'student' | 'admin' | 'superadmin';
  phone?: string;
  degreeType?: string;
  session?: string;
  status?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  avatarUrl?: string;
  password?: string;
  gender?: 'male' | 'female';
}

import tourBusLogo from '../assets/images/tour_bus_logo_1786427462634.jpg';

interface AuthScreenProps {
  onSignInSuccess: (user: UserSession) => void;
  language: 'EN' | 'BN';
  setLanguage: (lang: 'EN' | 'BN') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignInSuccess,
  language,
  setLanguage,
  theme,
  setTheme
}) => {
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    const unsub = subscribeUsers(setAppUsers);
    return () => unsub();
  }, []);

  const [role, setRole] = useState<'student' | 'admin' | 'superadmin'>('student');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Sign In State
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign Up / Full Student Registration State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [degreeType, setDegreeType] = useState('BA');
  const [sessionVal, setSessionVal] = useState('2021-2022');
  const [studentStatus, setStudentStatus] = useState('Regular');
  const [studentId, setStudentId] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Photo Upload Simulation
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 500KB to avoid Firestore document limits)
      if (file.size > 500000) {
        alert('File is too large! Please choose an image smaller than 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId || !password) {
      setNotification(
        language === 'EN'
          ? 'Please enter your email/ID and password'
          : 'অনুগ্রহ করে ইমেইল/আইডি এবং পাসওয়ার্ড দিন'
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const queryStr = emailOrId.trim().toLowerCase();

      // Check Super Admin default
      if (role === 'superadmin') {
        if ((queryStr === 'tanvirtuhin482@gmail.com' || queryStr === 'superadmin') && password === 'Tanvirtuhin88') {
          const superAdminUser: UserSession = {
            id: 'superadmin-1',
            name: 'Tanvir Tuhin (Super Admin)',
            email: 'tanvirtuhin482@gmail.com',
            role: 'superadmin',
            phone: '01711223344',
            avatarUrl: getPublicAdminAvatar('superadmin', 'tanvirtuhin482@gmail.com', 'Tanvir Tuhin (Super Admin)') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
          };
          onSignInSuccess(superAdminUser);
          return;
        } else {
          setNotification(
            language === 'EN'
              ? 'Invalid Super Admin credentials!'
              : 'সুপার এডমিন তথ্য সঠিক নয়!'
          );
          return;
        }
      }

      // Check Admin default
      if (role === 'admin') {
        if ((queryStr === 'admin@degreetour.com' || queryStr === 'admin') && password === 'admin123') {
          const adminUser: UserSession = {
            id: 'admin-1',
            name: 'Admin Officer',
            email: 'admin@degreetour.com',
            role: 'admin',
            phone: '01812345678',
            avatarUrl: getPublicAdminAvatar('admin', 'admin@degreetour.com', 'Admin Officer') || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
          };
          onSignInSuccess(adminUser);
          return;
        }
      }

      // Check registered users in Firestore
      const foundUser = appUsers.find(
        (u) =>
          (u.email?.toLowerCase() === queryStr || u.rollNo?.toLowerCase() === queryStr || u.name?.toLowerCase() === queryStr) &&
          u.password === password &&
          u.role === role
      );

      if (foundUser) {
        if (foundUser.disabled) {
          setNotification(
            language === 'EN'
              ? 'Account is disabled! Please contact support.'
              : 'আপনার অ্যাকাউন্টটি বন্ধ করে দেওয়া হয়েছে! অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।'
          );
          setIsLoading(false);
          return;
        }
        onSignInSuccess({
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
          phone: foundUser.phone,
          rollNo: foundUser.rollNo,
          degreeType: foundUser.degreeType,
          session: foundUser.session,
          status: foundUser.status,
          bloodGroup: foundUser.bloodGroup,
          avatarUrl: foundUser.avatarUrl,
          gender: foundUser.gender
        });
      } else {
        setNotification(
          language === 'EN'
            ? 'Account not found or incorrect password! Please register first.'
            : 'অ্যাকাউন্ট পাওয়া যায়নি বা পাসওয়ার্ড ভুল! অনুগ্রহ করে প্রথমে রেজিস্ট্রেশন করুন।'
        );
      }
    }, 600);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !fullName || !phoneNumber || !newPassword) {
      setNotification(
        language === 'EN'
          ? 'Please fill in all required fields marked with *'
          : 'অনুগ্রহ করে * চিহ্নিত সকল তথ্য প্রদান করুন'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification(
        language === 'EN'
          ? 'Passwords do not match!'
          : 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!'
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const newUser = {
        id: `user-${Date.now()}`,
        name: fullName,
        email: signUpEmail.trim().toLowerCase(),
        rollNo: studentId || 'DEG-88-' + Math.floor(100 + Math.random() * 900),
        role,
        phone: phoneNumber,
        degreeType,
        session: sessionVal,
        status: studentStatus,
        bloodGroup,
        gender,
        address,
        emergencyContact,
        avatarUrl: avatarPreview || undefined,
        password: newPassword
      };

      const duplicate = appUsers.find(
        (u) => u.email === newUser.email || u.rollNo === newUser.rollNo
      );

      if (duplicate) {
        setNotification(
          language === 'EN'
            ? 'An account with this Email or Student ID already exists! Please Sign In.'
            : 'এই ইমেইল বা স্টুডেন্ট আইডি দিয়ে ইতোমধ্যে অ্যাকাউন্ট আছে! অনুগ্রহ করে সাইন ইন করুন।'
        );
        return;
      }

      addUserToFirestore(newUser as AppUser);

      setNotification(
        language === 'EN'
          ? 'Registration successful! Please Sign In now.'
          : 'রেজিস্ট্রেশন সফল হয়েছে! এখন সাইন ইন করুন।'
      );
      setAuthMode('signin');
    }, 700);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId) {
      setNotification(
        language === 'EN'
          ? 'Please enter your Email or Roll No / ID'
          : 'অনুগ্রহ করে ইমেইল বা রোল নম্বর লিখুন'
      );
      return;
    }
    setNotification(
      language === 'EN'
        ? `Password reset link sent to ${emailOrId}!`
        : `${emailOrId} ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!`
    );
  };



  const isDarkMode = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-300 ${
        isDarkMode ? 'bg-[#090d16] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Header Bar */}
      <header className="w-full max-w-2xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
              <img
                src={tourBusLogo}
                alt="Tour Bus Logo"
                className="w-full h-full object-cover rounded-[10px]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Degree Tour Memories 3.0
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Tour Management System
            </p>
          </div>
        </div>

        {/* Right Top Language & Theme Toggles */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'EN' ? 'BN' : 'EN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className={`p-2 rounded-lg border transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle Light / Dark Mode"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Auth Form Container */}
      <main className={`w-full ${authMode === 'signup' ? 'max-w-xl' : 'max-w-md'} mx-auto px-4 py-6 my-auto transition-all`}>
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all ${
            isDarkMode
              ? 'bg-[#0b1329]/95 border-slate-800/90 shadow-indigo-950/40'
              : 'bg-white border-slate-200 shadow-slate-200/80'
          }`}
        >
          {/* Form Header */}
          <div className="mb-6">
            {authMode !== 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setNotification(null);
                  setAuthMode('signin');
                }}
                className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer group"
                title="Back to Sign In"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:-translate-x-1 transition-transform" />
                <span>{language === 'EN' ? 'Back' : 'পেছনে যান'}</span>
              </button>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {authMode === 'signin' && (language === 'EN' ? 'Sign In' : 'সাইন ইন')}
              {authMode === 'signup' && (language === 'EN' ? 'Create Account' : 'অ্যাকাউন্ট তৈরি করুন')}
              {authMode === 'forgot' && (language === 'EN' ? 'Reset Password' : 'পাসওয়ার্ড রিসেট')}
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              {authMode === 'signin' && (language === 'EN' ? 'Welcome Back' : 'স্বাগতম, ফিরে আসার জন্য ধন্যবাদ')}
              {authMode === 'signup' && (language === 'EN' ? 'Fill in your details to register as a Student' : 'স্টুডেন্ট অ্যাকাউন্টের তথ্যাদি প্রদান করুন')}
              {authMode === 'forgot' && (language === 'EN' ? 'Enter your details to reset' : 'পাসওয়ার্ড রিসেটের তথ্য দিন')}
            </p>
          </div>

          {/* Notification Message if any */}
          {notification && (
            <div className="mb-5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-5">
              
              {/* Role Segmented Toggle (Student vs Admin vs Super Admin) */}
              <div className="space-y-2">
                <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'student'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{language === 'EN' ? 'Student' : 'ছাত্র / ছাত্রী'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'admin'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>{language === 'EN' ? 'Admin' : 'এডমিন'}</span>
                  </button>

                  {role === 'superadmin' && (
                    <button
                      type="button"
                      onClick={() => setRole('superadmin')}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-md shadow-amber-500/30 cursor-pointer"
                    >
                      <Crown className="w-4 h-4 text-amber-200" />
                      <span>Super Admin</span>
                    </button>
                  )}
                </div>

                {/* Switch to Super Admin Link */}
                <div className="flex justify-end pr-1">
                  {role !== 'superadmin' ? (
                    <button
                      type="button"
                      onClick={() => setRole('superadmin')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Switch to Super Admin?</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      ← Back to Student / Admin
                    </button>
                  )}
                </div>
              </div>

              {/* Email / ID Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  {language === 'EN' ? 'Email' : 'ইমেইল বা আইডি'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    placeholder={language === 'EN' ? 'you@example.com / Roll No / ID' : 'ইমেইল / রোল নং / আইডি'}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  {language === 'EN' ? 'Password' : 'পাসওয়ার্ড'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setNotification(null);
                      setAuthMode('forgot');
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {language === 'EN' ? 'Forgot Password' : 'পাসওয়ার্ড ভুলে গেছেন?'}
                  </button>
                </div>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  role === 'superadmin'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 shadow-lg shadow-amber-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {role === 'superadmin'
                        ? language === 'EN'
                          ? 'Super Admin Sign In'
                          : 'সুপার এডমিন সাইন ইন'
                        : role === 'admin'
                        ? language === 'EN'
                          ? 'Admin Sign In'
                          : 'এডমিন সাইন ইন'
                        : language === 'EN'
                        ? 'Student Sign In'
                        : 'স্টুডেন্ট সাইন ইন'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>



              {/* Switch to Sign Up */}
              <div className="text-center pt-2 text-xs text-slate-400">
                <span>
                  {language === 'EN' ? "Don't have an account? " : "অ্যাকাউন্ট নেই? "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNotification(null);
                    setAuthMode('signup');
                  }}
                  className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
                >
                  {language === 'EN' ? 'Sign Up' : 'সাইন আপ করুন'}
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP / STUDENT ACCOUNT CREATE FORM - MATCHING SCREENSHOTS EXACTLY */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              
              {/* Profile Picture Uploader */}
              <div className="flex flex-col items-center justify-center mb-2">
                <label className="relative cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div className="w-20 h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 border-2 border-indigo-400/50 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 transition-all overflow-hidden relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-9 h-9 text-white group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute bottom-1 right-1 bg-blue-500 p-1.5 rounded-full border border-slate-900 shadow">
                      <Upload className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </label>
                <span className="text-xs font-semibold text-slate-300 mt-2">
                  Profile Picture *
                </span>
              </div>

              {/* Email * */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Email *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Full Name * & Phone Number * (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Full Name *
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Phone Number *
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Degree Type * & Session * (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Degree Type *
                  </label>
                  <select
                    value={degreeType}
                    onChange={(e) => setDegreeType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BA">BA</option>
                    <option value="BSc">BSc</option>
                    <option value="BSS">BSS</option>
                    <option value="BBA">BBA</option>
                    <option value="Degree Pass">Degree Pass</option>
                    <option value="MA">MA</option>
                    <option value="MSc">MSc</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Session *
                  </label>
                  <select
                    value={sessionVal}
                    onChange={(e) => setSessionVal(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="2021-2022">2021-2022</option>
                    <option value="2022-2023">2022-2023</option>
                    <option value="2020-2021">2020-2021</option>
                    <option value="2019-2020">2019-2020</option>
                    <option value="2018-2019">2018-2019</option>
                    <option value="1988-1989">1988-1989 (Batch '88)</option>
                  </select>
                </div>
              </div>

              {/* Status * & Student ID * (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Status *
                  </label>
                  <select
                    value={studentStatus}
                    onChange={(e) => setStudentStatus(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                    <option value="Ex-Student">Ex-Student</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="CSE-042"
                    className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Blood Group & Gender (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Blood Group *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Gender (জেন্ডার) *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="male">Male (পুরুষ)</option>
                    <option value="female">Female (মহিলা)</option>
                  </select>
                </div>
              </div>

              {/* Address * */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your permanent address..."
                  className="w-full px-4 py-2 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Emergency Contact * */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Emergency Contact *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* New Password * & Confirm Password * (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    New Password *
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Confirm Password *
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              {/* Switch to Sign In */}
              <div className="text-center pt-2 text-xs text-slate-400">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setNotification(null);
                    setAuthMode('signin');
                  }}
                  className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
                >
                  Login
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'EN' ? 'Email or Roll No / ID' : 'ইমেইল বা রোল নম্বর'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    placeholder="you@example.com / Roll No"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{language === 'EN' ? 'Send Reset Link' : 'রিসেট লিংক পাঠান'}</span>
              </button>

              <div className="text-center pt-2 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setNotification(null);
                    setAuthMode('signin');
                  }}
                  className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  {language === 'EN' ? 'Back to Sign In' : 'সাইন ইন পেইজে ফিরুন'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-2xl mx-auto px-4 py-6 text-center text-xs text-slate-500">
        <p>Degree Tour 3.0 • Tour Management System</p>
        <p className="mt-0.5 text-slate-600">Batch '88 Memory Portal & Realtime Sync</p>
      </footer>
    </div>
  );
};

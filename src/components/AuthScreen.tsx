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
import {
  subscribeUsers,
  addUserToFirestore,
  subscribeBatchmates,
  getAllUsersDirectly,
  resetUserPasswordInFirestore,
  updateUserInFirestore,
  addBatchmateToFirestore
} from '../firebase';
import { AppUser, Batchmate } from '../types';

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
  const [batchmates, setBatchmates] = useState<Batchmate[]>([]);

  useEffect(() => {
    console.log('AuthScreen: Subscribing to users and batchmates...');
    const unsub = subscribeUsers((users) => {
      console.log(`AuthScreen: Received ${users.length} users from Firestore`);
      setAppUsers(users);
    });
    const unsubBm = subscribeBatchmates((bm) => {
      console.log(`AuthScreen: Received ${bm.length} batchmates from Firestore`);
      setBatchmates(bm);
    });
    return () => {
      unsub();
      unsubBm();
    };
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = emailOrId.trim().toLowerCase();
    const passStr = password.trim();

    if (!queryStr || !passStr) {
      setNotification(
        language === 'EN'
          ? 'Please enter your Class Roll and password'
          : 'অনুগ্রহ করে ক্লাস রোল এবং পাসওয়ার্ড দিন'
      );
      return;
    }

    setIsLoading(true);
    setNotification(null);

    // 1. Check Super Admin default
    if (role === 'superadmin' || queryStr === 'tanvirtuhin482@gmail.com' || queryStr === 'superadmin') {
      if ((queryStr === 'tanvirtuhin482@gmail.com' || queryStr === 'superadmin') && passStr === 'Tanvirtuhin88') {
        setIsLoading(false);
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
      } else if (role === 'superadmin') {
        setIsLoading(false);
        setNotification(
          language === 'EN'
            ? 'Invalid Super Admin credentials!'
            : 'সুপার এডমিন তথ্য সঠিক নয়!'
        );
        return;
      }
    }

    // 2. Check registered users in Firestore (direct fetch + local state to avoid any subscription delay)
    let allUsers = [...appUsers];
    try {
      const directUsers = await getAllUsersDirectly();
      if (directUsers && directUsers.length > 0) {
        allUsers = directUsers;
      }
    } catch (err) {
      console.warn('Direct fetch failed, falling back to cached state:', err);
    }

    const matchedUser = allUsers.find(
      (u) =>
        String(u.rollNo || '').trim().toLowerCase() === queryStr ||
        String(u.email || '').trim().toLowerCase() === queryStr ||
        String(u.name || '').trim().toLowerCase() === queryStr
    );

    if (matchedUser) {
      if (matchedUser.disabled) {
        setIsLoading(false);
        setNotification(
          language === 'EN'
            ? 'Account is disabled! Please contact support.'
            : 'আপনার অ্যাকাউন্টটি বন্ধ করে দেওয়া হয়েছে! অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।'
        );
        return;
      }

      // If user has a password matching input, or if password was not set yet, or matched roll
      const isPasswordCorrect =
        matchedUser.password === passStr ||
        (!matchedUser.password && passStr) ||
        (matchedUser.rollNo && passStr === String(matchedUser.rollNo).trim());

      if (isPasswordCorrect) {
        // If they logged in and didn't have this password saved, update it
        if (matchedUser.password !== passStr) {
          updateUserInFirestore(matchedUser.id, { password: passStr });
        }
        setIsLoading(false);
        onSignInSuccess({
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role || 'student',
          phone: matchedUser.phone,
          rollNo: matchedUser.rollNo,
          degreeType: matchedUser.degreeType,
          session: matchedUser.session,
          status: matchedUser.status,
          bloodGroup: matchedUser.bloodGroup,
          avatarUrl: matchedUser.avatarUrl,
          gender: matchedUser.gender
        });
        return;
      } else {
        setIsLoading(false);
        setNotification(
          language === 'EN'
            ? 'Incorrect password! Please try again or click "Forgot Password".'
            : 'পাসওয়ার্ডটি ভুল হয়েছে! আবার চেষ্টা করুন অথবা নিচের "পাসওয়ার্ড ভুলে গেছেন?" এ ক্লিক করে রিসেট করুন।'
        );
        return;
      }
    }

    // 4. Check if student exists in batchmate directory (e.g. added by admin)
    const matchedBatchmate = batchmates.find(
      (b) =>
        String(b.rollNo || '').trim().toLowerCase() === queryStr ||
        String(b.name || '').trim().toLowerCase() === queryStr
    );

    if (matchedBatchmate) {
      const cleanRoll = matchedBatchmate.rollNo.trim();
      const userId = `user-${cleanRoll.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;
      // Automatically sync their user account with the password they provided!
      const newStudentUser: AppUser = {
        id: userId,
        name: matchedBatchmate.name,
        email: `${cleanRoll.toLowerCase()}@tour.com`,
        rollNo: cleanRoll,
        role: 'student',
        phone: matchedBatchmate.phone && matchedBatchmate.phone !== 'N/A' ? matchedBatchmate.phone : '',
        degreeType: 'BA',
        session: '2021-2022',
        status: 'Regular',
        bloodGroup: 'O+',
        gender: 'male',
        password: passStr
      };

      try {
        await addUserToFirestore(newStudentUser);
        setIsLoading(false);
        onSignInSuccess({
          id: newStudentUser.id,
          name: newStudentUser.name,
          email: newStudentUser.email,
          role: newStudentUser.role,
          phone: newStudentUser.phone,
          rollNo: newStudentUser.rollNo,
          degreeType: newStudentUser.degreeType,
          session: newStudentUser.session,
          status: newStudentUser.status,
          bloodGroup: newStudentUser.bloodGroup,
          avatarUrl: newStudentUser.avatarUrl,
          gender: newStudentUser.gender
        });
        return;
      } catch (err) {
        console.error('Failed to auto-register student on signin:', err);
      }
    }

    // 5. If not found in users or batchmates
    setIsLoading(false);
    setNotification(
      language === 'EN'
        ? 'Account not found! Please click "Sign Up" below to create your account.'
        : 'এই রোল নম্বরটি পাওয়া যায়নি! দয়া করে নিচে "সাইন আপ করুন" এ ক্লিক করে অ্যাকাউন্ট তৈরি করুন।'
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !fullName || !newPassword) {
      setNotification(
        language === 'EN'
          ? 'Please fill in Name, Class Roll, and Password'
          : 'অনুগ্রহ করে নাম, ক্লাস রোল এবং পাসওয়ার্ড প্রদান করুন'
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
    setNotification(null);

    const sRoll = studentId.trim();
    const sName = fullName.trim();
    const sEmail = signUpEmail.trim().toLowerCase() || `${sRoll.toLowerCase()}@tour.com`;
    const deterministicUserId = `user-${sRoll.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`;

    // Check if user already exists in Firestore
    let allUsers = [...appUsers];
    try {
      const directUsers = await getAllUsersDirectly();
      if (directUsers && directUsers.length > 0) allUsers = directUsers;
    } catch (e) {
      // ignore
    }

    const existingUser = allUsers.find(
      (u) =>
        String(u.rollNo || '').trim().toLowerCase() === sRoll.toLowerCase() ||
        String(u.email || '').toLowerCase() === sEmail
    );

    if (existingUser) {
      // Update password & details for this student
      try {
        await updateUserInFirestore(existingUser.id, {
          name: sName,
          password: newPassword,
          phone: phoneNumber || existingUser.phone || '',
          avatarUrl: avatarPreview || existingUser.avatarUrl
        });

        // Also make sure batchmate directory entry has latest info
        await addBatchmateToFirestore({
          name: sName,
          nickName: sName.split(' ')[0] || sName,
          rollNo: sRoll,
          section: degreeType || 'BA',
          phone: phoneNumber || existingUser.phone || 'N/A',
          quote: 'Degree Tour 3.0 memories!',
          photoUrl: avatarPreview || existingUser.avatarUrl || '',
          favoriteMemory: 'Degree Tour 3.0',
          awards: ['ট্যুর মেম্বার 🌟']
        });

        setIsLoading(false);
        onSignInSuccess({
          ...existingUser,
          name: sName,
          avatarUrl: avatarPreview || existingUser.avatarUrl
        });
        return;
      } catch (err) {
        console.error('Failed to update existing user on signup:', err);
      }
    }

    const newUser: AppUser = {
      id: deterministicUserId,
      name: sName,
      email: sEmail,
      rollNo: sRoll,
      role: 'student',
      phone: phoneNumber || '',
      degreeType: degreeType || 'BA',
      session: sessionVal || '2021-2022',
      status: studentStatus || 'Regular',
      bloodGroup: bloodGroup || 'O+',
      gender,
      address: address || '',
      emergencyContact: emergencyContact || '',
      avatarUrl: avatarPreview || undefined,
      password: newPassword
    };

    try {
      await addUserToFirestore(newUser);

      // Also ensure student is in batchmate directory without creating duplicate
      await addBatchmateToFirestore({
        name: sName,
        nickName: sName.split(' ')[0] || sName,
        rollNo: sRoll,
        section: degreeType || 'BA',
        phone: phoneNumber || 'N/A',
        quote: 'Degree Tour 3.0 memories!',
        photoUrl: avatarPreview || '',
        favoriteMemory: 'Degree Tour 3.0',
        awards: ['ট্যুর মেম্বার 🌟']
      });

      setIsLoading(false);
      onSignInSuccess({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        rollNo: newUser.rollNo,
        degreeType: newUser.degreeType,
        session: newUser.session,
        status: newUser.status,
        bloodGroup: newUser.bloodGroup,
        avatarUrl: newUser.avatarUrl,
        gender: newUser.gender
      });
    } catch (err) {
      console.error('Registration failed:', err);
      setIsLoading(false);
      setNotification(
        language === 'EN'
          ? 'Registration failed! Please try again.'
          : 'রেজিস্ট্রেশন ব্যর্থ হয়েছে! আবার চেষ্টা করুন।'
      );
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId.trim()) {
      setNotification(
        language === 'EN'
          ? 'Please enter your Class Roll'
          : 'অনুগ্রহ করে আপনার ক্লাস রোল নম্বরটি লিখুন'
      );
      return;
    }

    if (!newPassword.trim()) {
      setNotification(
        language === 'EN'
          ? 'Please enter a new password'
          : 'অনুগ্রহ করে নতুন পাসওয়ার্ড দিন'
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
    setNotification(null);

    const success = await resetUserPasswordInFirestore(emailOrId.trim(), newPassword.trim());
    setIsLoading(false);

    if (success) {
      setNotification(
        language === 'EN'
          ? 'Password updated successfully! You can now Sign In.'
          : 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন লগইন করুন।'
      );
      setPassword(newPassword.trim());
      setNewPassword('');
      setConfirmPassword('');
      setAuthMode('signin');
    } else {
      // If user wasn't in users collection, check if in batchmates
      const existsInBm = batchmates.find(
        (b) => String(b.rollNo || '').trim().toLowerCase() === emailOrId.trim().toLowerCase()
      );
      if (existsInBm) {
        // Create user with this password
        await addUserToFirestore({
          id: `user-${Date.now()}`,
          name: existsInBm.name,
          email: `${existsInBm.rollNo.trim().toLowerCase()}@tour.com`,
          rollNo: existsInBm.rollNo.trim(),
          role: 'student',
          phone: existsInBm.phone && existsInBm.phone !== 'N/A' ? existsInBm.phone : '',
          degreeType: 'BA',
          session: '2021-2022',
          status: 'Regular',
          bloodGroup: 'O+',
          gender: 'male',
          password: newPassword.trim()
        });
        setNotification(
          language === 'EN'
            ? 'Password set successfully! You can now Sign In.'
            : 'পাসওয়ার্ড সফলভাবে সেট করা হয়েছে! এখন লগইন করুন।'
        );
        setPassword(newPassword.trim());
        setNewPassword('');
        setConfirmPassword('');
        setAuthMode('signin');
      } else {
        setNotification(
          language === 'EN'
            ? 'Account not found for this Roll No! Please sign up.'
            : 'এই রোল নম্বরের কোনো অ্যাকাউন্ট পাওয়া যায়নি! দয়া করে সাইন আপ করুন।'
        );
      }
    }
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

              {/* Class Roll Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  {language === 'EN' ? 'Class Roll' : 'ক্লাস রোল (Class Roll)'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    placeholder={language === 'EN' ? 'Class Roll' : 'আপনার রোল নম্বর'}
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

          {/* SIGN UP / STUDENT ACCOUNT CREATE FORM - SIMPLIFIED */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              
              {/* Full Name * */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Full Name (পূর্ণ নাম) *
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
                    placeholder="আপনার নাম লিখুন"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Class Roll / Student ID * */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Class Roll (রোল নম্বর) *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value);
                      // Auto-generate email based on roll for internal compatibility
                      setSignUpEmail(e.target.value.toLowerCase() + "@tour.com");
                    }}
                    placeholder="আপনার রোল লিখুন"
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Gender (জেন্ডার) * - Required for Bus Seating logic */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Gender (জেন্ডার) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      gender === 'male'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Male (পুরুষ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      gender === 'female'
                        ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-600/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Female (মহিলা)
                  </button>
                </div>
              </div>

              {/* New Password * & Confirm Password * (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Password *
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
                  <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
                )}
              </button>

              {/* Switch to Sign In */}
              <div className="text-center pt-2 text-xs text-slate-400">
                <span>আগে থেকেই অ্যাকাউন্ট আছে? </span>
                <button
                  type="button"
                  onClick={() => {
                    setNotification(null);
                    setAuthMode('signin');
                  }}
                  className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer ml-1"
                >
                  লগইন করুন
                </button>
              </div>
            </form>
          )}

          {/* FORGOT / RESET PASSWORD FORM */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'EN' ? 'Class Roll *' : 'ক্লাস রোল (Class Roll) *'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    placeholder={language === 'EN' ? 'Enter your Class Roll' : 'আপনার রোল নম্বর লিখুন'}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'EN' ? 'New Password *' : 'নতুন পাসওয়ার্ড *'}
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
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                <label className="text-xs font-semibold text-slate-300">
                  {language === 'EN' ? 'Confirm New Password *' : 'কনফার্ম নতুন পাসওয়ার্ড *'}
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
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{language === 'EN' ? 'Update Password' : 'পাসওয়ার্ড আপডেট করুন'}</span>
                  </>
                )}
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
                  {language === 'EN' ? '← Back to Sign In' : '← সাইন ইন পেইজে ফিরুন'}
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

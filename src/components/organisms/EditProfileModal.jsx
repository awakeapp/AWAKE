import React, { useState, useRef, useCallback } from 'react';
import { X, Camera, Save, Loader2, Crop as CropIcon, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { useAuthContext } from '../../hooks/useAuthContext';
import { useScrollLock } from '../../hooks/useScrollLock';
import { StorageService } from '../../services/storageService';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import Input from '../atoms/Input';
import { useToast } from '../../context/ToastContext';

// Helper function to extract cropped image from canvas as a File
async function getCroppedImg(image, crop, fileName) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      blob.name = fileName;
      resolve(new File([blob], fileName, { type: 'image/jpeg' }));
    }, 'image/jpeg', 1);
  });
}

const EditProfileModal = ({ isOpen, onClose }) => {
    useScrollLock(isOpen);
    const { user, dispatch } = useAuthContext();
    const { showToast } = useToast();
    const [name, setName] = useState(user?.displayName || user?.name || '');
    const [isSaving, setIsSaving] = useState(false);
    
    // Upload & Crop State
    const [uploadSrc, setUploadSrc] = useState(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);
    const fileInputRef = useRef(null);

    // Initial setup when modal opens
    // Provide a circular aspect ratio by default
    const onImageLoad = useCallback((e) => {
        const { width, height } = e.currentTarget;
        const _crop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
            width, height
        );
        setCrop(_crop);
    }, []);

    const handleSelectFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset crop
            const reader = new FileReader();
            reader.addEventListener('load', () => setUploadSrc(reader.result));
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSaveWithCrop = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            let newPhotoURL = user?.photoURL;

            // 1. If user is currently cropping an image, upload it first
            if (uploadSrc && completedCrop && imgRef.current) {
                const croppedFile = await getCroppedImg(imgRef.current, completedCrop, `profile_${user.uid}.jpg`);
                const { url } = await StorageService.uploadImage(croppedFile, `users/${user.uid}/profile.jpg`);
                newPhotoURL = url;
            }

            // 2. Update Firebase Auth Profile
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { 
                    displayName: name,
                    photoURL: newPhotoURL
                });
                
                // Update Context
                dispatch({ 
                    type: 'LOGIN', 
                    payload: { 
                        ...auth.currentUser, 
                        displayName: name, 
                        name: name,
                        photoURL: newPhotoURL 
                    } 
                });
            }
            
            showToast('Profile updated successfully!', 'success');
            handleClose();
        } catch (error) {
            console.error("Failed to save profile:", error);
            showToast('Failed to save changes.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setUploadSrc(null);
        setCrop(undefined);
        setCompletedCrop(null);
        onClose();
    };

    const removePhoto = async () => {
        if (!user?.photoURL) return;
        setIsSaving(true);
        try {
            await StorageService.deleteImage(`users/${user.uid}/profile.jpg`);
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { photoURL: "" });
                dispatch({ 
                    type: 'LOGIN', 
                    payload: { ...auth.currentUser, photoURL: "" } 
                });
            }
            showToast('Profile photo removed.', 'info');
        } catch (e) {
            showToast('Failed to remove photo.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Edit Profile</h2>
                        <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                        
                        {/* Avatar Section */}
                        {uploadSrc ? (
                            <div className="flex flex-col items-center">
                                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-3"><CropIcon className="inline w-3 h-3 mr-1"/> Crop your photo</p>
                                <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden shadow-inner max-h-[300px] flex items-center justify-center p-4">
                                     <ReactCrop
                                        crop={crop}
                                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                                        onComplete={(c) => setCompletedCrop(c)}
                                        aspect={1}
                                        circularCrop
                                    >
                                        <img
                                            ref={imgRef}
                                            src={uploadSrc}
                                            alt="Crop me"
                                            className="max-h-[260px] object-contain"
                                            onLoad={onImageLoad}
                                        />
                                    </ReactCrop>
                                </div>
                                <button onClick={() => { setUploadSrc(null); setCrop(undefined); }} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-4 uppercase tracking-wider">Cancel Selection</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className={`w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl ring-4 ring-slate-50 dark:ring-white/5 flex items-center justify-center bg-slate-100 dark:bg-slate-800`}>
                                        {user?.photoURL ? (
                                             <img
                                                src={user.photoURL}
                                                alt={user?.displayName || 'Avatar'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-4xl font-black uppercase text-slate-300 dark:text-slate-600">{user?.displayName?.[0] || 'U'}</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                        <Camera className="text-white w-6 h-6 mb-1" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-wider">Change</span>
                                    </div>
                                    {isSaving && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-10">
                                            <Loader2 className="text-white w-8 h-8 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleSelectFile}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <div className="flex items-center gap-4 mt-2">
                                    <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600 active:scale-95 transition-transform" onClick={() => fileInputRef.current?.click()}>
                                        Upload New
                                    </button>
                                    {user?.photoURL && (
                                         <button className="text-[10px] font-black text-rose-500 uppercase tracking-widest cursor-pointer hover:text-rose-600 active:scale-95 transition-transform flex items-center gap-1" onClick={removePhoto}>
                                           <Trash2 className="w-3 h-3"/> Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Form Section */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="bg-slate-50 dark:bg-slate-800/50 border-transparent focus:border-indigo-500/50 h-14 text-base font-bold rounded-2xl px-5"
                                />
                            </div>
                            <div className="space-y-2 opacity-70 pointer-events-none">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                                    Email Address
                                    <span className="text-emerald-500">Verified</span>
                                </label>
                                <Input
                                    value={user?.email}
                                    readOnly
                                    className="bg-slate-50 dark:bg-slate-800/50  border-transparent h-14 text-slate-500 rounded-2xl px-5"
                                />
                            </div>
                        </div>

                        <div className="pt-4 shrink-0">
                            <button
                                onClick={handleSaveWithCrop}
                                disabled={isSaving || (uploadSrc && !completedCrop)}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                                {isSaving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default EditProfileModal;

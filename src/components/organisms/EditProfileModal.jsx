import { useState, useRef } from 'react';
import { X, Camera, Save, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { useAuthContext } from '../../hooks/useAuthContext';

const EditProfileModal = ({ isOpen, onClose }) => {
    const { user, dispatch } = useAuthContext();
    const [name, setName] = useState(user?.name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // For local preview before save (optional, but good UX)
    // Here we will just upload immediately for simplicity with existing firebase logic, 
    // or we could separate upload from save. 
    // Given the previous pattern, we'll keep upload as an immediate action on file select for simplicity, 
    // OR refine it to 'save' everything at once. 
    // Let's stick to the robust immediate upload pattern for image to avoid complex state, 
    // but we can make it look seamless.

    const fileInputRef = useRef(null);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("File size must be less than 2MB");
            return;
        }

        setUploading(true);
        try {
            const { storage, ref, uploadBytes, getDownloadURL, updateProfile, auth } = await import('../../lib/firebase');

            if (!auth.currentUser) throw new Error("No user logged in");

            const storageRef = ref(storage, `profile_images/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update Profile immediately for the image part
            await updateProfile(auth.currentUser, { photoURL: downloadURL });

            // Dispatch to update context so UI shows new image immediately
            dispatch({ type: 'LOGIN', payload: { ...auth.currentUser, photoURL: downloadURL } });

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            // Update Display Name
            const { updateProfile, auth } = await import('../../lib/firebase');
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: name });

                // Update Context
                const updatedUser = { ...user, displayName: name, name: name };
                dispatch({ type: 'LOGIN', payload: auth.currentUser });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("Failed to save changes.");
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
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden z-10"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Edit Profile</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group cursor-pointer" onClick={handleImageClick}>
                                <div className={`w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl ring-4 ring-indigo-50 dark:ring-indigo-900/20 ${user?.profileColor || 'bg-indigo-500'}`}>
                                    <img
                                        src={user?.avatar}
                                        alt={user?.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-10">
                                        <Loader2 className="text-white w-8 h-8 animate-spin" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600" onClick={handleImageClick}>
                                Change Photo
                            </p>
                        </div>

                        {/* Form Section */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="bg-slate-50 dark:bg-slate-800 border-none h-12 text-lg font-semibold"
                                />
                            </div>
                            <div className="space-y-2 opacity-60 pointer-events-none">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                <Input
                                    value={user?.email}
                                    readOnly
                                    className="bg-slate-50 dark:bg-slate-800 border-none h-12 font-medium text-slate-500"
                                />
                                <p className="text-[10px] text-slate-400">Email cannot be changed</p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleSave}
                                isLoading={isSaving}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none"
                            >
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default EditProfileModal;

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import imageCompression from 'browser-image-compression';

export const StorageService = {
    /**
     * Compress an image heavily to avoid Firebase Storage costs
     */
    compressImage: async (imageFile) => {
        const options = {
            maxSizeMB: 0.2, // 200 KB max limit to keep costs $0
            maxWidthOrHeight: 1080, // good enough for reading receipts
            useWebWorker: true,
            fileType: 'image/jpeg',
            initialQuality: 0.7
        };

        try {
            const compressedFile = await imageCompression(imageFile, options);
            return compressedFile;
        } catch (error) {
            console.error('Error compressing image:', error);
            throw error;
        }
    },

    /**
     * Upload an image to Firebase Storage
     */
    uploadImage: async (file, path) => {
        if (!file) throw new Error("No file provided");

        // Compress first
        const compressedFile = await StorageService.compressImage(file);

        // Upload to the provided path
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, compressedFile);

        // Get the accessible download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
            url: downloadURL,
            path: snapshot.ref.fullPath // Important for deleting later
        };
    },

    /**
     * Delete an image from Firebase Storage
     */
    deleteImage: async (path) => {
        if (!path) return;
        const storageRef = ref(storage, path);
        try {
            await deleteObject(storageRef);
        } catch (error) {
            console.error("Failed to delete image from storage:", error);
            // Ignore 'object-not-found' errors since it doesn't matter if it's already gone
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
        }
    },
    
    /**
     * Usage examples:
     * - Profile: `users/${user.uid}/profile.jpg`
     * - Receipt: `users/${user.uid}/finance/receipts/${transactionId}.jpg`
     */
};

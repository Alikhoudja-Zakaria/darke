import { storage } from './config.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Uploads a listing image to Firebase Storage.
 * @param {File|Blob} file - The image file to upload.
 * @param {string} userId - The ID of the user uploading the image.
 * @returns {Promise<string>} The download URL of the uploaded image.
 */
export const uploadListingImage = async (file, userId) => {
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const storagePath = `listings/${userId}/${timestamp}_${randomId}.jpg`;
    const imageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(imageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading listing image:', error);
    throw error;
  }
};

/**
 * Deletes a listing image from Firebase Storage by URL.
 * @param {string} imageUrl - The download URL of the image to delete.
 * @returns {Promise<void>}
 */
export const deleteListingImage = async (imageUrl) => {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') return;
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('gs://')) return;

    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting listing image:', error);
    throw error;
  }
};

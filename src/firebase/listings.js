import { db } from './config';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return {};
  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
};

export const createListing = async (listingData) => {
  const cleanData = sanitizeData(listingData);
  const docRef = await addDoc(collection(db, 'listings'), {
    ...cleanData,
    createdAt: serverTimestamp(),
    status: 'active'
  });
  return docRef.id;
};

export const updateListing = async (listingId, data) => {
  const cleanData = sanitizeData(data);
  const docRef = doc(db, 'listings', listingId);
  await updateDoc(docRef, {
    ...cleanData,
    updatedAt: serverTimestamp()
  });
};

export const deleteListing = async (listingId) => {
  const docRef = doc(db, 'listings', listingId);
  await deleteDoc(docRef);
};

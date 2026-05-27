import { db } from './config';
import { collection, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export const createListing = async (listingData) => {
  const docRef = await addDoc(collection(db, 'listings'), {
    ...listingData,
    createdAt: serverTimestamp(),
    status: 'active'
  });
  return docRef.id;
};

export const updateListing = async (listingId, data) => {
  const docRef = doc(db, 'listings', listingId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteListing = async (listingId) => {
  const docRef = doc(db, 'listings', listingId);
  await deleteDoc(docRef);
};

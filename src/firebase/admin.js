import { db } from './config';
import { 
  collection, 
  getDocs, 
  addDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp,
  writeBatch,
  getCountFromServer 
} from 'firebase/firestore';

/**
 * Fetch listings with pagination for admin management.
 */
export const fetchListingsAdmin = async (pageSize = 50, lastDocParam = null) => {
  try {
    let q;
    if (lastDocParam) {
      q = query(
        collection(db, 'listings'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDocParam),
        limit(pageSize)
      );
    } else {
      q = query(
        collection(db, 'listings'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    const listings = [];
    snapshot.forEach(docSnap => {
      listings.push({ id: docSnap.id, ...docSnap.data() });
    });

    const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    return { listings, lastDoc: newLastDoc, hasMore: snapshot.docs.length === pageSize };
  } catch (error) {
    console.error("Admin fetchListings error:", error);
    // Fallback without orderBy if index is building or missing
    const fallbackQ = query(collection(db, 'listings'), limit(pageSize));
    const snapshot = await getDocs(fallbackQ);
    const listings = [];
    snapshot.forEach(docSnap => {
      listings.push({ id: docSnap.id, ...docSnap.data() });
    });
    return { listings, lastDoc: null, hasMore: false };
  }
};

/**
 * Toggle listing featured status
 */
export const toggleListingFeatured = async (listingId, currentFeatured) => {
  const docRef = doc(db, 'listings', listingId);
  const nextValue = !currentFeatured;
  await updateDoc(docRef, {
    isFeatured: nextValue,
    updatedAt: serverTimestamp()
  });
  return nextValue;
};

/**
 * Toggle listing status between 'active' and 'hidden'
 */
export const toggleListingVisibility = async (listingId, currentStatus) => {
  const docRef = doc(db, 'listings', listingId);
  const nextStatus = currentStatus === 'hidden' ? 'active' : 'hidden';
  await updateDoc(docRef, {
    status: nextStatus,
    updatedAt: serverTimestamp()
  });
  return nextStatus;
};

/**
 * Delete listing as admin
 */
export const deleteListingAdmin = async (listingId) => {
  const docRef = doc(db, 'listings', listingId);
  await deleteDoc(docRef);
};

/**
 * Fetch all registered users from Firestore 'users' collection
 */
export const fetchUsersAdmin = async () => {
  try {
    const q = query(collection(db, 'users'), limit(200));
    const snapshot = await getDocs(q);
    const users = [];
    snapshot.forEach(docSnap => {
      users.push({ id: docSnap.id, ...docSnap.data() });
    });
    return users;
  } catch (error) {
    console.error("Admin fetchUsers error:", error);
    return [];
  }
};

/**
 * Toggle user disabled/suspended state
 */
export const toggleUserDisabled = async (userId, currentDisabled) => {
  const docRef = doc(db, 'users', userId);
  const nextVal = !currentDisabled;
  await updateDoc(docRef, {
    disabled: nextVal,
    updatedAt: serverTimestamp()
  });
  return nextVal;
};

/**
 * Seed or import listings batch into Firestore
 */
export const seedListingsBatchAdmin = async (listingsList, onProgress) => {
  if (!Array.isArray(listingsList) || listingsList.length === 0) return 0;
  
  const CHUNK_SIZE = 400; // Firestore batch max is 500
  let totalSaved = 0;

  for (let i = 0; i < listingsList.length; i += CHUNK_SIZE) {
    const chunk = listingsList.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    chunk.forEach(item => {
      const docId = String(item.ouedknissId || item.id || '');
      const docRef = docId ? doc(db, 'listings', docId) : doc(collection(db, 'listings'));
      batch.set(docRef, {
        ...item,
        status: item.status || 'active',
        createdAt: item.createdAt ? new Date(item.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    totalSaved += chunk.length;
    if (onProgress) {
      onProgress(totalSaved, listingsList.length);
    }
  }

  return totalSaved;
};

/**
 * Fetch live database stats directly from Firestore server without downloading all documents.
 */
export const fetchAdminDatabaseStats = async () => {
  try {
    const listingsCol = collection(db, 'listings');
    const usersCol = collection(db, 'users');

    const [
      totalSnap,
      activeSnap,
      hiddenSnap,
      featuredSnap,
      usersSnap,
      scrapedSnap
    ] = await Promise.all([
      getCountFromServer(listingsCol),
      getCountFromServer(query(listingsCol, where('status', '==', 'active'))).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(query(listingsCol, where('status', '==', 'hidden'))).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(query(listingsCol, where('isFeatured', '==', true))).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(usersCol).catch(() => ({ data: () => ({ count: 0 }) })),
      getCountFromServer(query(listingsCol, where('ouedknissId', '!=', null))).catch(() => ({ data: () => ({ count: 0 }) }))
    ]);

    return {
      totalListings: totalSnap.data().count,
      activeListings: activeSnap.data().count,
      hiddenListings: hiddenSnap.data().count,
      featuredListings: featuredSnap.data().count,
      totalUsers: usersSnap.data().count,
      scrapedListings: scrapedSnap.data().count
    };
  } catch (error) {
    console.error("fetchAdminDatabaseStats error:", error);
    return {
      totalListings: 0,
      activeListings: 0,
      hiddenListings: 0,
      featuredListings: 0,
      totalUsers: 0,
      scrapedListings: 0
    };
  }
};

/**
 * Fetch ALL listings for admin full management (loads in chunks of 200).
 */
export const fetchAllListingsAdmin = async (onProgress) => {
  try {
    let allListings = [];
    let lastVisible = null;
    let hasMore = true;
    const CHUNK_SIZE = 200;

    while (hasMore) {
      let q = lastVisible
        ? query(collection(db, 'listings'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(CHUNK_SIZE))
        : query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(CHUNK_SIZE));

      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch {
        snapshot = await getDocs(query(collection(db, 'listings'), limit(CHUNK_SIZE)));
      }

      if (snapshot.empty) break;

      snapshot.forEach(docSnap => {
        allListings.push({ id: docSnap.id, ...docSnap.data() });
      });

      lastVisible = snapshot.docs[snapshot.docs.length - 1];
      if (onProgress) onProgress(allListings.length);
      if (snapshot.docs.length < CHUNK_SIZE) {
        hasMore = false;
      }
    }

    return allListings;
  } catch (error) {
    console.error("fetchAllListingsAdmin error:", error);
    throw error;
  }
};

/**
 * Delete batch of listings by IDs
 */
export const deleteListingsBatchAdmin = async (listingIds, onProgress) => {
  if (!Array.isArray(listingIds) || listingIds.length === 0) return 0;
  const CHUNK_SIZE = 400;
  let deletedCount = 0;

  for (let i = 0; i < listingIds.length; i += CHUNK_SIZE) {
    const chunk = listingIds.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(id => {
      batch.delete(doc(db, 'listings', id));
    });
    await batch.commit();
    deletedCount += chunk.length;
    if (onProgress) onProgress(deletedCount, listingIds.length);
  }

  return deletedCount;
};

/**
 * Normalize legacy listings (e.g. 'sell' -> 'long-term', 'buy' -> 'sale')
 */
export const normalizeLegacyListingsAdmin = async (onProgress) => {
  const snapshot = await getDocs(collection(db, 'listings'));
  const toUpdate = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    let needsUpdate = false;
    const updatePayload = {};

    if (data.category === 'sell') {
      updatePayload.category = 'long-term';
      needsUpdate = true;
    }
    if (data.transactionType === 'buy') {
      updatePayload.transactionType = 'sale';
      needsUpdate = true;
    }
    if (!data.status) {
      updatePayload.status = 'active';
      needsUpdate = true;
    }

    if (needsUpdate) {
      toUpdate.push({ id: docSnap.id, ...updatePayload });
    }
  });

  if (toUpdate.length === 0) return 0;

  const CHUNK_SIZE = 400;
  let updatedCount = 0;

  for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
    const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach(item => {
      const { id, ...fields } = item;
      batch.update(doc(db, 'listings', id), {
        ...fields,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
    updatedCount += chunk.length;
    if (onProgress) onProgress(updatedCount, toUpdate.length);
  }

  return updatedCount;
};

/**
 * Create a new report/signalement for a listing
 */
export const createReport = async (reportData) => {
  const generatedTicket = `REP-${Math.floor(100000 + Math.random() * 900000)}`;
  const payload = {
    ticketId: generatedTicket,
    listingId: reportData.listingId,
    listingTitle: reportData.listingTitle || 'Annonce',
    reason: reportData.reason || 'other',
    message: reportData.message || '',
    reporterName: reportData.reporterName || 'Anonyme',
    reporterEmail: reportData.reporterEmail || '',
    reporterPhone: reportData.reporterPhone || '',
    status: 'pending', // 'pending' | 'resolved' | 'dismissed'
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'reports'), payload);
  return { id: docRef.id, ...payload };
};

/**
 * Fetch all reports and takedown requests for Admin
 */
export const fetchReportsAdmin = async () => {
  try {
    const reports = [];
    
    // 1. Fetch from reports collection
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      snapshot.forEach(docSnap => {
        reports.push({ id: docSnap.id, sourceCollection: 'reports', ...docSnap.data() });
      });
    } catch (e) {
      console.warn("Reports orderBy fallback:", e.message);
      const fallbackSnapshot = await getDocs(collection(db, 'reports'));
      fallbackSnapshot.forEach(docSnap => {
        reports.push({ id: docSnap.id, sourceCollection: 'reports', ...docSnap.data() });
      });
    }

    // 2. Fetch from support_tickets collection (if any takedown or report tickets were filed via Contact form)
    try {
      const ticketSnapshot = await getDocs(collection(db, 'support_tickets'));
      ticketSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.subject === 'takedown' || data.subject === 'report' || data.listingId) {
          reports.push({
            id: docSnap.id,
            sourceCollection: 'support_tickets',
            ticketId: data.ticketId || `TKT-${docSnap.id.slice(0, 6)}`,
            listingId: data.listingId || '',
            listingTitle: data.listingTitle || 'Signalement via Contact',
            reason: data.subject === 'takedown' ? 'takedown' : 'report',
            message: data.message || '',
            reporterName: data.name || '',
            reporterEmail: data.email || '',
            reporterPhone: data.phone || '',
            status: data.status === 'open' ? 'pending' : (data.status || 'pending'),
            createdAt: data.createdAt
          });
        }
      });
    } catch (ticketErr) {
      console.warn("Could not fetch support_tickets for reports:", ticketErr.message);
    }

    // Sort combined reports by createdAt descending
    reports.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return reports;
  } catch (error) {
    console.error("fetchReportsAdmin error:", error);
    return [];
  }
};

/**
 * Update report status (pending / resolved / dismissed)
 */
export const updateReportStatusAdmin = async (reportId, nextStatus, sourceCollection = 'reports') => {
  const collectionName = sourceCollection === 'support_tickets' ? 'support_tickets' : 'reports';
  const docRef = doc(db, collectionName, reportId);
  const updatePayload = {
    status: nextStatus,
    updatedAt: serverTimestamp()
  };
  if (nextStatus === 'resolved') {
    updatePayload.resolvedAt = serverTimestamp();
  }
  await updateDoc(docRef, updatePayload);
  return nextStatus;
};

/**
 * Delete a report
 */
export const deleteReportAdmin = async (reportId, sourceCollection = 'reports') => {
  const collectionName = sourceCollection === 'support_tickets' ? 'support_tickets' : 'reports';
  await deleteDoc(doc(db, collectionName, reportId));
};


import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  FiShield, 
  FiGrid, 
  FiCheckCircle, 
  FiEye, 
  FiEyeOff, 
  FiTrash2, 
  FiStar, 
  FiUsers, 
  FiDatabase, 
  FiDownload, 
  FiRefreshCw, 
  FiExternalLink, 
  FiAlertTriangle,
  FiSearch,
  FiCpu,
  FiPlay,
  FiSquare,
  FiLayers,
  FiCheckSquare,
  FiCheck,
  FiFlag,
  FiX
} from 'react-icons/fi';
import { 
  fetchListingsAdmin, 
  toggleListingFeatured, 
  toggleListingVisibility, 
  deleteListingAdmin, 
  fetchUsersAdmin, 
  toggleUserDisabled,
  seedListingsBatchAdmin,
  fetchAdminDatabaseStats,
  fetchAllListingsAdmin,
  deleteListingsBatchAdmin,
  normalizeLegacyListingsAdmin,
  fetchReportsAdmin,
  updateReportStatusAdmin,
  deleteReportAdmin
} from '../firebase/admin';
import { db } from '../firebase/config';
import { doc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { 
  runOuedknissScraper,
  checkOuedknissAnnouncementExists,
  runOuedknissAuditAndCleaner,
  fetchOuedknissListingsForAudit
} from '../utils/scraperService';
import { wilayas } from '../data/cities';
import { formatPrice } from '../utils/formatPrice';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'listings' | 'users' | 'tools'
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters for listings
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'hidden' | 'featured'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'rent' | 'sale' | 'leisure'
  const [userFilter, setUserFilter] = useState(''); // filter by userId
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'ouedkniss' | 'user'

  // Filter for users
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Live Database Stats directly from Firestore
  const [dbStats, setDbStats] = useState({
    totalListings: 0,
    activeListings: 0,
    hiddenListings: 0,
    featuredListings: 0,
    totalUsers: 0,
    scrapedListings: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Bulk Loading & Normalization States
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkLoadProgress, setBulkLoadProgress] = useState(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizeProgress, setNormalizeProgress] = useState(null);

  // Bulk Selection States
  const [selectedListingIds, setSelectedListingIds] = useState([]);

  // Modals & Action States
  const [deletingListing, setDeletingListing] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reports & Moderation States
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState('pending'); // 'all' | 'pending' | 'resolved' | 'dismissed' | 'takedown'
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportActionLoading, setReportActionLoading] = useState(null);
  const [reseedConfirmOpen, setReseedConfirmOpen] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [reseedProgress, setReseedProgress] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Scraper & Cleaner Panel States
  const [scraperSubTab, setScraperSubTab] = useState('scrape'); // 'scrape' | 'cleaner'
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [isCleaningActive, setIsCleaningActive] = useState(false);
  const [cleanerBatchCount, setCleanerBatchCount] = useState('50'); // '25' | '50' | '100' | 'all'
  const [cleanerAction, setCleanerAction] = useState('delete'); // 'delete' | 'hide'
  const [cleanerProgress, setCleanerProgress] = useState({ current: 0, total: 0 });
  const [checkingSingleId, setCheckingSingleId] = useState(null);

  const [scraperCategory, setScraperCategory] = useState('all');
  const [scraperWilaya, setScraperWilaya] = useState('');
  const [scraperTargetCount, setScraperTargetCount] = useState(15);
  const [scraperSaveToFirestore, setScraperSaveToFirestore] = useState(true);
  const [scraperLogs, setScraperLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), text: "🤖 Module Ouedkniss v2.0 prêt. Extraction et audit d'existence disponibles.", type: "info" }
  ]);
  const [scraperProgress, setScraperProgress] = useState({ current: 0, total: 15 });
  const [scraperFoundItems, setScraperFoundItems] = useState([]);
  const abortScraperRef = useRef(false);
  const terminalBottomRef = useRef(null);

  // Auto-scroll terminal on new log
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scraperLogs]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  }, []);

  // Fetch Live DB Stats
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const stats = await fetchAdminDatabaseStats();
      setDbStats(stats);
      return stats;
    } catch (err) {
      console.error("Failed to load DB stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Initial Listings
  const loadInitialListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const [data] = await Promise.all([
        fetchListingsAdmin(100),
        loadStats()
      ]);
      setListings(data.listings);
      setLastDoc(data.lastDoc);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to load listings:", err);
      showToast("Erreur lors du chargement des annonces.");
    } finally {
      setLoadingListings(false);
    }
  }, [loadStats, showToast]);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const usersData = await fetchUsersAdmin();
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch Reports & Moderation tickets
  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const reportsData = await fetchReportsAdmin();
      setReports(reportsData);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    loadInitialListings();
    loadUsers();
    loadReports();
  }, [loadInitialListings, loadUsers, loadReports]);

  // Manual Full Refresh
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadInitialListings(), loadUsers(), loadStats(), loadReports()]);
      showToast("Données, statistiques et signalements actualisés avec succès !");
    } catch (err) {
      console.error("Refresh error:", err);
      showToast("Erreur lors de l'actualisation.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStartScraper = async () => {
    if (isScrapingActive) return;
    abortScraperRef.current = false;
    setIsScrapingActive(true);
    setScraperFoundItems([]);
    setScraperProgress({ current: 0, total: Number(scraperTargetCount) });
    
    setScraperLogs(prev => [
      ...prev,
      { id: Date.now(), time: new Date().toLocaleTimeString(), text: `🚀 Démarrage de l'extraction (${scraperTargetCount} annonces ciblées)...`, type: "info" }
    ]);

    try {
      const results = await runOuedknissScraper({
        category: scraperCategory,
        wilayaTarget: scraperWilaya,
        targetCount: Number(scraperTargetCount),
        saveToFirestore: scraperSaveToFirestore,
        userId: user?.uid,
        onLog: (text, type = "info") => {
          setScraperLogs(prev => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type }]);
        },
        onProgress: (current, total) => {
          setScraperProgress({ current, total });
        },
        onItemFound: (item) => {
          setScraperFoundItems(prev => [item, ...prev].slice(0, 20));
          if (scraperSaveToFirestore) {
            setDbStats(prev => ({
              ...prev,
              totalListings: prev.totalListings + 1,
              scrapedListings: prev.scrapedListings + 1,
              activeListings: prev.activeListings + 1
            }));
          }
        },
        isAborted: () => abortScraperRef.current
      });

      // Reload fresh stats and listings
      const updatedStats = await fetchAdminDatabaseStats();
      if (updatedStats) setDbStats(updatedStats);
      await loadInitialListings();

      showToast(`🎉 Scraping terminé ! ${results.length} annonces traitées. Total Darkoum : ${updatedStats?.totalListings || dbStats.totalListings} annonces.`);
    } catch (err) {
      console.error("Scraper failed:", err);
      setScraperLogs(prev => [
        ...prev,
        { id: Date.now(), time: new Date().toLocaleTimeString(), text: `❌ Erreur du scraper : ${err.message}`, type: "error" }
      ]);
      showToast("Erreur lors de l'exécution du scraper.");
    } finally {
      setIsScrapingActive(false);
    }
  };

  const handleStopScraper = () => {
    abortScraperRef.current = true;
    setIsScrapingActive(false);
    setIsCleaningActive(false);
    setScraperLogs(prev => [
      ...prev,
      { id: Date.now(), time: new Date().toLocaleTimeString(), text: "⏹️ Signal d'arrêt envoyé. Interruption du processus...", type: "warning" }
    ]);
    showToast("Processus interrompu.");
  };

  const handleClearLogs = () => {
    setScraperLogs([]);
  };

  // 1-Click Cleaner: Check if Ouedkniss listings still exist and delete if not
  const handleStartCleaner = async () => {
    if (isCleaningActive || isScrapingActive) return;
    abortScraperRef.current = false;
    setIsCleaningActive(true);
    setCleanerProgress({ current: 0, total: 1 });

    setScraperLogs(prev => [
      ...prev,
      { id: Date.now(), time: new Date().toLocaleTimeString(), text: "🧹 Démarrage du nettoyeur d'annonces Ouedkniss...", type: "info" }
    ]);

    try {
      let targetListings = [];
      if (cleanerBatchCount === 'all') {
        setScraperLogs(prev => [
          ...prev,
          { id: Date.now(), time: new Date().toLocaleTimeString(), text: "📥 Récupération de toutes les annonces Ouedkniss en base...", type: "info" }
        ]);
        const all = await fetchAllListingsAdmin();
        targetListings = all.filter(l => Boolean(l.ouedknissId));
      } else {
        const count = Number(cleanerBatchCount) || 50;
        targetListings = await fetchOuedknissListingsForAudit(count);
      }

      if (targetListings.length === 0) {
        setScraperLogs(prev => [
          ...prev,
          { id: Date.now(), time: new Date().toLocaleTimeString(), text: "⚠️ Aucune annonce Ouedkniss trouvée à vérifier.", type: "warning" }
        ]);
        showToast("Aucune annonce Ouedkniss trouvée.");
        return;
      }

      setCleanerProgress({ current: 0, total: targetListings.length });

      const results = await runOuedknissAuditAndCleaner({
        listings: targetListings,
        action: cleanerAction,
        onLog: (text, type = "info") => {
          setScraperLogs(prev => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type }]);
        },
        onProgress: (current, total) => {
          setCleanerProgress({ current, total });
        },
        isAborted: () => abortScraperRef.current
      });

      if (results.deletedDocIds.length > 0) {
        if (cleanerAction === 'delete') {
          setListings(prev => prev.filter(l => !results.deletedDocIds.includes(l.id)));
        } else {
          setListings(prev => prev.map(l => results.deletedDocIds.includes(l.id) ? { ...l, status: 'hidden' } : l));
        }
      }

      await loadStats();
      showToast(`Nettoyage terminé : ${results.checkedCount} vérifiées, ${results.deletedCount} obsolètes supprimées.`);
    } catch (err) {
      console.error("Cleaner failed:", err);
      setScraperLogs(prev => [
        ...prev,
        { id: Date.now(), time: new Date().toLocaleTimeString(), text: `❌ Erreur du nettoyeur : ${err.message}`, type: "error" }
      ]);
      showToast("Erreur lors du nettoyage.");
    } finally {
      setIsCleaningActive(false);
    }
  };

  // Check a single listing row on Ouedkniss
  const handleCheckSingleListing = async (listing) => {
    if (!listing.ouedknissId) return;
    setCheckingSingleId(listing.id);
    try {
      showToast(`Vérification de #${listing.ouedknissId} sur Ouedkniss...`);
      const check = await checkOuedknissAnnouncementExists(listing.ouedknissId);
      if (check.exists) {
        showToast(`✅ L'annonce #${listing.ouedknissId} est toujours en ligne (Statut: ${check.status})`);
      } else {
        await deleteDoc(doc(db, 'listings', listing.id));
        setListings(prev => prev.filter(l => l.id !== listing.id));
        await loadStats();
        showToast(`🗑️ L'annonce #${listing.ouedknissId} n'existe plus sur Ouedkniss (${check.status}) et a été supprimée de Darkoum.`);
      }
    } catch (err) {
      console.error("Check single error:", err);
      showToast("Erreur lors de la vérification : " + err.message);
    } finally {
      setCheckingSingleId(null);
    }
  };

  // Bulk check selected listings on Ouedkniss
  const handleBulkCheckSelected = async () => {
    const selectedListings = listings.filter(l => selectedListingIds.includes(l.id) && l.ouedknissId);
    if (selectedListings.length === 0) {
      showToast("Aucune des annonces sélectionnées ne provient d'Ouedkniss.");
      return;
    }

    if (!window.confirm(`Vérifier ${selectedListings.length} annonce(s) sur Ouedkniss et supprimer celles qui n'existent plus ?`)) {
      return;
    }

    setActiveTab('scraper');
    setScraperSubTab('cleaner');
    
    setIsCleaningActive(true);
    abortScraperRef.current = false;
    setCleanerProgress({ current: 0, total: selectedListings.length });

    try {
      const results = await runOuedknissAuditAndCleaner({
        listings: selectedListings,
        action: 'delete',
        onLog: (text, type = "info") => {
          setScraperLogs(prev => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type }]);
        },
        onProgress: (current, total) => {
          setCleanerProgress({ current, total });
        },
        isAborted: () => abortScraperRef.current
      });

      if (results.deletedDocIds.length > 0) {
        setListings(prev => prev.filter(l => !results.deletedDocIds.includes(l.id)));
      }
      setSelectedListingIds([]);
      await loadStats();
      showToast(`Audit terminé : ${results.checkedCount} vérifiées, ${results.deletedCount} supprimées.`);
    } catch (err) {
      console.error("Bulk check failed:", err);
      showToast("Erreur lors de la vérification groupée.");
    } finally {
      setIsCleaningActive(false);
    }
  };

  // Bulk Load ALL listings into memory
  const handleLoadAllListings = async () => {
    setIsBulkLoading(true);
    setBulkLoadProgress("Chargement complet de toutes les annonces en base...");
    try {
      const all = await fetchAllListingsAdmin((count) => {
        setBulkLoadProgress(`${count} annonces chargées en mémoire...`);
      });
      setListings(all);
      setHasMore(false);
      showToast(`Toutes les annonces (${all.length}) sont désormais chargées dans la table.`);
    } catch (err) {
      console.error("Bulk load error:", err);
      showToast("Erreur lors du chargement complet.");
    } finally {
      setIsBulkLoading(false);
      setBulkLoadProgress(null);
    }
  };

  // Normalize Legacy Listings ('sell' -> 'long-term', 'buy' -> 'sale')
  const handleNormalizeData = async () => {
    setIsNormalizing(true);
    setNormalizeProgress("Analyse et normalisation en cours...");
    try {
      const count = await normalizeLegacyListingsAdmin((done, total) => {
        setNormalizeProgress(`Progression: ${done} / ${total} annonces mises à jour...`);
      });
      showToast(`Normalisation réussie : ${count} annonces mises à jour.`);
      loadInitialListings();
    } catch (err) {
      console.error("Normalize error:", err);
      showToast("Erreur lors de la normalisation : " + err.message);
    } finally {
      setIsNormalizing(false);
      setNormalizeProgress(null);
    }
  };

  // Bulk Selection Actions
  const handleSelectAllVisible = (e) => {
    if (e.target.checked) {
      setSelectedListingIds(filteredListings.map(l => l.id));
    } else {
      setSelectedListingIds([]);
    }
  };

  const handleToggleSelectListing = (id) => {
    setSelectedListingIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedListingIds.length === 0) return;
    if (!window.confirm(`Confirmer la suppression définitive de ${selectedListingIds.length} annonce(s) ?`)) return;
    try {
      await deleteListingsBatchAdmin(selectedListingIds);
      setListings(prev => prev.filter(l => !selectedListingIds.includes(l.id)));
      showToast(`${selectedListingIds.length} annonce(s) supprimée(s).`);
      setSelectedListingIds([]);
      loadStats();
    } catch (err) {
      console.error("Bulk delete error:", err);
      showToast("Erreur lors de la suppression groupée.");
    }
  };

  const handleBulkToggleVisibility = async (newStatus) => {
    if (selectedListingIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedListingIds.forEach(id => {
        batch.update(doc(db, 'listings', id), {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      setListings(prev => prev.map(l => selectedListingIds.includes(l.id) ? { ...l, status: newStatus } : l));
      showToast(`${selectedListingIds.length} annonce(s) ${newStatus === 'hidden' ? 'masquée(s)' : 'mise(s) en ligne'}.`);
      setSelectedListingIds([]);
      loadStats();
    } catch (err) {
      console.error("Bulk visibility error:", err);
      showToast("Erreur lors de la modification groupée.");
    }
  };

  const loadMoreListings = async () => {
    if (!lastDoc || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchListingsAdmin(50, lastDoc);
      setListings(prev => [...prev, ...data.listings]);
      setLastDoc(data.lastDoc);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to load more listings:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Listing Actions
  const handleToggleFeatured = async (listing) => {
    const isCurrentlyFeatured = Boolean(listing.isFeatured);
    try {
      await toggleListingFeatured(listing.id, isCurrentlyFeatured);
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, isFeatured: !isCurrentlyFeatured } : l));
      showToast(isCurrentlyFeatured ? "Annonce retirée de la une" : "Annonce mise à la une ⭐");
    } catch (err) {
      console.error("Error toggling featured:", err);
      showToast("Erreur lors de la mise à jour.");
    }
  };

  const handleToggleVisibility = async (listing) => {
    const currentStatus = listing.status || 'active';
    try {
      const newStatus = await toggleListingVisibility(listing.id, currentStatus);
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l));
      showToast(newStatus === 'hidden' ? "Annonce masquée 🔒" : "Annonce visible en ligne ✅");
    } catch (err) {
      console.error("Error toggling visibility:", err);
      showToast("Erreur lors de la mise à jour.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingListing) return;
    setIsDeleting(true);
    try {
      await deleteListingAdmin(deletingListing.id);
      setListings(prev => prev.filter(l => l.id !== deletingListing.id));
      setDeletingListing(null);
      showToast("Annonce supprimée définitivement.");
    } catch (err) {
      console.error("Error deleting listing:", err);
      showToast("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  // User Actions
  const handleToggleUserDisabled = async (targetUser) => {
    const currentDisabled = Boolean(targetUser.disabled);
    try {
      const nextVal = await toggleUserDisabled(targetUser.id, currentDisabled);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, disabled: nextVal } : u));
      showToast(nextVal ? "Compte utilisateur suspendu" : "Compte utilisateur réactivé");
    } catch (err) {
      console.error("Error toggling user:", err);
      showToast("Erreur lors de la mise à jour de l'utilisateur.");
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(listings, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("download", `darkoum-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Sauvegarde JSON téléchargée avec succès 📁");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Erreur lors de l'export JSON.");
    }
  };

  // Reseed from initial_listings.json
  const handleReseed = async () => {
    setIsReseeding(true);
    setReseedProgress("Chargement du fichier initial...");
    try {
      const res = await fetch('/initial_listings.json');
      if (!res.ok) throw new Error("Fichier introuvable.");
      const data = await res.json();
      
      setReseedProgress(`Importation de ${data.length} annonces en cours...`);
      await seedListingsBatchAdmin(data, (done, total) => {
        setReseedProgress(`Progression: ${done} / ${total} enregistrées...`);
      });

      setReseedConfirmOpen(false);
      showToast(t('admin.reseed_success') || "Synchronisation terminée avec succès !");
      loadInitialListings();
    } catch (err) {
      console.error("Reseed error:", err);
      showToast("Erreur lors de la synchronisation : " + err.message);
    } finally {
      setIsReseeding(false);
      setReseedProgress(null);
    }
  };

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // Source filter
      if (sourceFilter === 'ouedkniss' && !item.ouedknissId) return false;
      if (sourceFilter === 'user' && item.ouedknissId) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const cityMatch = item.city?.toLowerCase().includes(q);
        const wilayaMatch = item.wilaya?.toLowerCase().includes(q);
        const idMatch = item.id?.toLowerCase().includes(q);
        const ouedknissMatch = item.ouedknissId?.toLowerCase().includes(q);
        if (!titleMatch && !cityMatch && !wilayaMatch && !idMatch && !ouedknissMatch) return false;
      }

      // User filter
      if (userFilter && item.userId !== userFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && item.status === 'hidden') return false;
      if (statusFilter === 'hidden' && item.status !== 'hidden') return false;
      if (statusFilter === 'featured' && !item.isFeatured) return false;

      // Category filter (inclusive of legacy data)
      if (categoryFilter === 'rent') {
        if (item.category === 'leisure' || item.transactionType !== 'rent') return false;
      } else if (categoryFilter === 'sale') {
        if (item.category === 'leisure') return false;
        if (item.transactionType !== 'sale' && item.transactionType !== 'buy') return false;
      } else if (categoryFilter === 'leisure') {
        if (item.category !== 'leisure') return false;
      }

      return true;
    });
  }, [listings, searchQuery, statusFilter, categoryFilter, userFilter, sourceFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return users;
    const q = userSearchQuery.toLowerCase().trim();
    return users.filter(u => 
      u.displayName?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) || 
      u.phone?.toLowerCase().includes(q)
    );
  }, [users, userSearchQuery]);

  // Metrics (Live Database Counters + Loaded distribution)
  const metrics = useMemo(() => {
    const total = dbStats.totalListings || listings.length;
    const featured = dbStats.featuredListings;
    const hidden = dbStats.hiddenListings;
    const active = dbStats.activeListings;
    const scraped = dbStats.scrapedListings;
    const userCreated = Math.max(0, total - scraped);

    const rentCount = listings.filter(l => (!l.category || l.category === 'long-term' || l.category === 'sell') && l.transactionType === 'rent').length;
    const saleCount = listings.filter(l => (!l.category || l.category === 'long-term' || l.category === 'sell') && (l.transactionType === 'sale' || l.transactionType === 'buy')).length;
    const leisureCount = listings.filter(l => l.category === 'leisure').length;

    // Top Wilayas count
    const wilayaMap = {};
    listings.forEach(l => {
      const w = l.wilaya || l.city || 'Inconnue';
      wilayaMap[w] = (wilayaMap[w] || 0) + 1;
    });
    const topWilayas = Object.entries(wilayaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total, active, featured, hidden, scraped, userCreated, rentCount, saleCount, leisureCount, topWilayas };
  }, [dbStats, listings]);

  // Report metrics & filtered list
  const pendingReportsCount = useMemo(() => {
    return reports.filter(r => r.status === 'pending').length;
  }, [reports]);

  const takedownReportsCount = useMemo(() => {
    return reports.filter(r => (r.reason === 'takedown' || r.reason === 'Demande de retrait d\'annonce') && r.status === 'pending').length;
  }, [reports]);

  const resolvedReportsCount = useMemo(() => {
    return reports.filter(r => r.status === 'resolved').length;
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (reportFilter === 'pending' && r.status !== 'pending') return false;
      if (reportFilter === 'resolved' && r.status !== 'resolved') return false;
      if (reportFilter === 'dismissed' && r.status !== 'dismissed') return false;
      if (reportFilter === 'takedown' && r.reason !== 'takedown') return false;
      if (reportFilter === 'scam' && r.reason !== 'scam') return false;

      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase().trim();
        const matchTitle = r.listingTitle?.toLowerCase().includes(q);
        const matchId = String(r.listingId || '').toLowerCase().includes(q);
        const matchTicket = String(r.ticketId || '').toLowerCase().includes(q);
        const matchEmail = r.reporterEmail?.toLowerCase().includes(q);
        const matchName = r.reporterName?.toLowerCase().includes(q);
        const matchReason = r.reason?.toLowerCase().includes(q);
        const matchMsg = r.message?.toLowerCase().includes(q);
        return matchTitle || matchId || matchTicket || matchEmail || matchName || matchReason || matchMsg;
      }

      return true;
    });
  }, [reports, reportFilter, reportSearchQuery]);

  // Handle report status change (resolved / dismissed / pending)
  const handleUpdateReportStatus = async (reportId, newStatus, sourceCollection) => {
    setReportActionLoading(reportId);
    try {
      await updateReportStatusAdmin(reportId, newStatus, sourceCollection);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      showToast(`Signalement marqué comme ${newStatus === 'resolved' ? 'résolu' : newStatus === 'dismissed' ? 'rejeté' : 'en attente'}.`);
    } catch (err) {
      console.error("Error updating report status:", err);
      showToast("Erreur lors de la mise à jour du signalement.");
    } finally {
      setReportActionLoading(null);
    }
  };

  // Hide listing directly from report and mark report resolved
  const handleHideListingFromReport = async (listingId, reportId, sourceCollection) => {
    if (!listingId) return;
    setReportActionLoading(reportId);
    try {
      await toggleListingVisibility(listingId, 'active');
      await updateReportStatusAdmin(reportId, 'resolved', sourceCollection);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'hidden' } : l));
      showToast("Annonce masquée et signalement résolu !");
    } catch (err) {
      console.error("Error hiding listing from report:", err);
      showToast("Erreur lors du masquage de l'annonce.");
    } finally {
      setReportActionLoading(null);
    }
  };

  // Delete listing permanently from report and mark report resolved
  const handleDeleteListingFromReport = async (listingId, reportId, sourceCollection) => {
    if (!listingId) return;
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT cette annonce signalée ? Cette action est irréversible.")) return;

    setReportActionLoading(reportId);
    try {
      await deleteListingAdmin(listingId);
      await updateReportStatusAdmin(reportId, 'resolved', sourceCollection);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      setListings(prev => prev.filter(l => l.id !== listingId));
      showToast("Annonce supprimée définitivement et signalement résolu !");
    } catch (err) {
      console.error("Error deleting listing from report:", err);
      showToast("Erreur lors de la suppression de l'annonce.");
    } finally {
      setReportActionLoading(null);
    }
  };

  // Delete report log
  const handleDeleteReport = async (reportId, sourceCollection) => {
    if (!window.confirm("Supprimer définitivement ce signalement de l'historique ?")) return;
    setReportActionLoading(reportId);
    try {
      await deleteReportAdmin(reportId, sourceCollection);
      setReports(prev => prev.filter(r => r.id !== reportId));
      showToast("Signalement supprimé de la liste.");
    } catch (err) {
      console.error("Error deleting report:", err);
      showToast("Erreur lors de la suppression du signalement.");
    } finally {
      setReportActionLoading(null);
    }
  };

  return (
    <div className="container admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <div className="admin-header-title">
            <h1>{t('admin.title') || "Panneau d'administration"}</h1>
            <span className="admin-badge">
              <FiShield /> Super Admin
            </span>
          </div>
          <p className="admin-subtitle">{t('admin.subtitle') || "Supervision globale et modération de Darkoum"}</p>
        </div>
        <div className="admin-header-actions">
          <button 
            type="button" 
            className="btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '6px 14px', cursor: 'pointer' }}
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            title="Rafraîchir les données et statistiques"
          >
            <FiRefreshCw className={isRefreshing ? "admin-spin" : ""} size={14} />
            {isRefreshing ? "Actualisation..." : "Actualiser"}
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Connecté : <strong>{user?.email}</strong>
          </span>
        </div>
      </div>

      {/* Live Global Database Banner */}
      <div className="admin-db-summary-banner">
        <div className="db-summary-stat-group">
          <div className="db-summary-item">
            <span className="db-summary-label">Total Annonces en Base</span>
            <span className="db-summary-value highlight">
              {loadingStats ? "..." : (dbStats.totalListings || metrics.total)}
            </span>
          </div>
          <div className="db-summary-item">
            <span className="db-summary-label">Scrapées Ouedkniss</span>
            <span className="db-summary-value">{dbStats.scrapedListings}</span>
          </div>
          <div className="db-summary-item">
            <span className="db-summary-label">Créées Utilisateurs</span>
            <span className="db-summary-value">{metrics.userCreated}</span>
          </div>
          <div className="db-summary-item">
            <span className="db-summary-label">Actives en Ligne</span>
            <span className="db-summary-value" style={{ color: '#4ADE80' }}>{dbStats.activeListings}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
            Table locale : <strong>{listings.length} chargées</strong>
          </span>
          {listings.length < dbStats.totalListings && (
            <button 
              type="button" 
              className="btn-outline" 
              style={{ color: '#F8FAFC', borderColor: '#475569', fontSize: '0.8rem', padding: '5px 12px', background: 'rgba(255,255,255,0.05)' }}
              onClick={handleLoadAllListings}
              disabled={isBulkLoading}
            >
              <FiLayers style={{ marginRight: '6px' }} />
              {isBulkLoading ? (bulkLoadProgress || "Chargement...") : `Tout charger (${dbStats.totalListings})`}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiGrid /> {t('admin.tab_overview') || "Vue d'ensemble"}
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          <FiCheckCircle /> {t('admin.tab_listings') || "Modération des Annonces"} ({dbStats.totalListings || listings.length})
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers /> {t('admin.tab_users') || "Utilisateurs"} ({dbStats.totalUsers || users.length})
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => { setActiveTab('reports'); loadReports(); }}
        >
          <FiAlertTriangle /> {t('admin.tab_reports') || "Signalements"}
          <span 
            className={`admin-tab-badge ${pendingReportsCount > 0 ? 'danger' : 'neutral'}`}
            style={{ marginLeft: '4px' }}
          >
            {pendingReportsCount}
          </span>
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'scraper' ? 'active' : ''}`}
          onClick={() => setActiveTab('scraper')}
        >
          <FiCpu /> {t('admin.tab_scraper') || "Scraper Ouedkniss"}
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          <FiDatabase /> {t('admin.tab_tools') || "Maintenance & Données"}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          <div className="admin-kpi-grid">
            <div className="card admin-kpi-card">
              <div className="admin-kpi-icon" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                <FiGrid />
              </div>
              <div className="admin-kpi-info">
                <h4>{t('admin.stat_total_listings') || "Total Annonces"}</h4>
                <div className="kpi-value">{dbStats.totalListings || metrics.total}</div>
                <div className="kpi-subtext">{listings.length} chargées dans la table</div>
              </div>
            </div>

            <div className="card admin-kpi-card">
              <div className="admin-kpi-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                <FiStar />
              </div>
              <div className="admin-kpi-info">
                <h4>{t('admin.stat_featured') || "À la une"}</h4>
                <div className="kpi-value">{dbStats.featuredListings}</div>
                <div className="kpi-subtext">Mises en avant</div>
              </div>
            </div>

            <div className="card admin-kpi-card">
              <div className="admin-kpi-icon" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                <FiEyeOff />
              </div>
              <div className="admin-kpi-info">
                <h4>{t('admin.stat_hidden') || "Masquées"}</h4>
                <div className="kpi-value">{dbStats.hiddenListings}</div>
                <div className="kpi-subtext">Non visibles public</div>
              </div>
            </div>

            <div className="card admin-kpi-card">
              <div className="admin-kpi-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>
                <FiUsers />
              </div>
              <div className="admin-kpi-info">
                <h4>{t('admin.stat_users') || "Utilisateurs"}</h4>
                <div className="kpi-value">{dbStats.totalUsers || users.length}</div>
                <div className="kpi-subtext">Comptes enregistrés</div>
              </div>
            </div>

            <div 
              className="card admin-kpi-card" 
              style={{ cursor: 'pointer', border: pendingReportsCount > 0 ? '1.5px solid #FCA5A5' : undefined }}
              onClick={() => { setActiveTab('reports'); loadReports(); }}
              title="Cliquez pour ouvrir les signalements et modérations"
            >
              <div className="admin-kpi-icon" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                <FiAlertTriangle />
              </div>
              <div className="admin-kpi-info">
                <h4>Signalements & Abus</h4>
                <div className="kpi-value" style={{ color: pendingReportsCount > 0 ? '#DC2626' : undefined }}>
                  {pendingReportsCount}
                </div>
                <div className="kpi-subtext">
                  {pendingReportsCount > 0 ? '⚠️ En attente de traitement' : 'Aucun signalement en attente'}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-charts-grid">
            {/* Category Breakdown */}
            <div className="card admin-chart-card">
              <h3>{t('admin.stat_category_breakdown') || "Répartition par catégorie"}</h3>
              
              <div>
                <div className="breakdown-row">
                  <span>{t('admin.rent') || "Location"}</span>
                  <strong>{metrics.rentCount} ({metrics.total > 0 ? Math.round((metrics.rentCount / metrics.total) * 100) : 0}%)</strong>
                </div>
                <div className="breakdown-bar-container">
                  <div className="breakdown-bar" style={{ width: `${metrics.total > 0 ? (metrics.rentCount / metrics.total) * 100 : 0}%`, backgroundColor: '#0D9488' }}></div>
                </div>

                <div className="breakdown-row">
                  <span>{t('admin.sale') || "Vente"}</span>
                  <strong>{metrics.saleCount} ({metrics.total > 0 ? Math.round((metrics.saleCount / metrics.total) * 100) : 0}%)</strong>
                </div>
                <div className="breakdown-bar-container">
                  <div className="breakdown-bar" style={{ width: `${metrics.total > 0 ? (metrics.saleCount / metrics.total) * 100 : 0}%`, backgroundColor: '#3B82F6' }}></div>
                </div>

                <div className="breakdown-row">
                  <span>{t('admin.leisure') || "Vacances (Leisure)"}</span>
                  <strong>{metrics.leisureCount} ({metrics.total > 0 ? Math.round((metrics.leisureCount / metrics.total) * 100) : 0}%)</strong>
                </div>
                <div className="breakdown-bar-container">
                  <div className="breakdown-bar" style={{ width: `${metrics.total > 0 ? (metrics.leisureCount / metrics.total) * 100 : 0}%`, backgroundColor: '#F59E0B' }}></div>
                </div>
              </div>
            </div>

            {/* Top Wilayas */}
            <div className="card admin-chart-card">
              <h3>{t('admin.stat_top_wilayas') || "Top Wilayas actives"}</h3>
              <div>
                {metrics.topWilayas.length > 0 ? metrics.topWilayas.map(([wilayaName, count]) => (
                  <div key={wilayaName} style={{ marginBottom: '14px' }}>
                    <div className="breakdown-row">
                      <span>{wilayaName}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="breakdown-bar-container" style={{ marginBottom: 0 }}>
                      <div className="breakdown-bar" style={{ width: `${metrics.total > 0 ? (count / metrics.total) * 100 : 0}%`, backgroundColor: '#6366F1' }}></div>
                    </div>
                  </div>
                )) : (
                  <p style={{ color: 'var(--text-secondary)' }}>Aucune donnée pour l'instant.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LISTINGS MODERATION */}
      {activeTab === 'listings' && (
        <div>
          {/* Filters Bar */}
          <div className="admin-filters-bar">
            <input 
              type="text" 
              className="admin-search-input"
              placeholder={t('admin.search_placeholder') || "Rechercher par titre, ville, wilaya, ID..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select 
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('admin.filter_all') || "Tous les statuts"}</option>
              <option value="active">{t('admin.filter_active') || "En ligne"}</option>
              <option value="hidden">{t('admin.filter_hidden') || "Masquées"}</option>
              <option value="featured">{t('admin.filter_featured') || "À la une"}</option>
            </select>

            <select 
              className="admin-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">{t('admin.filter_all') || "Toutes les catégories"}</option>
              <option value="rent">{t('admin.rent') || "Location"}</option>
              <option value="sale">{t('admin.sale') || "Vente"}</option>
              <option value="leisure">{t('admin.leisure') || "Leisure (Vacances)"}</option>
            </select>

            <select 
              className="admin-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">Toutes les sources</option>
              <option value="ouedkniss">Scrapées Ouedkniss ({dbStats.scrapedListings})</option>
              <option value="user">Créées utilisateurs ({metrics.userCreated})</option>
            </select>

            {userFilter && (
              <button 
                className="btn-outline"
                style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                onClick={() => setUserFilter('')}
              >
                ✕ Filtre utilisateur actif
              </button>
            )}
          </div>

          {/* Table Info Bar */}
          <div className="admin-table-info-bar">
            <div>
              Affichage de <strong>{filteredListings.length}</strong> sur <strong>{dbStats.totalListings || listings.length}</strong> annonces au total
              {listings.length < (dbStats.totalListings || 0) && (
                <span style={{ color: '#F59E0B', marginLeft: '8px', fontSize: '0.85rem' }}>
                  ({listings.length} chargées localement)
                </span>
              )}
            </div>
            {listings.length < (dbStats.totalListings || 0) && (
              <button 
                type="button" 
                className="btn-outline"
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                onClick={handleLoadAllListings}
                disabled={isBulkLoading}
              >
                <FiLayers style={{ marginRight: '6px' }} />
                {isBulkLoading ? (bulkLoadProgress || "Chargement...") : `Tout charger (${dbStats.totalListings})`}
              </button>
            )}
          </div>

          {/* Bulk Selection Bar */}
          {selectedListingIds.length > 0 && (
            <div className="admin-bulk-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCheckSquare size={18} />
                <strong>{selectedListingIds.length} annonce(s) sélectionnée(s)</strong>
              </div>
              <div className="admin-bulk-actions">
                <button 
                  type="button" 
                  className="btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'white' }}
                  onClick={() => handleBulkToggleVisibility('active')}
                >
                  <FiEye style={{ marginRight: '4px' }} /> Mettre en ligne
                </button>
                <button 
                  type="button" 
                  className="btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'white' }}
                  onClick={() => handleBulkToggleVisibility('hidden')}
                >
                  <FiEyeOff style={{ marginRight: '4px' }} /> Masquer
                </button>
                <button 
                  type="button" 
                  className="btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'white', color: '#0D9488', borderColor: '#0D9488' }}
                  onClick={handleBulkCheckSelected}
                  title="Vérifier chaque annonce sélectionnée sur Ouedkniss et supprimer automatiquement celles qui ont disparu"
                >
                  <FiCheck style={{ marginRight: '4px' }} /> Vérifier Ouedkniss & Nettoyer
                </button>
                <button 
                  type="button" 
                  className="btn-outline btn-danger" 
                  style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'white' }}
                  onClick={handleBulkDelete}
                >
                  <FiTrash2 style={{ marginRight: '4px' }} /> Supprimer ({selectedListingIds.length})
                </button>
                <button 
                  type="button" 
                  className="btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'white' }}
                  onClick={() => setSelectedListingIds([])}
                >
                  Désélectionner
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {loadingListings ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : filteredListings.length > 0 ? (
            <>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedListingIds.length > 0 && selectedListingIds.length === filteredListings.length}
                          onChange={handleSelectAllVisible}
                          title="Tout sélectionner / désélectionner"
                        />
                      </th>
                      <th>{t('admin.col_property') || "Bien"}</th>
                      <th>Source</th>
                      <th>{t('admin.col_price') || "Prix"}</th>
                      <th>{t('admin.col_wilaya') || "Wilaya"}</th>
                      <th>{t('admin.col_status') || "Statut"}</th>
                      <th style={{ textAlign: 'right' }}>{t('admin.col_actions') || "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map(item => {
                      const isHidden = item.status === 'hidden';
                      const isFeatured = Boolean(item.isFeatured);
                      const isSelected = selectedListingIds.includes(item.id);
                      const thumbUrl = item.images && item.images.length > 0 
                        ? getOptimizedImageUrl(item.images[0], 'thumbnail')
                        : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80';

                      return (
                        <tr key={item.id} style={{ backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : undefined }}>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectListing(item.id)}
                            />
                          </td>
                          <td>
                            <div className="admin-prop-cell">
                              <img src={thumbUrl} alt="" className="admin-prop-thumb" loading="lazy" />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <a 
                                    href={`/listing/${item.id}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="admin-prop-title"
                                    style={{ textDecoration: 'none' }}
                                  >
                                    {item.title}
                                  </a>
                                  {reports.some(r => (r.listingId === item.id || (item.ouedknissId && String(r.listingId) === String(item.ouedknissId))) && r.status === 'pending') && (
                                    <span 
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        backgroundColor: '#FEE2E2',
                                        color: '#DC2626',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        cursor: 'pointer'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReportSearchQuery(String(item.id));
                                        setActiveTab('reports');
                                      }}
                                      title="Cette annonce fait l'objet d'un signalement actif. Cliquez pour consulter."
                                    >
                                      <FiFlag size={10} /> Signalée
                                    </span>
                                  )}
                                </div>
                                <div className="admin-prop-meta">
                                  <span>ID: {item.id ? String(item.id).slice(0, 8) : 'N/A'}...</span> • 
                                  <span style={{ textTransform: 'capitalize', marginLeft: '4px' }}>
                                    {item.category === 'leisure' ? 'Vacances' : (item.transactionType === 'sale' || item.transactionType === 'buy') ? 'Vente' : 'Location'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {item.ouedknissId ? (
                              <a 
                                href={`https://www.ouedkniss.com/annonce/${item.ouedknissId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-tag-ouedkniss"
                                title="Voir l'annonce originale sur Ouedkniss"
                              >
                                <FiExternalLink size={10} /> Ouedkniss #{item.ouedknissId}
                              </a>
                            ) : (
                              <span className="admin-tag-user">Utilisateur</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>
                            {formatPrice(item.price, item.priceUnit, lang)}
                          </td>
                          <td>{item.wilaya || item.city}</td>
                          <td>
                            <span className={`admin-status-badge ${isHidden ? 'status-hidden' : 'status-active'}`}>
                              {isHidden ? (t('admin.badge_hidden') || 'Masquée') : (t('admin.badge_active') || 'En ligne')}
                            </span>
                            {isFeatured && (
                              <span className="admin-status-badge status-featured">
                                ⭐ {t('admin.badge_featured') || 'À la une'}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                              <a 
                                href={`/listing/${item.id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="admin-icon-btn" 
                                title={t('admin.btn_view') || "Voir l'annonce"}
                              >
                                <FiExternalLink size={14} />
                              </a>
                              <button 
                                className={`admin-icon-btn ${isFeatured ? 'btn-feature-active' : ''}`}
                                onClick={() => handleToggleFeatured(item)}
                                title={isFeatured ? (t('admin.btn_unfeature') || "Retirer de la une") : (t('admin.btn_feature') || "Mettre à la une")}
                              >
                                <FiStar size={14} />
                              </button>
                              <button 
                                className="admin-icon-btn"
                                onClick={() => handleToggleVisibility(item)}
                                title={isHidden ? (t('admin.btn_unhide') || "Rendre visible") : (t('admin.btn_hide') || "Masquer")}
                              >
                                {isHidden ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                              </button>
                              {item.ouedknissId && (
                                <button 
                                  className="admin-icon-btn"
                                  onClick={() => handleCheckSingleListing(item)}
                                  disabled={checkingSingleId === item.id}
                                  title="Vérifier la validité sur Ouedkniss (supprime si elle n'existe plus)"
                                  style={{ color: '#0D9488' }}
                                >
                                  <FiCheck size={14} className={checkingSingleId === item.id ? "admin-spin" : ""} />
                                </button>
                              )}
                              <button 
                                className="admin-icon-btn btn-danger"
                                onClick={() => setDeletingListing(item)}
                                title={t('admin.btn_delete') || "Supprimer"}
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button 
                    className="btn-outline" 
                    onClick={loadMoreListings}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (t('misc.loading') || "Chargement...") : (t('misc.load_more') || "Afficher plus d'annonces")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <FiSearch size={36} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <h3>Aucune annonce ne correspond aux filtres.</h3>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div>
          <div className="admin-filters-bar">
            <input 
              type="text" 
              className="admin-search-input"
              placeholder="Rechercher un utilisateur par nom, email, téléphone..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
          </div>

          {loadingUsers ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.col_user') || "Utilisateur"}</th>
                    <th>{t('admin.col_email') || "Email"}</th>
                    <th>{t('admin.col_phone') || "Téléphone"}</th>
                    <th>{t('admin.col_listings_count') || "Annonces"}</th>
                    <th>{t('admin.col_user_status') || "Statut"}</th>
                    <th style={{ textAlign: 'right' }}>{t('admin.col_actions') || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const userListingsCount = listings.filter(l => l.userId === u.id).length;
                    const isSuspended = Boolean(u.disabled);

                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="user-avatar-cell">
                              {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {u.displayName || 'Utilisateur'}
                            </span>
                          </div>
                        </td>
                        <td>{u.email || 'N/A'}</td>
                        <td>{u.phone || 'Non renseigné'}</td>
                        <td>
                          <button 
                            className="btn-outline" 
                            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            onClick={() => {
                              setUserFilter(u.id);
                              setActiveTab('listings');
                            }}
                          >
                            {userListingsCount} annonce(s)
                          </button>
                        </td>
                        <td>
                          <span className={`admin-status-badge ${isSuspended ? 'status-hidden' : 'status-active'}`}>
                            {isSuspended ? (t('admin.user_suspended') || "Suspendu") : (t('admin.user_active') || "Actif")}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                            <button 
                              className={`btn-outline ${isSuspended ? '' : 'btn-danger'}`}
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              onClick={() => handleToggleUserDisabled(u)}
                            >
                              {isSuspended ? (t('admin.btn_activate') || "Réactiver") : (t('admin.btn_suspend') || "Suspendre")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <FiUsers size={36} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <h3>Aucun utilisateur trouvé.</h3>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OUEDKNISS SCRAPER CONTROL PANEL */}
      {activeTab === 'scraper' && (
        <div>
          <div className="scraper-panel-grid">
            {/* Scraper Configuration Form */}
            <div className="card scraper-config-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', marginBottom: '8px' }}>
                <FiCpu size={22} />
                <h3 style={{ margin: 0, fontWeight: 700 }}>Contrôle du Scraper Ouedkniss</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
                Lancez l'extraction automatique d'annonces en temps réel avec nettoyage des prix, détection des téléphones et import d'images HD.
              </p>

              {/* Live Status Header */}
              <div style={{
                background: 'rgba(13, 148, 136, 0.08)',
                border: '1px solid rgba(13, 148, 136, 0.25)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Base Darkoum en direct
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                    <strong style={{ fontSize: '1.3rem', color: 'var(--primary-color)' }}>
                      {dbStats.totalListings} annonces
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ({dbStats.scrapedListings} scrapées)
                    </span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-outline" 
                  style={{ fontSize: '0.75rem', padding: '5px 10px', background: 'white' }}
                  onClick={loadStats}
                  disabled={loadingStats}
                  title="Actualiser le compteur"
                >
                  <FiRefreshCw className={loadingStats ? "admin-spin" : ""} size={12} style={{ marginRight: '4px' }} />
                  Actualiser
                </button>
              </div>

              {/* Sub-tab mode switcher: Scraper vs Cleaner */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--bg-color)', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: scraperSubTab === 'scrape' ? 'white' : 'transparent',
                    color: scraperSubTab === 'scrape' ? 'var(--primary-color)' : 'var(--text-secondary)',
                    boxShadow: scraperSubTab === 'scrape' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onClick={() => setScraperSubTab('scrape')}
                  disabled={isScrapingActive || isCleaningActive}
                >
                  <FiCpu style={{ marginRight: '6px' }} /> Extraire (Scraper)
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: scraperSubTab === 'cleaner' ? 'white' : 'transparent',
                    color: scraperSubTab === 'cleaner' ? '#DC2626' : 'var(--text-secondary)',
                    boxShadow: scraperSubTab === 'cleaner' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onClick={() => setScraperSubTab('cleaner')}
                  disabled={isScrapingActive || isCleaningActive}
                >
                  <FiTrash2 style={{ marginRight: '6px' }} /> Nettoyeur Obsolètes
                </button>
              </div>

              {/* MODE 1: SCRAPER CONFIGURATION */}
              {scraperSubTab === 'scrape' && (
                <>
                  <div className="scraper-form-group">
                    <label>Catégorie cible :</label>
                    <select 
                      className="admin-select" 
                      style={{ width: '100%' }}
                      value={scraperCategory}
                      onChange={(e) => setScraperCategory(e.target.value)}
                      disabled={isScrapingActive}
                    >
                      <option value="all">Mixte (Vente, Location & Vacances)</option>
                      <option value="immobilier">Immobilier standard (Vente & Location)</option>
                      <option value="leisure">Location Vacances (Leisure)</option>
                      <option value="appartement">Appartements uniquement</option>
                      <option value="villa">Villas uniquement</option>
                      <option value="terrain">Terrains uniquement</option>
                    </select>
                  </div>

                  <div className="scraper-form-group">
                    <label>Filtrer par Wilaya :</label>
                    <select 
                      className="admin-select" 
                      style={{ width: '100%' }}
                      value={scraperWilaya}
                      onChange={(e) => setScraperWilaya(e.target.value)}
                      disabled={isScrapingActive}
                    >
                      <option value="">Toute l'Algérie (58 wilayas)</option>
                      {wilayas.map(w => (
                        <option key={w.code} value={w.name}>{w.code} - {w.name} ({w.nameAr})</option>
                      ))}
                    </select>
                  </div>

                  <div className="scraper-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ margin: 0 }}>Nombre d'annonces à extraire :</label>
                      <strong style={{ color: 'var(--primary-color)' }}>{scraperTargetCount}</strong>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={scraperTargetCount} 
                      onChange={(e) => setScraperTargetCount(Number(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                      disabled={isScrapingActive}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>5</span>
                      <span>25</span>
                      <span>50</span>
                    </div>
                  </div>

                  <div className="scraper-form-group" style={{ marginTop: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={scraperSaveToFirestore}
                        onChange={(e) => setScraperSaveToFirestore(e.target.checked)}
                        disabled={isScrapingActive}
                      />
                      <span>Enregistrer directement dans Firestore (Status: Actif)</span>
                    </label>
                  </div>

                  {/* Scraper Progress bar */}
                  {isScrapingActive && (
                    <div className="scraper-progress-wrapper">
                      <div className="scraper-progress-header">
                        <span>Progression de l'extraction</span>
                        <span>{scraperProgress.current} / {scraperProgress.total} ({scraperProgress.total > 0 ? Math.round((scraperProgress.current / scraperProgress.total) * 100) : 0}%)</span>
                      </div>
                      <div className="scraper-progress-track">
                        <div 
                          className="scraper-progress-bar"
                          style={{ width: `${scraperProgress.total > 0 ? (scraperProgress.current / scraperProgress.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Scraper Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    {!isScrapingActive ? (
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                        onClick={handleStartScraper}
                      >
                        <FiPlay /> Démarrer l'extraction
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ flex: 1, backgroundColor: '#EF4444', borderColor: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                        onClick={handleStopScraper}
                      >
                        <FiSquare /> Arrêter le scraper
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* MODE 2: CLEANER / OBSOLETE CHECKER */}
              {scraperSubTab === 'cleaner' && (
                <div>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.85rem', color: '#991B1B', lineHeight: 1.5 }}>
                    <strong>Audit d'existence en temps réel :</strong> Vérifie chaque annonce Darkoum sur l'API officielle Ouedkniss. Si une annonce a été supprimée ou n'est plus publiée, elle est automatiquement nettoyée de Darkoum.
                  </div>

                  <div className="scraper-form-group">
                    <label>Nombre d'annonces Ouedkniss à vérifier :</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={cleanerBatchCount}
                      onChange={(e) => setCleanerBatchCount(e.target.value)}
                      disabled={isCleaningActive}
                    >
                      <option value="25">25 annonces Ouedkniss</option>
                      <option value="50">50 annonces Ouedkniss</option>
                      <option value="100">100 annonces Ouedkniss</option>
                      <option value="all">Toutes les annonces Ouedkniss ({dbStats.scrapedListings} au total)</option>
                    </select>
                  </div>

                  <div className="scraper-form-group">
                    <label>Action si l'annonce n'existe plus sur Ouedkniss :</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={cleanerAction}
                      onChange={(e) => setCleanerAction(e.target.value)}
                      disabled={isCleaningActive}
                    >
                      <option value="delete">🗑️ Supprimer définitivement de Darkoum (Recommandé)</option>
                      <option value="hide">🔒 Masquer l'annonce (status: hidden)</option>
                    </select>
                  </div>

                  {/* Cleaner Progress bar */}
                  {isCleaningActive && (
                    <div className="scraper-progress-wrapper">
                      <div className="scraper-progress-header">
                        <span>Progression de l'audit</span>
                        <span>{cleanerProgress.current} / {cleanerProgress.total} ({cleanerProgress.total > 0 ? Math.round((cleanerProgress.current / cleanerProgress.total) * 100) : 0}%)</span>
                      </div>
                      <div className="scraper-progress-track">
                        <div 
                          className="scraper-progress-bar"
                          style={{ 
                            width: `${cleanerProgress.total > 0 ? (cleanerProgress.current / cleanerProgress.total) * 100 : 0}%`,
                            background: 'linear-gradient(90deg, #F59E0B, #EF4444)'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Cleaner Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    {!isCleaningActive ? (
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ flex: 1, backgroundColor: '#DC2626', borderColor: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                        onClick={handleStartCleaner}
                      >
                        <FiTrash2 /> Lancer la vérification & suppression
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ flex: 1, backgroundColor: '#475569', borderColor: '#475569', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                        onClick={handleStopScraper}
                      >
                        <FiSquare /> Arrêter l'audit
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Live Terminal Logs */}
            <div className="scraper-terminal-container">
              <div className="scraper-terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
                <span>Console Scraper Ouedkniss</span>
                <button 
                  type="button"
                  onClick={handleClearLogs}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Effacer
                </button>
              </div>
              <div className="scraper-terminal-body">
                {scraperLogs.map((log) => (
                  <div key={log.id} className={`terminal-line log-${log.type || 'info'}`}>
                    <span style={{ color: '#64748B', marginRight: '6px' }}>[{log.time}]</span>
                    {log.text}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>
            </div>
          </div>

          {/* Live Extracted Listings Gallery */}
          {scraperFoundItems.length > 0 && (
            <div style={{ marginTop: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  Dernières annonces extraites en direct ({scraperFoundItems.length})
                </h3>
                <button 
                  type="button" 
                  className="btn-outline" 
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                  onClick={() => setActiveTab('listings')}
                >
                  Voir dans la liste de modération →
                </button>
              </div>

              <div className="scraper-live-cards">
                {scraperFoundItems.map(item => (
                  <div key={item.ouedknissId || item.id} className="scraper-mini-card">
                    <img 
                      src={item.images && item.images.length > 0 ? getOptimizedImageUrl(item.images[0], 'thumbnail') : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'} 
                      alt="" 
                      className="scraper-mini-thumb" 
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                      <div style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>
                        {formatPrice(item.price, item.priceUnit, lang)}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                        📍 {item.city} ({item.wilaya})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TOOLS & MAINTENANCE */}
      {activeTab === 'tools' && (
        <div className="admin-tools-grid">
          {/* JSON Export */}
          <div className="card tool-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', marginBottom: '8px' }}>
                <FiDownload size={20} />
                <h3>Sauvegarde locale (Backup JSON)</h3>
              </div>
              <p>
                Téléchargez une copie complète de sauvegarde de toutes les annonces actuellement chargées au format JSON. Idéal pour garder des archives hors-ligne sans impacter votre forfait Spark.
              </p>
            </div>
            <button className="btn-primary" onClick={handleExportJSON}>
              <FiDownload /> {t('admin.btn_export_json') || "Télécharger la sauvegarde JSON"}
            </button>
          </div>

          {/* Seed from initial_listings.json */}
          <div className="card tool-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', marginBottom: '8px' }}>
                <FiRefreshCw size={20} />
                <h3>Synchronisation base de données</h3>
              </div>
              <p>
                {t('admin.reseed_desc') || "Importe les annonces de référence locales dans Firestore par lots optimisés de 400 documents."}
              </p>
            </div>
            <button 
              className="btn-accent" 
              onClick={() => setReseedConfirmOpen(true)}
              disabled={isReseeding}
            >
              <FiRefreshCw /> {isReseeding ? "Synchronisation..." : (t('admin.btn_reseed') || "Synchroniser les données")}
            </button>
          </div>

          {/* Normalize Legacy Listings */}
          <div className="card tool-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', marginBottom: '8px' }}>
                <FiCheckCircle size={20} />
                <h3>Normalisation des données & catégories</h3>
              </div>
              <p>
                Nettoie et standardise les annonces anciennes de Firestore. Remplace automatiquement les statuts hérités (ex: <code>'sell'</code> ➔ <code>'long-term'</code>, <code>'buy'</code> ➔ <code>'sale'</code>) pour que 100% des annonces s'affichent correctement avec les filtres du site.
              </p>
              {normalizeProgress && (
                <div style={{ padding: '8px 12px', background: '#ECFDF5', color: '#065F46', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '10px' }}>
                  {normalizeProgress}
                </div>
              )}
            </div>
            <button 
              className="btn-primary" 
              style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
              onClick={handleNormalizeData}
              disabled={isNormalizing}
            >
              <FiRefreshCw className={isNormalizing ? "admin-spin" : ""} /> {isNormalizing ? "Normalisation en cours..." : "Normaliser les 400+ annonces"}
            </button>
          </div>
        </div>
      )}

      {/* TAB: REPORTS & MODERATION */}
      {activeTab === 'reports' && (
        <div>
          {/* Summary KPI Cards */}
          <div className="admin-reports-summary">
            <div className="report-summary-box">
              <span className="summary-label">Total Signalements</span>
              <span className="summary-count">{reports.length}</span>
            </div>
            <div className="report-summary-box" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
              <span className="summary-label" style={{ color: '#B91C1C' }}>⚠️ En attente</span>
              <span className="summary-count" style={{ color: '#DC2626' }}>{pendingReportsCount}</span>
            </div>
            <div className="report-summary-box" style={{ borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }}>
              <span className="summary-label" style={{ color: '#1D4ED8' }}>⚖️ Retraits Propriétaire</span>
              <span className="summary-count" style={{ color: '#2563EB' }}>{takedownReportsCount}</span>
            </div>
            <div className="report-summary-box" style={{ borderColor: '#86EFAC', backgroundColor: '#F0FDF4' }}>
              <span className="summary-label" style={{ color: '#15803D' }}>✅ Résolus</span>
              <span className="summary-count" style={{ color: '#16A34A' }}>{resolvedReportsCount}</span>
            </div>
          </div>

          {/* Controls Bar: Search & Status Filters */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              {/* Search */}
              <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 280px' }}>
                <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  placeholder="Rechercher par ticket, ID annonce, email ou motif..."
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className={`btn-filter ${reportFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setReportFilter('pending')}
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  ⚠️ En attente ({pendingReportsCount})
                </button>
                <button 
                  type="button" 
                  className={`btn-filter ${reportFilter === 'takedown' ? 'active' : ''}`}
                  onClick={() => setReportFilter('takedown')}
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  ⚖️ Retraits ({takedownReportsCount})
                </button>
                <button 
                  type="button" 
                  className={`btn-filter ${reportFilter === 'scam' ? 'active' : ''}`}
                  onClick={() => setReportFilter('scam')}
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  🚨 Arnaques
                </button>
                <button 
                  type="button" 
                  className={`btn-filter ${reportFilter === 'resolved' ? 'active' : ''}`}
                  onClick={() => setReportFilter('resolved')}
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  ✅ Résolus
                </button>
                <button 
                  type="button" 
                  className={`btn-filter ${reportFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setReportFilter('all')}
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  Tous ({reports.length})
                </button>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          {loadingReports ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div className="admin-spin" style={{ width: '32px', height: '32px', margin: '0 auto 12px auto', border: '3px solid #E2E8F0', borderTopColor: 'var(--primary-color)', borderRadius: '50%' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Chargement des signalements...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🛡️</div>
              <h3 style={{ marginBottom: '6px' }}>Aucun signalement</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {reportFilter === 'pending' 
                  ? "Excellente nouvelle ! Tous les signalements et demandes de retrait ont été traités." 
                  : "Aucun signalement ne correspond à vos filtres actuels."}
              </p>
            </div>
          ) : (
            <div className="admin-table-wrapper card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket / Date</th>
                    <th>Motif & Détails</th>
                    <th>Annonce ciblée</th>
                    <th>Déclarant</th>
                    <th>Statut</th>
                    <th>Actions Modération</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map(rep => {
                    const isPending = rep.status === 'pending';
                    const isResolved = rep.status === 'resolved';
                    const dateStr = rep.createdAt?.seconds 
                      ? new Date(rep.createdAt.seconds * 1000).toLocaleString('fr-DZ') 
                      : (rep.createdAt ? new Date(rep.createdAt).toLocaleString('fr-DZ') : 'Date inconnue');

                    return (
                      <tr key={rep.id} style={{ backgroundColor: isPending ? '#FFFBEB' : undefined }}>
                        <td style={{ verticalAlign: 'top', width: '150px' }}>
                          <span className="report-ticket-badge">{rep.ticketId}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {dateStr}
                          </div>
                        </td>

                        <td style={{ verticalAlign: 'top', minWidth: '220px' }}>
                          <span className={`report-reason-badge ${rep.reason || 'other'}`}>
                            {rep.reason === 'scam' && '⚠️ Arnaque suspectée'}
                            {rep.reason === 'takedown' && '⚖️ Retrait propriétaire'}
                            {rep.reason === 'wrong_price' && '💰 Prix trompeur'}
                            {rep.reason === 'already_sold' && '🚫 Déjà vendu/loué'}
                            {rep.reason === 'photos' && '📸 Photos trompeuses'}
                            {(!['scam', 'takedown', 'wrong_price', 'already_sold', 'photos'].includes(rep.reason)) && (rep.reason || 'Signalement')}
                          </span>
                          {rep.message && (
                            <div className="report-details-box">
                              "{rep.message}"
                            </div>
                          )}
                        </td>

                        <td style={{ verticalAlign: 'top', maxWidth: '240px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '2px' }}>
                            {rep.listingTitle || 'Annonce sans titre'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            ID : <code>{rep.listingId || 'Non spécifié'}</code>
                          </div>
                          {rep.listingId && (
                            <a 
                              href={`/listing/${rep.listingId}`}
                              target="_blank" 
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--primary-color)', marginTop: '4px', fontWeight: 600 }}
                            >
                              <FiExternalLink size={12} /> Consulter l'annonce
                            </a>
                          )}
                        </td>

                        <td style={{ verticalAlign: 'top', width: '180px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{rep.reporterName || 'Anonyme'}</div>
                          {rep.reporterEmail && (
                            <div style={{ fontSize: '0.8rem' }}>
                              <a href={`mailto:${rep.reporterEmail}`} style={{ color: 'var(--primary-color)' }}>
                                {rep.reporterEmail}
                              </a>
                            </div>
                          )}
                          {rep.reporterPhone && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <a href={`tel:${rep.reporterPhone}`} style={{ color: 'inherit' }}>
                                📞 {rep.reporterPhone}
                              </a>
                            </div>
                          )}
                        </td>

                        <td style={{ verticalAlign: 'top', width: '110px' }}>
                          <span className={`report-status-badge ${rep.status || 'pending'}`}>
                            {isPending && '⚠️ En attente'}
                            {isResolved && '✅ Résolu'}
                            {rep.status === 'dismissed' && '⚪ Rejeté'}
                          </span>
                        </td>

                        <td style={{ verticalAlign: 'top' }}>
                          <div className="report-actions-cell">
                            {isPending && rep.listingId && (
                              <button 
                                type="button" 
                                className="report-action-btn btn-hide"
                                onClick={() => handleHideListingFromReport(rep.listingId, rep.id, rep.sourceCollection)}
                                disabled={reportActionLoading === rep.id}
                                title="Masquer l'annonce du public et marquer comme résolu"
                              >
                                <FiEyeOff size={13} /> Masquer
                              </button>
                            )}

                            {isPending && rep.listingId && (
                              <button 
                                type="button" 
                                className="report-action-btn btn-delete-listing"
                                onClick={() => handleDeleteListingFromReport(rep.listingId, rep.id, rep.sourceCollection)}
                                disabled={reportActionLoading === rep.id}
                                title="Supprimer définitivement l'annonce de la base"
                              >
                                <FiTrash2 size={13} /> Supprimer
                              </button>
                            )}

                            {!isResolved && (
                              <button 
                                type="button" 
                                className="report-action-btn btn-resolve"
                                onClick={() => handleUpdateReportStatus(rep.id, 'resolved', rep.sourceCollection)}
                                disabled={reportActionLoading === rep.id}
                                title="Marquer comme résolu"
                              >
                                <FiCheck size={13} /> Résolu
                              </button>
                            )}

                            {rep.status !== 'dismissed' && (
                              <button 
                                type="button" 
                                className="report-action-btn btn-dismiss"
                                onClick={() => handleUpdateReportStatus(rep.id, 'dismissed', rep.sourceCollection)}
                                disabled={reportActionLoading === rep.id}
                                title="Rejeter le signalement"
                              >
                                <FiX size={13} /> Rejeter
                              </button>
                            )}

                            <button 
                              type="button" 
                              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px' }}
                              onClick={() => handleDeleteReport(rep.id, rep.sourceCollection)}
                              title="Supprimer ce ticket de l'historique"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal: Delete Listing */}
      {deletingListing && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setDeletingListing(null)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#EF4444', marginBottom: '12px' }}>
              <FiAlertTriangle size={24} />
              <h3 style={{ margin: 0, fontWeight: 700 }}>{t('admin.delete_title') || "Supprimer l'annonce ?"}</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.95rem' }}>
              {t('admin.delete_warning') || "Cette action est irréversible. L'annonce sera immédiatement retirée de Darkoum."}
            </p>
            <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
              <strong>{deletingListing.title}</strong>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                ID: {deletingListing.id} • {deletingListing.city}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-outline" 
                onClick={() => setDeletingListing(null)}
                disabled={isDeleting}
              >
                {t('misc.no') || "Annuler"}
              </button>
              <button 
                type="button" 
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (t('misc.loading') || "Suppression...") : (t('admin.btn_delete') || "Supprimer")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reseed */}
      {reseedConfirmOpen && (
        <div className="modal-backdrop" onClick={() => !isReseeding && setReseedConfirmOpen(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#D97706', marginBottom: '12px' }}>
              <FiRefreshCw size={24} />
              <h3 style={{ margin: 0, fontWeight: 700 }}>Synchroniser Firestore ?</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              {t('admin.reseed_confirm') || "Êtes-vous sûr de vouloir synchroniser le jeu d'annonces de référence dans Firestore ?"}
            </p>
            {reseedProgress && (
              <div style={{ padding: '12px', background: '#FEF3C7', color: '#92400E', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 500 }}>
                {reseedProgress}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-outline" 
                onClick={() => setReseedConfirmOpen(false)}
                disabled={isReseeding}
              >
                {t('misc.no') || "Annuler"}
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleReseed}
                disabled={isReseeding}
              >
                {isReseeding ? "Importation..." : "Confirmer l'import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast">
          <FiCheckCircle size={18} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Admin;

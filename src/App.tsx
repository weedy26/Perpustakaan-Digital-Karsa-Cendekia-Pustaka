import React, { useState, useEffect } from "react";
import { MessageSquare, X, Copy, CheckCircle2, AlertCircle, Menu } from "lucide-react";
import { User } from "firebase/auth";

// Google Sheets API & Auth Utilities
import {
  initAuth,
  googleSignIn,
  logout,
  findOrCreateSpreadsheet,
  loadAllFromGoogleSheets,
  saveAllToGoogleSheets
} from "./utils/googleSheets";

// Components imports
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import ClassView from "./components/ClassView";
import BookView from "./components/BookView";
import MemberView from "./components/MemberView";
import LoanView from "./components/LoanView";
import CardView from "./components/CardView";
import HistoryView from "./components/HistoryView";
import ReportView from "./components/ReportView";
import SettingsView from "./components/SettingsView";
import LoginView from "./components/LoginView";

// Initial data templates
import {
  initialClasses,
  initialBooks,
  initialMembers,
  initialLoans,
  initialLibraryIdentity,
  initialWaTemplates,
  initialSystemConfig
} from "./data/initialData";

// Type definitions
import { ClassItem, Book, Member, Loan, LibraryIdentity, WaTemplate, SystemConfig } from "./types";
import { formatToDDMMYYYY } from "./utils/dateFormatter";

function extractSpreadsheetId(input: string): string {
  const matches = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (matches && matches[1]) {
    return matches[1];
  }
  return input.trim();
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Domain Core States with LocalStorage Hydration
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const saved = localStorage.getItem("library_classes");
    return saved ? JSON.parse(saved) : initialClasses;
  });

  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem("library_books");
    return saved ? JSON.parse(saved) : initialBooks;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem("library_members");
    return saved ? JSON.parse(saved) : initialMembers;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem("library_loans");
    return saved ? JSON.parse(saved) : initialLoans;
  });

  const [identity, setIdentity] = useState<LibraryIdentity>(() => {
    const saved = localStorage.getItem("library_identity");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.libraryName === "KARSA CENDEKIA") {
          parsed.libraryName = "KARSA CENDEKIA PUSTAKA";
        }
        return parsed;
      } catch (e) {
        return initialLibraryIdentity;
      }
    }
    return initialLibraryIdentity;
  });

  const [templates, setTemplates] = useState<WaTemplate[]>(() => {
    const saved = localStorage.getItem("library_templates");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((t: WaTemplate) => {
          if (t.text && t.text.includes("🏫 KARSA CENDEKIA\n")) {
            return {
              ...t,
              text: t.text.replace("🏫 KARSA CENDEKIA\n", "🏫 KARSA CENDEKIA PUSTAKA\n")
            };
          }
          return t;
        });
      } catch (e) {
        return initialWaTemplates;
      }
    }
    return initialWaTemplates;
  });

  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem("library_config");
    return saved ? JSON.parse(saved) : initialSystemConfig;
  });

  // Google Sheets Database States
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    const saved = localStorage.getItem("library_spreadsheet_id");
    if (saved && saved !== "1YXzAd1V1xyCM3_N-1dprY5Fojqg7L2h3d2gxkeA5Tko") {
      localStorage.setItem("library_spreadsheet_id", "1YXzAd1V1xyCM3_N-1dprY5Fojqg7L2h3d2gxkeA5Tko");
      return "1YXzAd1V1xyCM3_N-1dprY5Fojqg7L2h3d2gxkeA5Tko";
    }
    return saved || "1YXzAd1V1xyCM3_N-1dprY5Fojqg7L2h3d2gxkeA5Tko";
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [sheetsSyncEnabled, setSheetsSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem("library_sheets_sync_enabled") === "true";
  });
  const [isEditingSheetId, setIsEditingSheetId] = useState<boolean>(false);
  const [hasInitialPulled, setHasInitialPulled] = useState<boolean>(false);
  const [showAuthErrorGuide, setShowAuthErrorGuide] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [appConfirm, setAppConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [sheetIdInput, setSheetIdInput] = useState<string>(spreadsheetId || "1YXzAd1V1xyCM3_N-1dprY5Fojqg7L2h3d2gxkeA5Tko");

  // Admin Login States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("library_admin_logged_in") === "true";
  });
  const [adminUsername, setAdminUsername] = useState<string>(() => {
    return localStorage.getItem("library_admin_username") || "admin";
  });
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem("library_admin_password") || "admin";
  });

  const handleLogin = (usr: string, pass: string, remember: boolean): boolean => {
    if (usr === adminUsername && pass === adminPassword) {
      setIsLoggedIn(true);
      if (remember) {
        localStorage.setItem("library_admin_logged_in", "true");
      } else {
        localStorage.removeItem("library_admin_logged_in");
      }
      showToast("Berhasil masuk sebagai administrator!");
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("library_admin_logged_in");
    showToast("Sesi administrator ditutup.", "info");
  };

  const handleUpdatePassword = (oldPass: string, newPass: string): boolean => {
    if (oldPass !== adminPassword) {
      showToast("Password lama salah!", "error");
      return false;
    }
    setAdminPassword(newPass);
    localStorage.setItem("library_admin_password", newPass);
    showToast("Password administrator berhasil diubah!");
    return true;
  };

  useEffect(() => {
    if (spreadsheetId) {
      setSheetIdInput(spreadsheetId);
    }
  }, [spreadsheetId]);

  // UI Interactive States
  const [selectedPrintMemberId, setSelectedPrintMemberId] = useState<string>("");
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [activeWaLoan, setActiveWaLoan] = useState<Loan | null>(null);
  const [copiedWaMessage, setCopiedWaMessage] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem("library_classes", JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem("library_books", JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem("library_members", JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem("library_loans", JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem("library_identity", JSON.stringify(identity));
  }, [identity]);

  useEffect(() => {
    localStorage.setItem("library_templates", JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem("library_config", JSON.stringify(config));
  }, [config]);

  // Auto-authenticate Google user if signed in before
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save spreadsheet ID and sync setting to localStorage
  useEffect(() => {
    if (spreadsheetId) {
      localStorage.setItem("library_spreadsheet_id", spreadsheetId);
    } else {
      localStorage.removeItem("library_spreadsheet_id");
    }
  }, [spreadsheetId]);

  useEffect(() => {
    localStorage.setItem("library_sheets_sync_enabled", String(sheetsSyncEnabled));
  }, [sheetsSyncEnabled]);

  // Debounced auto-save to Google Sheets when data changes
  useEffect(() => {
    if (!sheetsSyncEnabled || !googleToken || !spreadsheetId) return;

    const delayDebounceFn = setTimeout(() => {
      saveAllToGoogleSheets(spreadsheetId, googleToken, {
        classes,
        books,
        members,
        loans,
        identity,
        config,
        templates
      })
      .then(() => {
        console.log("Auto-sync Google Sheets completed successfully.");
      })
      .catch((err) => {
        console.warn("Auto-sync Google Sheets failed:", err);
      });
    }, 1500); // 1.5 seconds debounce

    return () => clearTimeout(delayDebounceFn);
  }, [classes, books, members, loans, identity, config, templates, googleToken, spreadsheetId, sheetsSyncEnabled]);

  // Auto-pull from Google Sheets once when a connection is established
  useEffect(() => {
    if (!sheetsSyncEnabled || !googleToken || !spreadsheetId || hasInitialPulled) return;

    const autoPullData = async () => {
      try {
        setIsSyncing(true);
        const sheetsData = await loadAllFromGoogleSheets(spreadsheetId, googleToken);
        const hasSheetsData = sheetsData.books.length > 0 || sheetsData.members.length > 0 || sheetsData.loans.length > 0;
        
        if (hasSheetsData) {
          setClasses(sheetsData.classes.length > 0 ? sheetsData.classes : classes);
          setBooks(sheetsData.books.length > 0 ? sheetsData.books : books);
          setMembers(sheetsData.members.length > 0 ? sheetsData.members : members);
          setLoans(sheetsData.loans.length > 0 ? sheetsData.loans : loans);
          if (sheetsData.identity) setIdentity(sheetsData.identity);
          if (sheetsData.config) setConfig(sheetsData.config);
          if (sheetsData.templates.length > 0) setTemplates(sheetsData.templates);
          showToast("Sinkronisasi otomatis: Berhasil memuat data terbaru dari Google Sheets!", "info");
        }
        setHasInitialPulled(true);
      } catch (error: any) {
        console.warn("Koneksi otomatis gagal memperbarui data:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    autoPullData();
  }, [googleToken, spreadsheetId, sheetsSyncEnabled, hasInitialPulled]);

  const handleGoogleSignIn = async () => {
    setIsSyncing(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        showToast(`Berhasil masuk sebagai ${res.user.email}`);

        // Use specified spreadsheet ID if defined, otherwise find or create
        let sheetId = spreadsheetId;
        if (!sheetId) {
          sheetId = await findOrCreateSpreadsheet(res.accessToken);
          setSpreadsheetId(sheetId);
        }
        setSheetsSyncEnabled(true);

        // Offer to pull or push
        const sheetsData = await loadAllFromGoogleSheets(sheetId, res.accessToken);
        const hasSheetsData = sheetsData.books.length > 0 || sheetsData.members.length > 0 || sheetsData.loans.length > 0;

        if (hasSheetsData) {
          // Spreadsheet has data! Let's load it.
          setClasses(sheetsData.classes.length > 0 ? sheetsData.classes : classes);
          setBooks(sheetsData.books.length > 0 ? sheetsData.books : books);
          setMembers(sheetsData.members.length > 0 ? sheetsData.members : members);
          setLoans(sheetsData.loans.length > 0 ? sheetsData.loans : loans);
          if (sheetsData.identity) setIdentity(sheetsData.identity);
          if (sheetsData.config) setConfig(sheetsData.config);
          if (sheetsData.templates.length > 0) setTemplates(sheetsData.templates);
          showToast("Data perpustakaan berhasil diunduh dari Google Sheets!");
        } else {
          // Spreadsheet is empty! Let's seed it with our local data.
          await saveAllToGoogleSheets(sheetId, res.accessToken, {
            classes,
            books,
            members,
            loans,
            identity,
            config,
            templates
          });
          showToast("Data lokal berhasil disinkronkan ke Google Sheets baru!");
        }
        setHasInitialPulled(true);
      }
    } catch (error: any) {
      console.error("Sign in error details:", error);
      const errStr = String(error.message || error);
      const isPopupClosedOrBlocked = 
        errStr.includes("popup-closed-by-user") || 
        errStr.includes("popup-blocked") || 
        (error.code && (error.code === "auth/popup-closed-by-user" || error.code === "auth/popup-blocked"));

      if (isPopupClosedOrBlocked) {
        setShowAuthErrorGuide(true);
        showToast("Sambungan Google Sheets gagal: Pop-up ditutup atau diblokir.", "error");
      } else {
        showToast("Gagal menyambungkan Google Sheets: " + (error.message || errStr), "error");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToSheets = async () => {
    if (!googleToken || !spreadsheetId) {
      showToast("Harap hubungkan akun Google Sheets Anda terlebih dahulu.", "error");
      return;
    }
    setAppConfirm({
      title: "Unggah Data ke Google Sheets",
      message: "Apakah Anda yakin ingin mengunggah semua data lokal ke Google Sheets? Tindakan ini akan menimpa data yang ada di Google Sheets.",
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          await saveAllToGoogleSheets(spreadsheetId, googleToken, {
            classes,
            books,
            members,
            loans,
            identity,
            config,
            templates
          });
          showToast("Berhasil mengunggah semua data ke Google Sheets!");
        } catch (error: any) {
          console.error(error);
          showToast("Gagal mengunggah data: " + (error.message || ""), "error");
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  const handlePullFromSheets = async () => {
    if (!googleToken || !spreadsheetId) {
      showToast("Harap hubungkan akun Google Sheets Anda terlebih dahulu.", "error");
      return;
    }
    setAppConfirm({
      title: "Unduh Data dari Google Sheets",
      message: "Apakah Anda yakin ingin mengunduh semua data dari Google Sheets? Tindakan ini akan menimpa semua data lokal Anda.",
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const sheetsData = await loadAllFromGoogleSheets(spreadsheetId, googleToken);
          setClasses(sheetsData.classes);
          setBooks(sheetsData.books);
          setMembers(sheetsData.members);
          setLoans(sheetsData.loans);
          if (sheetsData.identity) setIdentity(sheetsData.identity);
          if (sheetsData.config) setConfig(sheetsData.config);
          if (sheetsData.templates.length > 0) setTemplates(sheetsData.templates);
          showToast("Berhasil mengunduh semua data dari Google Sheets!");
        } catch (error: any) {
          console.error(error);
          showToast("Gagal mengunduh data: " + (error.message || ""), "error");
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  const handleGoogleLogout = async () => {
    setAppConfirm({
      title: "Putus Koneksi Google Sheets",
      message: "Apakah Anda yakin ingin memutuskan koneksi Google Sheets?",
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          await logout();
          setGoogleUser(null);
          setGoogleToken(null);
          setSpreadsheetId(null);
          setSheetsSyncEnabled(false);
          setHasInitialPulled(false);
          showToast("Berhasil memutuskan koneksi Google Sheets.");
        } catch (error: any) {
          console.error(error);
          showToast("Gagal memutuskan koneksi.", "error");
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  // Toast trigger helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // RECALCULATE DELAYS AND FINES
  const calculateFinesAndStatus = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date(todayStr);

    let updated = false;
    const nextLoans = loans.map((loan) => {
      if (loan.returnDate !== null) return loan;

      const dueDate = new Date(loan.dueDate);
      
      if (today > dueDate) {
        // Calculate diff days
        const diffTime = Math.abs(today.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const computedFine = diffDays * config.finePerDay;

        if (loan.status !== "TERLAMBAT" || loan.fineAmount !== computedFine) {
          updated = true;
          return {
            ...loan,
            status: "TERLAMBAT" as const,
            fineAmount: computedFine
          };
        }
      } else {
        if (loan.status !== "DIPINJAM" || loan.fineAmount !== 0) {
          updated = true;
          return {
            ...loan,
            status: "DIPINJAM" as const,
            fineAmount: 0
          };
        }
      }
      return loan;
    });

    if (updated) {
      setLoans(nextLoans);
    }
  };

  // Run calculation on initial load
  useEffect(() => {
    calculateFinesAndStatus();
  }, []);

  // -----------------------------
  // CLASSES SERVICES
  // -----------------------------
  const handleAddClass = (newClass: Omit<ClassItem, "id">) => {
    setClasses(prev => {
      const id = "c" + (prev.length + 1) + "_" + Math.random().toString(36).substring(2, 5);
      return [...prev, { id, ...newClass }];
    });
    showToast(`Kelas ${newClass.name} berhasil ditambahkan!`);
  };

  const handleEditClass = (updatedClass: ClassItem) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
    showToast(`Detail kelas ${updatedClass.name} berhasil diperbarui!`);
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    showToast("Kelas berhasil dihapus!");
  };

  // -----------------------------
  // BOOKS SERVICES
  // -----------------------------
  const handleAddBook = (newBook: Omit<Book, "id" | "availableQty"> | Omit<Book, "id" | "availableQty">[]) => {
    if (Array.isArray(newBook)) {
      setBooks(prev => {
        let currentLength = prev.length;
        const mapped = newBook.map((b) => {
          currentLength++;
          const id = "b" + currentLength + "_" + Math.random().toString(36).substring(2, 5);
          return { id, ...b, availableQty: b.qty };
        });
        return [...prev, ...mapped];
      });
      showToast(`Berhasil mendaftarkan ${newBook.length} buku baru!`);
    } else {
      setBooks(prev => {
        const id = "b" + (prev.length + 1) + "_" + Math.random().toString(36).substring(2, 5);
        return [...prev, { id, ...newBook, availableQty: newBook.qty }];
      });
      showToast(`Buku "${newBook.title}" berhasil ditambahkan!`);
    }
  };

  const handleEditBook = (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    showToast(`Detail buku "${updatedBook.title}" berhasil diperbarui!`);
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
    showToast("Buku berhasil dihapus dari katalog!");
  };

  // -----------------------------
  // MEMBERS SERVICES
  // -----------------------------
  const handleAddMember = (newMember: Member | Member[]) => {
    if (Array.isArray(newMember)) {
      setMembers(prev => [...prev, ...newMember]);
      showToast(`Berhasil mendaftarkan ${newMember.length} anggota baru!`);
    } else {
      setMembers(prev => [...prev, newMember]);
      showToast(`Siswa ${newMember.name} berhasil didaftarkan sebagai anggota!`);
    }
  };

  const handleEditMember = (updatedMember: Member) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    showToast(`Detail profil ${updatedMember.name} berhasil disimpan!`);
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    showToast("Anggota berhasil dihapus!");
  };

  const handlePrintCardTrigger = (memberId: string) => {
    setSelectedPrintMemberId(memberId);
    setActiveTab("card");
    showToast("Pratinjau kartu anggota siap dicetak!");
  };

  // -----------------------------
  // LOANS SERVICES
  // -----------------------------
  const handleAddLoan = (newLoan: Omit<Loan, "id" | "status" | "fineAmount">) => {
    // Generate sequential borrow ID
    const activeCount = loans.length;
    const id = "P" + String(activeCount + 1).padStart(3, "0");
    
    const loanRecord: Loan = {
      id,
      ...newLoan,
      status: "DIPINJAM",
      fineAmount: 0
    };

    // Deduct stock
    setBooks(books.map(b => {
      if (b.id === newLoan.bookId) {
        return { ...b, availableQty: Math.max(0, b.availableQty - 1) };
      }
      return b;
    }));

    setLoans([loanRecord, ...loans]);
    showToast(`Peminjaman ${id} berhasil dicatat!`);
  };

  const handleReturnLoan = (loanId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    setLoans(loans.map(l => {
      if (l.id === loanId) {
        // Return 1 back to books availableQty
        setBooks(books.map(b => {
          if (b.id === l.bookId) {
            return { ...b, availableQty: Math.min(b.qty, b.availableQty + 1) };
          }
          return b;
        }));

        return {
          ...l,
          returnDate: todayStr,
          status: "SELESAI" as const
        };
      }
      return l;
    }));

    showToast(`Buku pada transaksi ${loanId} berhasil dikembalikan!`);
  };

  const handleDeleteLoan = (loanId: string) => {
    const loanToDel = loans.find(l => l.id === loanId);
    if (loanToDel && loanToDel.returnDate === null) {
      // Restore quantity back if active loan was deleted
      setBooks(books.map(b => {
        if (b.id === loanToDel.bookId) {
          return { ...b, availableQty: Math.min(b.qty, b.availableQty + 1) };
        }
        return b;
      }));
    }

    setLoans(loans.filter(l => l.id !== loanId));
    showToast(`Transaksi ${loanId} berhasil dihapus!`);
  };

  // -----------------------------
  // WA UTILITIES & TEMPLATES
  // -----------------------------
  const handleOpenWaModal = (loan: Loan) => {
    setActiveWaLoan(loan);
    setCopiedWaMessage(false);
  };

  const handleUpdateTemplateText = (type: "PINJAM" | "TERLAMBAT", text: string) => {
    setTemplates(templates.map(t => t.type === type ? { ...t, text } : t));
    showToast("Template WhatsApp berhasil disimpan!");
  };

  const getPopulatedWaText = (loan: Loan) => {
    const member = members.find(m => m.id === loan.memberId);
    const book = books.find(b => b.id === loan.bookId);
    const templateObj = templates.find(t => t.type === (loan.status === "TERLAMBAT" ? "TERLAMBAT" : "PINJAM")) || templates[0];

    let txt = templateObj.text;
    txt = txt.replace(/{NAMA_SISWA}/g, member ? member.name : "Siswa");
    txt = txt.replace(/{JUDUL_BUKU}/g, book ? book.title : "Buku");
    txt = txt.replace(/{TGL_PINJAM}/g, formatToDDMMYYYY(loan.loanDate));
    txt = txt.replace(/{TGL_JATUH_TEMPO}/g, formatToDDMMYYYY(loan.dueDate));
    txt = txt.replace(/{TARIF_DENDA}/g, String(config.finePerDay));
    
    // Calculate late days
    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date(todayStr);
    const due = new Date(loan.dueDate);
    const diffTime = Math.max(0, today.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    txt = txt.replace(/{HARI_TERLAMBAT}/g, String(diffDays));
    txt = txt.replace(/{TOTAL_DENDA}/g, new Intl.NumberFormat("id-ID").format(loan.fineAmount));

    return txt;
  };

  const handleCopyWaText = () => {
    if (!activeWaLoan) return;
    const text = getPopulatedWaText(activeWaLoan);
    navigator.clipboard.writeText(text);
    setCopiedWaMessage(true);
    showToast("Teks WhatsApp disalin ke clipboard!");
    setTimeout(() => setCopiedWaMessage(false), 2000);
  };

  const handleSimulateSendWa = () => {
    if (!activeWaLoan) return;
    const member = members.find(m => m.id === activeWaLoan.memberId);
    const text = encodeURIComponent(getPopulatedWaText(activeWaLoan));
    const phoneNum = member ? member.phone : "";
    
    // Create WhatsApp web URL
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneNum}&text=${text}`;
    
    // Open in mock style or notification since actual window.open is restricted in iframe by browser default policies
    showToast(`Mengirim pesan WhatsApp ke ${member ? member.name : "Siswa"} (${phoneNum})...`);
    
    // Try window open (it might open in new tab if user has popup blocker off or if they choose to)
    try {
      window.open(waUrl, "_blank");
    } catch (e) {
      // Fallback
    }

    setActiveWaLoan(null);
  };

  // -----------------------------
  // SYSTEM & DATABASE OPERATIONS
  // -----------------------------
  const handleUpdateConfig = (newConfig: SystemConfig) => {
    setConfig(newConfig);
    showToast("Pengaturan denda & peminjaman berhasil disimpan!");
  };

  const handleResetDatabase = () => {
    localStorage.clear();
    setClasses(initialClasses);
    setBooks(initialBooks);
    setMembers(initialMembers);
    setLoans(initialLoans);
    setIdentity(initialLibraryIdentity);
    setTemplates(initialWaTemplates);
    setConfig(initialSystemConfig);
    
    setActiveTab("dashboard");
    showToast("Database berhasil diinisialisasi ulang ke kondisi standar!", "info");
  };

  const handleManualDelayCheck = () => {
    calculateFinesAndStatus();
    showToast("Pemeriksaan keterlambatan selesai! Nominal denda telah dihitung ulang.");
  };

  // Render proper sub-views dynamically based on the activeTab
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            books={books}
            members={members}
            loans={loans}
            identity={identity}
            config={config}
            onReturnLoan={handleReturnLoan}
            onOpenAddLoan={() => {
              setActiveTab("loans");
              setIsAddLoanModalOpen(true);
            }}
            onSendWa={handleOpenWaModal}
            onRefresh={handleManualDelayCheck}
            googleUser={googleUser}
            isSyncing={isSyncing}
            onPushToSheets={handlePushToSheets}
            onPullFromSheets={handlePullFromSheets}
          />
        );
      case "classes":
        return (
          <ClassView
            classes={classes}
            onAddClass={handleAddClass}
            onEditClass={handleEditClass}
            onDeleteClass={handleDeleteClass}
            identity={identity}
            members={members}
            onAddMember={handleAddMember}
          />
        );
      case "books":
        return (
          <BookView
            books={books}
            onAddBook={handleAddBook}
            onEditBook={handleEditBook}
            onDeleteBook={handleDeleteBook}
            identity={identity}
          />
        );
      case "members":
        return (
          <MemberView
            members={members}
            classes={classes}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onPrintCard={handlePrintCardTrigger}
            identity={identity}
          />
        );
      case "loans":
        return (
          <LoanView
            loans={loans}
            members={members}
            books={books}
            classes={classes}
            config={config}
            onAddLoan={handleAddLoan}
            onAddMember={handleAddMember}
            onReturnLoan={handleReturnLoan}
            onDeleteLoan={handleDeleteLoan}
            onSendWa={handleOpenWaModal}
            identity={identity}
            isAddModalOpenInitially={isAddLoanModalOpen}
            onCloseAddModalInitially={() => setIsAddLoanModalOpen(false)}
          />
        );
      case "card":
        return (
          <CardView
            members={members}
            classes={classes}
            identity={identity}
            selectedMemberIdInitially={selectedPrintMemberId}
          />
        );
      case "history":
        return (
          <HistoryView
            loans={loans}
            members={members}
            books={books}
            identity={identity}
          />
        );
      case "reports":
        return (
          <ReportView
            books={books}
            members={members}
            loans={loans}
            identity={identity}
          />
        );
      case "settings":
        return (
          <SettingsView
            identity={identity}
            onUpdateIdentity={setIdentity}
            templates={templates}
            onUpdateTemplate={handleUpdateTemplateText}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onResetDatabase={handleResetDatabase}
            onRunDelayCheck={handleManualDelayCheck}
            onUpdatePassword={handleUpdatePassword}
          />
        );
      default:
        return <div className="p-6">View tidak ditemukan.</div>;
    }
  };

  const activeLoansCount = loans.filter(l => l.returnDate === null).length;

  if (!isLoggedIn) {
    return (
      <LoginView
        onLogin={handleLogin}
        libraryName={identity.libraryName}
        schoolName={identity.schoolName}
        logo={identity.logo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex text-slate-100 font-sans print:bg-white print:text-black">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false); // auto-close mobile sidebar drawer
          // clear print selection state when switching away from card
          if (tab !== "card") {
            setSelectedPrintMemberId("");
          }
        }}
        activeLoansCount={activeLoansCount}
        libraryName={identity.libraryName}
        schoolName={identity.schoolName}
        logo={identity.logo}
        onLogout={handleAdminLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Layout */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen bg-[#0b0f19] relative print:ml-0 print:p-0 flex flex-col">
        {/* Mobile Header Bar */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-30 md:hidden print:hidden">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center min-w-0">
              <span className="font-extrabold text-sm text-slate-100 tracking-tight uppercase break-words">
                {identity.libraryName}
              </span>
            </div>
          </div>
          <div className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {activeTab === "dashboard" ? "Dashboard" :
             activeTab === "classes" ? "Kelas" :
             activeTab === "books" ? "Buku" :
             activeTab === "members" ? "Anggota" :
             activeTab === "loans" ? "Peminjaman" :
             activeTab === "card" ? "Kartu" :
             activeTab === "history" ? "Riwayat" :
             activeTab === "reports" ? "Laporan" : "Pengaturan"}
          </div>
        </div>
        {/* Google Sheets Integration Status Bar */}
        <div className="mb-6 bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col space-y-4 print:hidden text-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-900/40 flex-shrink-0">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center space-x-2">
                  <span>Google Sheets Database</span>
                  {googleUser ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-900 text-emerald-400 tracking-wider uppercase animate-pulse">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-400 tracking-wider uppercase">
                      Lokal
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 leading-normal mt-0.5">
                  {googleUser ? (
                    <>
                      Tersambung ke <span className="font-semibold text-slate-200">{googleUser.email}</span>
                    </>
                  ) : (
                    "Data disimpan di browser Anda. Hubungkan ke Google Sheets untuk penyimpanan tak terbatas dan aman."
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {googleUser ? (
                <>
                  {spreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all"
                    >
                      <span>👁️</span>
                      <span>Buka Spreadsheet</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handlePullFromSheets}
                    disabled={isSyncing}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-100/50 transition-all disabled:opacity-50 cursor-pointer"
                    title="Unduh data dari Google Sheets dan timpa data lokal"
                  >
                    <span>⬇️</span>
                    <span>Tarik Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePushToSheets}
                    disabled={isSyncing}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-100/50 transition-all disabled:opacity-50 cursor-pointer"
                    title="Unggah data lokal saat ini ke Google Sheets"
                  >
                    <span>⬆️</span>
                    <span>Unggah Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleLogout}
                    disabled={isSyncing}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-100/50 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span>Putuskan</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSyncing}
                  className="gsi-material-button inline-flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-100 disabled:opacity-50 cursor-pointer"
                >
                  {isSyncing ? (
                    <span>Menghubungkan...</span>
                  ) : (
                    <>
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 flex-shrink-0">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                      <span>Hubungkan Google Sheets</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Spreadsheet ID / Link Configurator Area */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-3">
            <div className="flex items-center space-x-2 text-slate-400 flex-grow">
              <span className="font-bold whitespace-nowrap">ID Google Sheet:</span>
              {isEditingSheetId ? (
                <div className="flex items-center space-x-2 w-full max-w-xl">
                  <input
                    type="text"
                    value={sheetIdInput}
                    onChange={(e) => setSheetIdInput(e.target.value)}
                    placeholder="Masukkan ID Spreadsheet atau Link Google Sheets..."
                    className="w-full px-3 py-1.5 border border-slate-800 rounded-lg text-slate-100 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const extractedId = extractSpreadsheetId(sheetIdInput);
                      if (extractedId) {
                        setSpreadsheetId(extractedId);
                        setIsEditingSheetId(false);
                        showToast(`ID Google Sheet berhasil diperbarui ke: ${extractedId}`);
                      } else {
                        showToast("ID Google Sheet tidak boleh kosong", "error");
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetIdInput(spreadsheetId || "");
                      setIsEditingSheetId(false);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 select-all font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                  <span className="truncate max-w-[280px] sm:max-w-md">{spreadsheetId || "Belum dikonfigurasi"}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingSheetId(true)}
                    className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer font-sans text-[11px] ml-1.5"
                  >
                    Ubah
                  </button>
                </div>
              )}
            </div>
            {googleUser && (
              <div className="flex items-center space-x-2.5 text-slate-400 shrink-0">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sheetsSyncEnabled}
                    onChange={(e) => setSheetsSyncEnabled(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-emerald-800 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-[11px]">Auto-Sync Otomatis</span>
                </label>
              </div>
            )}
          </div>

          {/* Guide panel for Google Sheets Popup Errors */}
          {showAuthErrorGuide && (
            <div className="mt-4 p-4.5 bg-amber-950/30 border border-amber-900/30 rounded-2xl text-xs space-y-3 text-slate-300 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-900/20">
                <span className="font-extrabold text-amber-400 flex items-center space-x-2">
                  <span className="text-sm">⚠️</span>
                  <span>Solusi Masalah Sambungan Google Sheets (Pembatasan Iframe)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAuthErrorGuide(false)}
                  className="text-slate-400 hover:text-slate-200 font-bold px-1.5 py-0.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="leading-relaxed text-slate-400">
                Otentikasi Google Sheets memerlukan pop-up otentikasi Firebase. Karena aplikasi Anda berjalan di dalam bingkai (iframe) pratinjau AI Studio, peramban sering kali memblokir jendela pop-up tersebut demi alasan keamanan.
              </p>
              <div className="space-y-2 pl-1.5">
                <div className="flex items-start space-x-2">
                  <span className="bg-amber-900/40 text-amber-400 w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <div className="leading-relaxed">
                    <strong className="text-amber-400">Rekomendasi Utama - Buka di Tab Baru:</strong> Silakan klik tombol <strong className="text-white">"Buka di Tab Baru" (Open in New Tab)</strong> yang terletak di sudut kanan atas layar Anda. Di sana, aplikasi berjalan bebas tanpa batasan iframe, dan Anda bisa menyambungkan Google Sheets secara langsung dengan lancar.
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-amber-900/40 text-amber-400 w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <div className="leading-relaxed">
                    <strong className="text-amber-400">Izinkan Jendela Pop-up:</strong> Periksa bilah alamat peramban Anda (biasanya muncul ikon pop-up terblokir 🚫 di sebelah kanan) lalu pilih <strong className="text-white">"Selalu izinkan pop-up"</strong> untuk situs ini.
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="bg-amber-900/40 text-amber-400 w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <div className="leading-relaxed">
                    <strong className="text-amber-400">Gunakan Mode Penyamaran (Incognito):</strong> Terkadang ekstensi pemblokir iklan (ad-blocker) memblokir pop-up secara tidak sengaja. Menggunakan mode penyamaran atau menonaktifkan ekstensi tersebut dapat membantu.
                  </div>
                </div>
              </div>
              <div className="pt-2 flex items-center space-x-2.5 border-t border-amber-900/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthErrorGuide(false);
                    handleGoogleSignIn();
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer text-xs"
                >
                  Coba Hubungkan Lagi
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthErrorGuide(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer text-xs"
                >
                  Tutup Panduan
                </button>
              </div>
            </div>
          )}
        </div>

        {renderActiveView()}
      </main>

      {/* WhatsApp Message Preview Modal */}
      {activeWaLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-5 h-5 text-emerald-600 animate-bounce" />
                <h3 className="font-bold text-slate-800 text-[15px]">
                  Kirim Notifikasi WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setActiveWaLoan(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-500 leading-normal">
                Berikut adalah draf pesan otomatisasi yang telah dipolpulasikan secara dinamis berdasarkan status peminjaman. Silakan salin pesan atau luncurkan aplikasi WhatsApp untuk langsung mengirimnya.
              </div>

              {/* Populated Draft Display */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs font-mono whitespace-pre-wrap text-slate-700 max-h-[220px] overflow-y-auto leading-relaxed">
                {getPopulatedWaText(activeWaLoan)}
              </div>

              {/* Recipient Details display */}
              <div className="flex justify-between items-center bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Penerima / No WhatsApp
                  </div>
                  <div className="text-[13px] font-extrabold text-slate-800 mt-0.5">
                    {members.find(m => m.id === activeWaLoan.memberId)?.name}
                  </div>
                </div>
                <div className="font-mono font-bold text-emerald-700 bg-emerald-100/50 px-3 py-1 rounded-lg text-xs">
                  {members.find(m => m.id === activeWaLoan.memberId)?.phone}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveWaLoan(null)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleCopyWaText}
                  className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedWaMessage ? "Tersalin!" : "Salin Pesan"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSimulateSendWa}
                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-200"
                >
                  <span>💬</span>
                  <span>Kirim WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Animated Toast Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className={`p-4 rounded-2xl shadow-xl flex items-center space-x-3 border ${
            toast.type === "success" 
              ? "bg-white border-emerald-100 text-emerald-800" 
              : toast.type === "error"
              ? "bg-white border-red-100 text-red-800"
              : "bg-white border-blue-100 text-blue-800"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${toast.type === "error" ? "text-red-500" : "text-blue-500"}`} />
            )}
            <span className="text-xs font-bold leading-normal">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Global App Confirm Modal */}
      {appConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 p-6 space-y-6">
            <div className="flex items-center space-x-3 text-emerald-400">
              <span className="text-2xl">⚡</span>
              <h3 className="text-base font-extrabold text-slate-100">{appConfirm.title}</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              {appConfirm.message}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setAppConfirm(null)}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  appConfirm.onConfirm();
                  setAppConfirm(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/25 cursor-pointer"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

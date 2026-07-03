import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  RefreshCw, 
  MessageSquare, 
  Trash2, 
  CheckCircle, 
  X, 
  Check, 
  Calendar,
  User,
  BookOpen,
  BookmarkPlus,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  QrCode,
  Camera
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Loan, Member, Book, SystemConfig, ClassItem } from "../types";
import { formatIndonesianDate, formatToDDMMYYYY } from "../utils/dateFormatter";

interface LoanViewProps {
  loans: Loan[];
  members: Member[];
  books: Book[];
  classes: ClassItem[];
  config: SystemConfig;
  onAddLoan: (newLoan: Omit<Loan, "id" | "status" | "fineAmount">) => void;
  onAddMember?: (newMember: Member) => void;
  onReturnLoan: (loanId: string) => void;
  onDeleteLoan: (loanId: string) => void;
  onSendWa: (loan: Loan) => void;
  identity: { libraryName: string; schoolName: string };
  isAddModalOpenInitially?: boolean;
  onCloseAddModalInitially?: () => void;
}

export default function LoanView({
  loans,
  members,
  books,
  classes,
  config,
  onAddLoan,
  onAddMember,
  onReturnLoan,
  onDeleteLoan,
  onSendWa,
  identity,
  isAddModalOpenInitially = false,
  onCloseAddModalInitially
}: LoanViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DIPINJAM" | "TERLAMBAT" | "SELESAI">("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(isAddModalOpenInitially);

  // Sync state with parent component
  React.useEffect(() => {
    if (isAddModalOpenInitially) {
      setIsAddModalOpen(true);
    }
  }, [isAddModalOpenInitially]);

  // Delete confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState<string>("");

  // Form states - Wizard
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [memberType, setMemberType] = useState<"EXISTING" | "NEW">("EXISTING");

  // Step 1: Book Loan states
  const [selectedBookId, setSelectedBookId] = useState("");
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split("T")[0]);

  // Step 2: Member states
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberClassId, setNewMemberClassId] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  
  // Calculate default due date
  const getDefaultDueDate = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + config.maxLoanDays);
    return d.toISOString().split("T")[0];
  };

  const [dueDate, setDueDate] = useState(getDefaultDueDate(new Date().toISOString().split("T")[0]));
  const [errorMsg, setErrorMsg] = useState("");

  // QR/Barcode Scan states
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanSuccessInfo, setScanSuccessInfo] = useState("");

  const handleScanSuccess = (decodedText: string) => {
    const cleanId = decodedText.trim();
    if (!cleanId) return;

    // Search for existing member
    const matched = members.find(m => m.id.toLowerCase() === cleanId.toLowerCase());
    if (matched) {
      setMemberType("EXISTING");
      setSelectedMemberId(matched.id);
      setScanSuccessInfo(`Anggota terdeteksi: ${matched.name} (NIS: ${matched.id})`);
    } else {
      setMemberType("NEW");
      setNewMemberId(cleanId);
      setScanSuccessInfo(`NIS "${cleanId}" terdeteksi! (Silakan lengkapi biodata pendaftaran baru di bawah)`);
    }
    // Clear message after 8 seconds
    setTimeout(() => {
      setScanSuccessInfo("");
    }, 8000);
  };

  useEffect(() => {
    let html5Qrcode: any = null;
    if (isScanningQR) {
      setScannerError("");
      const timer = setTimeout(() => {
        const element = document.getElementById("qr-reader");
        if (!element) return;
        
        try {
          html5Qrcode = new Html5Qrcode("qr-reader");
          html5Qrcode.start(
            { facingMode: "environment" },
            {
              fps: 15,
              qrbox: (width: number, height: number) => {
                const size = Math.min(width, height) * 0.75;
                return { width: size, height: size };
              }
            },
            (decodedText: string) => {
              handleScanSuccess(decodedText);
              if (html5Qrcode && html5Qrcode.isScanning) {
                html5Qrcode.stop().catch(console.error);
              }
              setIsScanningQR(false);
            },
            () => {
              // Ignore standard reading errors
            }
          ).catch((err: any) => {
            console.error("Camera access promise failure:", err);
            setScannerError("Gagal mengakses kamera. Silakan periksa kembali izin kamera pada browser Anda.");
          });
        } catch (e: any) {
          console.error("Scanner setup exception:", e);
          setScannerError("Inisialisasi perangkat kamera gagal.");
        }
      }, 400);

      return () => {
        clearTimeout(timer);
        if (html5Qrcode) {
          try {
            if (html5Qrcode.isScanning) {
              html5Qrcode.stop().catch(console.error);
            }
          } catch (err) {
            console.error("Cleanup error:", err);
          }
        }
      };
    }
  }, [isScanningQR]);

  const handleLoanDateChange = (newDate: string) => {
    setLoanDate(newDate);
    setDueDate(getDefaultDueDate(newDate));
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setCurrentStep(1);
    setMemberType("EXISTING");
    setSelectedBookId("");
    setSelectedMemberId("");
    setNewMemberId("");
    setNewMemberName("");
    setNewMemberClassId("");
    setNewMemberPhone("");
    setNewMemberEmail("");
    setErrorMsg("");
    setIsScanningQR(false);
    setScanSuccessInfo("");
    if (onCloseAddModalInitially) {
      onCloseAddModalInitially();
    }
  };

  const handleNextStep = () => {
    setErrorMsg("");
    if (!selectedBookId) {
      return setErrorMsg("Silakan pilih buku terlebih dahulu!");
    }
    const chosenBook = books.find(b => b.id === selectedBookId);
    if (chosenBook && chosenBook.availableQty <= 0) {
      return setErrorMsg("Maaf, stok buku ini sedang habis dipinjam!");
    }
    if (!loanDate) {
      return setErrorMsg("Tanggal pinjam wajib diisi!");
    }
    if (!dueDate) {
      return setErrorMsg("Tanggal jatuh tempo wajib diisi!");
    }
    if (new Date(dueDate) <= new Date(loanDate)) {
      return setErrorMsg("Tanggal jatuh tempo harus setelah tanggal pinjam!");
    }
    setCurrentStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedBookId) return setErrorMsg("Silakan pilih buku!");
    if (!loanDate) return setErrorMsg("Tanggal pinjam wajib diisi!");
    if (!dueDate) return setErrorMsg("Tanggal jatuh tempo wajib diisi!");
    
    if (new Date(dueDate) <= new Date(loanDate)) {
      return setErrorMsg("Tanggal jatuh tempo harus setelah tanggal pinjam!");
    }

    // Check availability
    const chosenBook = books.find(b => b.id === selectedBookId);
    if (chosenBook && chosenBook.availableQty <= 0) {
      return setErrorMsg("Maaf, stok buku ini sedang habis dipinjam!");
    }

    let finalMemberId = selectedMemberId;

    if (memberType === "NEW") {
      if (!newMemberId.trim()) return setErrorMsg("ID Anggota / NIS wajib diisi untuk biodata peminjam!");
      if (!newMemberName.trim()) return setErrorMsg("Nama lengkap peminjam wajib diisi!");
      if (!newMemberClassId) return setErrorMsg("Silakan pilih kelas peminjam!");
      if (!newMemberPhone.trim()) return setErrorMsg("Nomor HP / WhatsApp wajib diisi!");

      // Check duplicate ID
      const exists = members.some(m => m.id.toLowerCase() === newMemberId.trim().toLowerCase());
      if (exists) {
        return setErrorMsg(`ID Anggota / NIS "${newMemberId}" sudah terdaftar! Masukkan ID lain atau gunakan opsi 'Cari Anggota Terdaftar'.`);
      }

      finalMemberId = newMemberId.trim();

      // Register new member on the fly
      if (onAddMember) {
        onAddMember({
          id: finalMemberId,
          name: newMemberName.trim(),
          classId: newMemberClassId,
          phone: newMemberPhone.trim(),
          email: newMemberEmail.trim(),
          registerDate: new Date().toISOString().split("T")[0]
        });
      }
    } else {
      if (!selectedMemberId) return setErrorMsg("Silakan pilih siswa / peminjam terdaftar!");
    }

    onAddLoan({
      memberId: finalMemberId,
      bookId: selectedBookId,
      loanDate,
      dueDate,
      returnDate: null
    });

    // Reset and close
    handleCloseModal();
  };

  // Filter loans
  const filteredLoans = loans.filter((loan) => {
    const member = members.find(m => m.id === loan.memberId);
    const book = books.find(b => b.id === loan.bookId);
    const memberName = member ? member.name.toLowerCase() : "";
    const bookTitle = book ? book.title.toLowerCase() : "";
    const loanId = loan.id.toLowerCase();
    
    const matchesSearch = 
      memberName.includes(search.toLowerCase()) ||
      bookTitle.includes(search.toLowerCase()) ||
      loanId.includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === "ALL" || 
      loan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatRupiah = (num: number) => {
    if (num === 0) return "—";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>PEMINJAMAN</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-ping"></span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
            {identity.libraryName} • {identity.schoolName}
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={() => setSearch("")}
            className="flex items-center space-x-2 bg-slate-900 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-800 shadow-sm hover:bg-slate-800 hover:text-emerald-400 transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-950/50 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Peminjaman</span>
          </button>
        </div>
      </div>

      {/* Main card panel */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800/80 shadow-sm overflow-hidden p-6 space-y-6">
        {/* Search and filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, buku, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-500 font-medium text-slate-200"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">Semua Status</option>
              <option value="DIPINJAM" className="bg-slate-900 text-slate-200">DIPINJAM</option>
              <option value="TERLAMBAT" className="bg-slate-900 text-slate-200">TERLAMBAT</option>
              <option value="SELESAI" className="bg-slate-900 text-slate-200">SELESAI</option>
            </select>
          </div>
        </div>

        {/* Loan Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                <th className="py-4 px-6 w-[80px]">ID</th>
                <th className="py-4 px-6">Siswa</th>
                <th className="py-4 px-6">Buku</th>
                <th className="py-4 px-6">Tgl Pinjam</th>
                <th className="py-4 px-6">Jatuh Tempo</th>
                <th className="py-4 px-6">Tgl Kembali</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-red-400">Denda</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-sm font-medium">
                    Tidak ada transaksi peminjaman ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const student = members.find(m => m.id === loan.memberId);
                  const bookItem = books.find(b => b.id === loan.bookId);

                  return (
                    <tr key={loan.id} className="hover:bg-slate-950/40 transition-all duration-150">
                      <td className="py-4 px-6 font-mono font-bold text-slate-500 text-xs">
                        {loan.id}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-200 text-[13px]">
                          {student ? student.name : "Member Dihapus"}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                          NIS: {loan.memberId}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-300 text-[13px] line-clamp-1">
                          {bookItem ? bookItem.title : "Buku Dihapus"}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-medium text-xs">
                        {formatToDDMMYYYY(loan.loanDate)}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-semibold text-xs">
                        {formatToDDMMYYYY(loan.dueDate)}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-medium text-xs">
                        {loan.returnDate ? formatToDDMMYYYY(loan.returnDate) : <span className="text-slate-600 font-bold">—</span>}
                      </td>
                      <td className="py-4 px-6">
                        {loan.status === "SELESAI" ? (
                          <span className="inline-flex items-center space-x-1 bg-emerald-950/60 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-900/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Selesai</span>
                          </span>
                        ) : loan.status === "TERLAMBAT" ? (
                          <span className="inline-flex items-center space-x-1 bg-rose-950/60 text-rose-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-900/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>Terlambat</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-blue-950/60 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-900/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>Dipinjam</span>
                          </span>
                        )}
                      </td>
                      <td className={`py-4 px-6 font-bold text-xs ${loan.fineAmount > 0 ? "text-rose-400 font-extrabold" : "text-slate-500"}`}>
                        {formatRupiah(loan.fineAmount)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-1.5">
                          {loan.returnDate === null && (
                            <>
                              <button
                                onClick={() => onReturnLoan(loan.id)}
                                className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 transition-all border border-emerald-900/30 cursor-pointer"
                                title="Kembalikan Buku"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onSendWa(loan)}
                                className="inline-flex items-center justify-center p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 transition-all border border-emerald-900/30 cursor-pointer"
                                title="Kirim WA Pemberitahuan"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              const studentName = student ? student.name : "Member Dihapus";
                              const bookName = bookItem ? bookItem.title : "Buku Dihapus";
                              setDeleteConfirmId(loan.id);
                              setDeleteConfirmTitle(`Peminjaman oleh ${studentName} (Buku: ${bookName})`);
                            }}
                            className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 transition-all border border-slate-800/80 cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Tambah Peminjaman Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-950/40 rounded-xl border border-emerald-900/30 text-emerald-400">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100 text-[15px] tracking-tight">
                    Mulai Transaksi Baru
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">
                    {currentStep === 1 
                      ? "Langkah 1 dari 2: Detail Peminjaman Buku" 
                      : "Langkah 2 dari 2: Biodata / Identitas Peminjam"
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all cursor-pointer border border-transparent hover:border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Wizard Progress Bar */}
            <div className="bg-slate-950/25 h-1.5 w-full flex">
              <div className={`h-full transition-all duration-300 ${currentStep === 1 ? "w-1/2 bg-emerald-600" : "w-full bg-emerald-500"}`}></div>
            </div>

            {/* Error Message banner */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-950/50 text-rose-400 text-xs font-bold rounded-2xl border border-rose-900/40 flex items-start space-x-2.5">
                <span className="text-sm">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Detail Peminjaman Buku */}
            {currentStep === 1 ? (
              <div className="p-6 space-y-5">
                {/* Book Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Pilih Buku Yang Ingin Dipinjam <span className="text-emerald-500">*</span>
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-slate-500 absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-bold cursor-pointer appearance-none"
                    >
                      <option value="" className="bg-slate-900 text-slate-500">-- Cari & Pilih Buku --</option>
                      {books.map((b) => (
                        <option 
                          key={b.id} 
                          value={b.id}
                          disabled={b.availableQty <= 0}
                          className="bg-slate-900 text-slate-200 disabled:text-slate-600"
                        >
                          {b.title} [Stok Tersedia: {b.availableQty} dari {b.qty}] {b.availableQty <= 0 ? "(HABIS)" : ""}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <span className="text-[11px]">▼</span>
                    </div>
                  </div>
                </div>

                {/* Dates Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Tanggal Pinjam <span className="text-emerald-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-500 absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        value={loanDate}
                        onChange={(e) => handleLoanDateChange(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Tanggal Jatuh Tempo <span className="text-emerald-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-500 absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-900/30 flex items-start space-x-3">
                  <span className="text-lg leading-none">ℹ️</span>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Informasi Batas Pinjam</p>
                    <p className="text-[11px] text-slate-400 leading-normal font-medium">
                      Berdasarkan konfigurasi sistem, maksimal durasi peminjaman adalah <strong>{config.maxLoanDays} hari</strong>. Keterlambatan pengembalian buku akan dikenakan denda akumulasi sebesar <strong>{formatRupiah(config.finePerDay)} per hari</strong>.
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-2.5 bg-slate-950 border border-slate-800/80 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/25 cursor-pointer hover:-translate-y-0.5"
                  >
                    <span>Lanjut ke Biodata Peminjam</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: Identitas / Biodata Peminjam */
              <div className="p-6 space-y-5">
                {scanSuccessInfo && (
                  <div className="p-3 bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 text-xs font-bold rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">✅</span>
                      <span>{scanSuccessInfo}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScanSuccessInfo("")}
                      className="text-emerald-400 hover:text-emerald-200 font-extrabold px-1 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {isScanningQR ? (
                  /* CAMERA SCANNING INTERFACE */
                  <div className="space-y-4 py-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-4 h-4 text-amber-500 animate-pulse" />
                        <h4 className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                          Scanner Kartu Anggota (QR / Barcode)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsScanningQR(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-slate-700"
                      >
                        Batal Scan
                      </button>
                    </div>

                    {scannerError ? (
                      <div className="p-4 bg-rose-950/50 border border-rose-900/40 rounded-2xl text-rose-400 text-xs font-medium space-y-3 animate-in fade-in">
                        <p>{scannerError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setScannerError("");
                            setIsScanningQR(false);
                            setTimeout(() => setIsScanningQR(true), 150);
                          }}
                          className="bg-rose-800 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Scanner Frame Window */}
                        <div 
                          id="qr-reader" 
                          className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center text-slate-500 text-xs font-semibold"
                        >
                          Mengaktifkan kamera...
                        </div>
                        
                        {/* Target reticle overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-32 h-32 md:w-44 md:h-44 border-2 border-emerald-500 rounded-2xl relative">
                            {/* Scanning laser line animation */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]"></div>
                            {/* Corners indicator */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-[10px] text-slate-400 text-center leading-relaxed">
                      Arahkan kamera perangkat Anda ke <strong>QR Code atau Barcode</strong> di Kartu Anggota Perpustakaan siswa. Sistem akan otomatis mengisi biodata atau memilih siswa jika sudah terdaftar.
                    </div>
                  </div>
                ) : (
                  /* REGULAR STEP 2 FORM WITH QR LAUNCHER BUTTON */
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* QR Code / Barcode Scanning Block Launcher */}
                    <div className="bg-slate-950/45 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-amber-950/40 rounded-xl border border-amber-900/30 text-amber-400">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">Scan Kartu Anggota</p>
                          <p className="text-[10px] text-slate-400 font-medium">Scan QR / Barcode pada kartu untuk pengisian cepat</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsScanningQR(true)}
                        className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/20 hover:-translate-y-0.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Mulai Scan</span>
                      </button>
                    </div>

                    {/* Toggle tab memberType */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        Metode Identitas Peminjam
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800/85">
                        <button
                          type="button"
                          onClick={() => {
                            setMemberType("EXISTING");
                            setErrorMsg("");
                          }}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            memberType === "EXISTING"
                              ? "bg-slate-800 text-emerald-400 shadow-sm"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          👤 Anggota Terdaftar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMemberType("NEW");
                            setErrorMsg("");
                          }}
                          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                            memberType === "NEW"
                              ? "bg-slate-800 text-emerald-400 shadow-sm"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Input Biodata Baru</span>
                        </button>
                      </div>
                    </div>

                    {memberType === "EXISTING" ? (
                      /* EXISTING MEMBER SELECT */
                      <div className="space-y-1.5 py-2 animate-in fade-in duration-200">
                        <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                          Cari & Pilih Siswa Terdaftar <span className="text-emerald-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-500 absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select
                            value={selectedMemberId}
                            onChange={(e) => setSelectedMemberId(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-bold cursor-pointer appearance-none"
                          >
                            <option value="" className="bg-slate-900 text-slate-500">-- Pilih Anggota Perpustakaan --</option>
                            {members.map((m) => {
                              const mClass = classes.find(c => c.id === m.classId);
                              const className = mClass ? mClass.name : "N/A";
                              return (
                                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                                  {m.name} (NIS: {m.id} • Kelas {className})
                                </option>
                              );
                            })}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <span className="text-[11px]">▼</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Jika nama siswa tidak ditemukan, klik tombol <strong>Input Biodata Baru</strong> untuk mendaftarkannya secara langsung.
                        </p>
                      </div>
                    ) : (
                      /* REGISTER NEW MEMBER ON THE FLY FORM */
                      <div className="space-y-3 py-1 animate-in fade-in duration-200">
                        <p className="text-[11px] font-bold text-amber-400 bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-xl">
                          Siswa akan terdaftar secara otomatis ke dalam data Anggota Perpustakaan saat transaksi disimpan.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* ID Anggota / NIS */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              NIS / ID Anggota <span className="text-emerald-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: 2109827"
                              value={newMemberId}
                              onChange={(e) => setNewMemberId(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-200 font-bold"
                            />
                          </div>

                          {/* Kelas */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              Kelas <span className="text-emerald-500">*</span>
                            </label>
                            <select
                              value={newMemberClassId}
                              onChange={(e) => setNewMemberClassId(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-200 font-bold cursor-pointer"
                            >
                              <option value="" className="text-slate-500 bg-slate-900">-- Pilih Kelas --</option>
                              {classes.map((c) => (
                                <option key={c.id} value={c.id} className="text-slate-200 bg-slate-900">
                                  Kelas {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Nama Lengkap */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            Nama Lengkap Siswa <span className="text-emerald-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Muhammad Rafli"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-200 font-bold animate-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* No HP / WA */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              No. HP / WhatsApp <span className="text-emerald-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: 081234567890"
                              value={newMemberPhone}
                              onChange={(e) => setNewMemberPhone(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-200 font-bold"
                            />
                          </div>

                          {/* Email */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              Email (Opsional)
                            </label>
                            <input
                              type="email"
                              placeholder="nama@email.com"
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-200 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="pt-4 flex items-center justify-between border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(1);
                          setErrorMsg("");
                        }}
                        className="inline-flex items-center space-x-1.5 px-4.5 py-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Detail Buku</span>
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/25 cursor-pointer hover:-translate-y-0.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Simpan & Mulai Transaksi</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 p-6 space-y-6">
            <div className="flex items-center space-x-3 text-rose-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-extrabold text-slate-100">Konfirmasi Hapus Transaksi</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus data transaksi <strong className="text-slate-200">"{deleteConfirmTitle}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmTitle("");
                }}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLoan(deleteConfirmId);
                  setDeleteConfirmId(null);
                  setDeleteConfirmTitle("");
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-950/25 cursor-pointer"
              >
                Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Plus, 
  FileSpreadsheet, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Upload,
  BookMarked,
  Printer,
  FileText,
  Download
} from "lucide-react";
import { Book } from "../types";
// @ts-ignore
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

interface BookViewProps {
  books: Book[];
  onAddBook: (newBook: Omit<Book, "id" | "availableQty"> | Omit<Book, "id" | "availableQty">[]) => void;
  onEditBook: (updatedBook: Book) => void;
  onDeleteBook: (bookId: string) => void;
  identity: { libraryName: string; schoolName: string };
}

export default function BookView({
  books,
  onAddBook,
  onEditBook,
  onDeleteBook,
  identity
}: BookViewProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");

  // Upload Massal modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState<string>("");

  // Form fields
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [category, setCategory] = useState<Book["category"]>("Pelajaran");
  const [qty, setQty] = useState(1);
  const [coverImage, setCoverImage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Label Punggung Buku (Spine Label) State
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedBookForLabel, setSelectedBookForLabel] = useState<Book | null>(null);
  const [labelLibraryName, setLabelLibraryName] = useState("");
  const [labelSchoolName, setLabelSchoolName] = useState("");
  const [labelClassification, setLabelClassification] = useState("");
  const [labelAuthorCode, setLabelAuthorCode] = useState("");
  const [labelTitleCode, setLabelTitleCode] = useState("");
  const [labelYearVol, setLabelYearVol] = useState("");
  const [labelCopyNo, setLabelCopyNo] = useState("c.1");
  const [labelBarcodeValue, setLabelBarcodeValue] = useState("");
  const [labelBgColor, setLabelBgColor] = useState("#1e90ff");
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const labelBarcodeRef = useRef<SVGSVGElement>(null);

  // Open label modal and populate defaults
  const openLabelModal = (book: Book) => {
    setSelectedBookForLabel(book);
    setLabelLibraryName(identity.libraryName || "PERPUSTAKAAN");
    setLabelSchoolName(identity.schoolName || "SEKOLAH");
    
    // Set default DDC based on category
    let defaultDdc = "000";
    let defaultBgColor = "#1e90ff";
    if (book.category === "Pelajaran") {
      defaultDdc = "370";
      defaultBgColor = "#1e90ff";
    } else if (book.category === "Fiksi") {
      defaultDdc = "813";
      defaultBgColor = "#00ced1";
    } else if (book.category === "Referensi") {
      defaultDdc = "001";
      defaultBgColor = "#32cd32";
    } else if (book.category === "Lainnya") {
      defaultDdc = "900";
      defaultBgColor = "#ff4500";
    }
    setLabelClassification(defaultDdc);
    setLabelBgColor(defaultBgColor);

    // Get Author code: first 3 letters of first author word, or first word, formatted as Capitalized (e.g., Dwi)
    let cleanAuthor = (book.author || "").trim().replace(/[^a-zA-Z\s]/g, "");
    let authCode = "";
    if (cleanAuthor.length > 0) {
      authCode = cleanAuthor.charAt(0).toUpperCase() + cleanAuthor.substring(1, 3).toLowerCase();
    }
    setLabelAuthorCode(authCode);

    // Get Title code: first letter of title (lowercase)
    let cleanTitle = (book.title || "").trim().replace(/[^a-zA-Z\s]/g, "").toLowerCase();
    let titleChar = cleanTitle.substring(0, 1);
    setLabelTitleCode(titleChar);

    setLabelYearVol(book.year ? book.year.toString() : "");
    setLabelCopyNo("c.1");
    setLabelBarcodeValue(book.id);
    setIsLabelModalOpen(true);
  };

  // Barcode renderer effect
  useEffect(() => {
    if (isLabelModalOpen && selectedBookForLabel && labelBarcodeRef.current) {
      try {
        const barcodeText = labelBarcodeValue || selectedBookForLabel.id;

        JsBarcode(labelBarcodeRef.current, barcodeText, {
          format: "CODE128",
          width: 1.1,
          height: 18,
          displayValue: false,
          background: "transparent",
          lineColor: "#000000",
          margin: 0
        });
      } catch (err) {
        console.error("Gagal menggambar barcode:", err);
      }
    }
  }, [
    isLabelModalOpen, 
    selectedBookForLabel, 
    labelBarcodeValue, 
    labelBarcodeRef.current
  ]);

  // QR Code generator effect
  useEffect(() => {
    if (isLabelModalOpen && selectedBookForLabel) {
      // Create a rich, beautifully structured multi-line text for high-density smartphone/camera scans
      const qrText = [
        `=== DETAIL LABEL BUKU ===`,
        `Perpustakaan: ${labelLibraryName}`,
        `Sekolah: ${labelSchoolName}`,
        `Judul Buku: ${selectedBookForLabel.title}`,
        `Penulis: ${selectedBookForLabel.author}`,
        `Nomor Panggil (Call Number):`,
        `  - Klasifikasi (DDC): ${labelClassification}`,
        `  - Kode Pengarang: ${labelAuthorCode}`,
        `  - Kode Judul: ${labelTitleCode}`,
        `  - Tahun/Volume: ${labelYearVol || "-"}`,
        `  - No. Eksemplar: ${labelCopyNo || "-"}`,
        `ID Buku: ${labelBarcodeValue || selectedBookForLabel.id}`
      ].join("\n");

      QRCode.toDataURL(qrText, {
        width: 120,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error("Gagal menggambar QR Code:", err);
      });
    }
  }, [
    isLabelModalOpen, 
    selectedBookForLabel, 
    labelBarcodeValue,
    labelLibraryName,
    labelSchoolName,
    labelClassification,
    labelAuthorCode,
    labelTitleCode,
    labelYearVol,
    labelCopyNo
  ]);

  const handleDownloadPDF = async () => {
    if (!selectedBookForLabel) return;
    setIsPdfDownloading(true);
    const element = document.getElementById("printable-spine-label");
    if (!element) {
      setIsPdfDownloading(false);
      return;
    }

    try {
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1.0,
        scale: 4, // high scale for crisp print quality
        style: {
          contentVisibility: "visible",
          boxShadow: "none"
        }
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [75, 40]
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 75, 40);
      pdf.save(`Label_Punggung_${selectedBookForLabel.id}_${selectedBookForLabel.title.substring(0, 15).replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Gagal mengunduh PDF label:", error);
      alert("Gagal mengunduh PDF label punggung buku. Silakan coba lagi.");
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setModalMode("ADD");
    setSelectedId("");
    setTitle("");
    setAuthor("");
    setYear(2025);
    setCategory("Pelajaran");
    setQty(1);
    setCoverImage("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (b: Book) => {
    setModalMode("EDIT");
    setSelectedId(b.id);
    setTitle(b.title);
    setAuthor(b.author);
    setYear(b.year);
    setCategory(b.category);
    setQty(b.qty);
    setCoverImage(b.coverImage || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setErrorMsg("Judul buku wajib diisi!");
    if (!author.trim()) return setErrorMsg("Nama penulis wajib diisi!");
    if (!year || year < 1800) return setErrorMsg("Tahun terbit tidak valid!");
    if (!qty || qty < 1) return setErrorMsg("Jumlah stok minimal 1!");

    // Use a beautiful Unsplash placeholder if none specified
    let finalCover = coverImage.trim();
    if (!finalCover) {
      if (category === "Pelajaran") {
        finalCover = "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=60";
      } else if (category === "Fiksi") {
        finalCover = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=60";
      } else {
        finalCover = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60";
      }
    }

    if (modalMode === "ADD") {
      onAddBook({ title, author, year: Number(year), category, qty: Number(qty), coverImage: finalCover });
    } else {
      // Keep availableQty in sync relative to current loan counts
      const oldBook = books.find(b => b.id === selectedId);
      const activeLoansCount = oldBook ? (oldBook.qty - oldBook.availableQty) : 0;
      const newAvailableQty = Math.max(0, Number(qty) - activeLoansCount);

      onEditBook({
        id: selectedId,
        title,
        author,
        year: Number(year),
        category,
        qty: Number(qty),
        availableQty: newAvailableQty,
        coverImage: finalCover
      });
    }

    setIsModalOpen(false);
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const executeUploadMock = () => {
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error("Berkas kosong atau tidak dapat dibaca");
        }

        // Split by line
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) {
          throw new Error("Format CSV tidak valid atau tidak memiliki baris data");
        }

        // Parse header
        const header = lines[0].toLowerCase().split(/[;,]/).map(h => h.trim().replace(/^["']|["']$/g, ""));
        
        // Find column indices (highly flexible mapping for Indonesian, English, and Google Sheets format headers)
        const titleIdx = header.findIndex(h => 
          h === "judul" || h === "title" || h === "judul buku" || h === "booktitle" || 
          h.includes("judul")
        );
        const authorIdx = header.findIndex(h => 
          h === "penulis" || h === "author" || h === "pengarang" || h === "writer" || 
          h.includes("penulis") || h.includes("pengarang")
        );
        const yearIdx = header.findIndex(h => 
          h === "tahun" || h === "year" || h === "tahun terbit" || h === "publishyear" || 
          h.includes("tahun") || h.includes("terbit")
        );
        const categoryIdx = header.findIndex(h => 
          h === "kategori" || h === "category" || h === "kategori buku" || h === "genre" || 
          h.includes("kategori")
        );
        const qtyIdx = header.findIndex(h => 
          h === "stok" || h === "qty" || h === "jumlah" || h === "jumlah buku" || h === "stok buku" || 
          h.includes("stok") || h.includes("jumlah") || h.includes("qty")
        );
        const coverIdx = header.findIndex(h => 
          h === "cover" || h === "coverimage" || h === "gambar" || h === "foto cover" || h === "image" || 
          h.includes("cover") || h.includes("gambar") || h.includes("foto")
        );

        if (titleIdx === -1 || authorIdx === -1) {
          throw new Error("Kolom wajib 'judul' dan 'penulis' tidak ditemukan di baris header pertama CSV");
        }

        const importedBooks: Omit<Book, "id" | "availableQty">[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const matches = line.match(/(".*?"|[^",;]+)(?=\s*[,;]|\s*$)/g) || line.split(/[;,]/);
          const cols = matches.map(c => c.trim().replace(/^["']|["']$/g, ""));

          if (cols.length < 2) continue;

          const title = cols[titleIdx] || "";
          const author = cols[authorIdx] || "";
          if (!title || !author) continue;

          const year = yearIdx !== -1 ? Number(cols[yearIdx]) || 2026 : 2026;
          
          let category: Book["category"] = "Pelajaran";
          if (categoryIdx !== -1 && cols[categoryIdx]) {
            const rawCat = cols[categoryIdx].toLowerCase();
            if (rawCat.includes("fiksi") || rawCat.includes("novel") || rawCat.includes("fiction")) {
              category = "Fiksi";
            } else if (rawCat.includes("umum") || rawCat.includes("lain") || rawCat.includes("other")) {
              category = "Lainnya";
            }
          }

          const qty = qtyIdx !== -1 ? Number(cols[qtyIdx]) || 1 : 1;
          
          let coverImage = coverIdx !== -1 ? cols[coverIdx] || "" : "";
          if (!coverImage) {
            if (category === "Pelajaran") {
              coverImage = "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=60";
            } else if (category === "Fiksi") {
              coverImage = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=60";
            } else {
              coverImage = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60";
            }
          }

          importedBooks.push({
            title,
            author,
            year,
            category,
            qty,
            coverImage
          });
        }

        if (importedBooks.length === 0) {
          throw new Error("Tidak ada baris data valid yang berhasil dibaca.");
        }

        onAddBook(importedBooks);
        setIsUploadOpen(false);
        setUploadedFile(null);
        alert(`Berhasil mengimpor ${importedBooks.length} buku baru dari berkas CSV!`);
      } catch (err: any) {
        console.error(err);
        alert("Gagal membaca berkas CSV: " + (err.message || "Pastikan format berkas benar."));
      }
    };
    
    reader.onerror = () => {
      alert("Gagal membaca berkas.");
    };

    reader.readAsText(uploadedFile);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>BUKU</span>
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
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold border border-emerald-900/40 shadow-sm transition-all duration-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Massal</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-950/50 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Buku</span>
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800/80 shadow-sm overflow-hidden p-6 space-y-6">
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari buku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-500 font-medium text-slate-200"
          />
        </div>

        {/* Books Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-medium text-sm">
              Tidak ada buku ditemukan. Silakan tambahkan buku baru atau sesuaikan kata kunci pencarian.
            </div>
          ) : (
            filteredBooks.map((book) => (
              <div 
                key={book.id} 
                className="group bg-slate-950 border border-slate-850 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-slate-800 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Book Cover image area */}
                <div className="aspect-[4/3] w-full bg-slate-900 relative overflow-hidden">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category Badge */}
                  <span className={`absolute top-3 left-3 text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-sm ${
                    book.category === "Pelajaran" 
                      ? "bg-blue-600 text-white"
                      : book.category === "Fiksi"
                      ? "bg-cyan-500 text-white"
                      : book.category === "Referensi"
                      ? "bg-emerald-800 text-white"
                      : "bg-slate-700 text-white"
                  }`}>
                    {book.category}
                  </span>

                  {/* Quantity Badges */}
                  <div className="absolute bottom-3 right-3 flex space-x-1.5">
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Tersedia: {book.availableQty} / {book.qty}
                    </span>
                  </div>
                </div>

                {/* Content description */}
                <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                      {book.author} • {book.year}
                    </div>
                    <h3 className="font-extrabold text-slate-200 text-[14px] leading-snug tracking-tight line-clamp-2">
                      {book.title}
                    </h3>
                  </div>

                  {/* Edit / Label / Delete Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-900 gap-1.5">
                    <button
                      onClick={() => openEditModal(book)}
                      className="inline-flex items-center space-x-1 text-amber-400 hover:text-amber-300 text-[11px] font-bold bg-amber-950/40 hover:bg-amber-900/30 px-2.5 py-1.5 rounded-xl transition-all border border-amber-900/30 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => openLabelModal(book)}
                      className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold bg-emerald-950/40 hover:bg-emerald-900/30 px-2.5 py-1.5 rounded-xl transition-all border border-emerald-900/30 cursor-pointer"
                      title="Cetak Label Punggung Buku"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Label</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmId(book.id);
                        setDeleteConfirmTitle(book.title);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-rose-950/30 transition-all cursor-pointer"
                      title="Hapus Buku"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Massal Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-850 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-[15px]">
                  Upload Massal Buku (Excel / CSV)
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadedFile(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-xs text-slate-400 leading-relaxed">
                Unggah berkas data buku Anda dalam format CSV atau Excel (.xlsx) untuk menambahkan koleksi buku secara massal sekaligus. Kolom yang didukung: <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-400 font-mono text-[10px] font-bold">judul, penulis, tahun, kategori, jumlah</code>.
              </p>

              {/* Drag and Drop Container */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive 
                    ? "border-emerald-500 bg-emerald-950/20" 
                    : uploadedFile 
                    ? "border-emerald-500 bg-emerald-950/20" 
                    : "border-slate-800 hover:border-emerald-500 hover:bg-slate-955/20"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                  uploadedFile ? "bg-emerald-950/55 text-emerald-400" : "bg-slate-800 text-slate-400"
                }`}>
                  <Upload className="w-6 h-6" />
                </div>

                {uploadedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-200">{uploadedFile.name}</p>
                    <p className="text-xs text-slate-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • Siap untuk diimpor
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-300">Tarik dan taruh berkas di sini</p>
                    <p className="text-xs text-slate-500">atau klik untuk menelusuri komputer Anda</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setUploadedFile(null);
                  }}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!uploadedFile}
                  onClick={executeUploadMock}
                  className={`inline-flex items-center space-x-1 font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md ${
                    uploadedFile
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20 cursor-pointer"
                      : "bg-slate-950 text-slate-600 cursor-not-allowed shadow-none border border-slate-850"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Impor Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-850 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <BookMarked className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-[15px]">
                  {modalMode === "ADD" ? "Tambah Buku Baru" : "Edit Detail Buku"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-950/50 text-rose-400 text-xs font-bold rounded-xl border border-rose-900/30 flex items-center space-x-1.5">
                  <span>⚠️</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Judul Buku
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SEJARAH INDONESIA KELAS XI"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Author */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Penulis
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: SUTJIPTO"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                  />
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tahun Terbit
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Book["category"])}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                  >
                    <option value="Pelajaran">Pelajaran</option>
                    <option value="Fiksi">Fiksi</option>
                    <option value="Referensi">Referensi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                  />
                </div>
              </div>

              {/* Cover Image Link */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Link Gambar Sampul (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="Masukkan link gambar https://..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/25 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Buku</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 p-6 space-y-6">
            <div className="flex items-center space-x-3 text-rose-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-extrabold text-slate-100">Konfirmasi Hapus Buku</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus buku <strong className="text-slate-200">"{deleteConfirmTitle}"</strong>? Tindakan ini tidak dapat dibatalkan.
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
                  onDeleteBook(deleteConfirmId);
                  setDeleteConfirmId(null);
                  setDeleteConfirmTitle("");
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-950/25 cursor-pointer"
              >
                Hapus Buku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spine Label (Label Punggung Buku) Modal */}
      {isLabelModalOpen && selectedBookForLabel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-850 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-[15px]">
                  Cetak Label Punggung Buku (4 cm x 7.5 cm)
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsLabelModalOpen(false);
                  setSelectedBookForLabel(null);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Form Controls - 7 cols */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                    📖 Informasi Buku Asal
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Judul: <strong className="text-slate-300">{selectedBookForLabel.title}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Penulis: <strong className="text-slate-300">{selectedBookForLabel.author}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Library Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nama Perpustakaan
                    </label>
                    <input
                      type="text"
                      value={labelLibraryName}
                      onChange={(e) => setLabelLibraryName(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 font-semibold"
                    />
                  </div>

                  {/* School Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nama Sekolah
                    </label>
                    <input
                      type="text"
                      value={labelSchoolName}
                      onChange={(e) => setLabelSchoolName(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Classification */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      No. Klasifikasi (DDC)
                    </label>
                    <input
                      type="text"
                      value={labelClassification}
                      onChange={(e) => setLabelClassification(e.target.value)}
                      placeholder="e.g. 370"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 font-extrabold"
                    />
                  </div>

                  {/* Author Code */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Kode Pengarang
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={labelAuthorCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > 0) {
                          setLabelAuthorCode(val.charAt(0).toUpperCase() + val.slice(1).toLowerCase());
                        } else {
                          setLabelAuthorCode("");
                        }
                      }}
                      placeholder="Contoh: Dwi"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 font-extrabold"
                    />
                  </div>

                  {/* Title Code */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Kode Judul
                    </label>
                    <input
                      type="text"
                      maxLength={1}
                      value={labelTitleCode}
                      onChange={(e) => setLabelTitleCode(e.target.value.toLowerCase())}
                      placeholder="1 Huruf Kecil"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 font-extrabold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Year / Vol */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tahun / Volume
                    </label>
                    <input
                      type="text"
                      value={labelYearVol}
                      onChange={(e) => setLabelYearVol(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 font-semibold"
                    />
                  </div>

                  {/* Copy Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      No. Eksemplar (Copy)
                    </label>
                    <input
                      type="text"
                      value={labelCopyNo}
                      onChange={(e) => setLabelCopyNo(e.target.value)}
                      placeholder="e.g. c.1"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 font-semibold"
                    />
                  </div>
                </div>

                {/* Barcode Value */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Isi Barcode (ID Buku)
                  </label>
                  <input
                    type="text"
                    value={labelBarcodeValue}
                    onChange={(e) => setLabelBarcodeValue(e.target.value)}
                    placeholder="Masukkan ID Buku untuk barcode"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 font-semibold"
                  />
                  <p className="text-[10px] text-slate-500">
                    Arahkan scanner ke barcode yang dihasilkan untuk membaca ID Buku ini secara otomatis pada form transaksi peminjaman.
                  </p>
                </div>

                {/* DDC Background Color Selector */}
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Warna Background Klasifikasi (DDC)
                  </label>
                  <div className="space-y-3">
                    {/* Preset Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      {[
                        { code: "000", name: "Karya Umum", hex: "#ffffff" },
                        { code: "100", name: "Filsafat", hex: "#64748b" },
                        { code: "200", name: "Agama", hex: "#10b981" },
                        { code: "300", name: "Ilmu Sosial", hex: "#3b82f6" },
                        { code: "400", name: "Bahasa", hex: "#ffd700" },
                        { code: "500", name: "Sains & Mat", hex: "#14b8a6" },
                        { code: "600", name: "Teknologi", hex: "#854d0e" },
                        { code: "700", name: "Kesenian", hex: "#a855f7" },
                        { code: "800", name: "Sastra", hex: "#ec4899" },
                        { code: "900", name: "Sejarah", hex: "#ef4444" },
                        { code: "R", name: "Referensi", hex: "#ca8a04" }
                      ].map((preset) => {
                        const isSelected = labelBgColor.toLowerCase() === preset.hex.toLowerCase();
                        return (
                          <button
                            key={preset.code}
                            type="button"
                            onClick={() => {
                              setLabelBgColor(preset.hex);
                              setLabelClassification(preset.code);
                            }}
                            className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-left border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-slate-950 border-emerald-500 ring-1 ring-emerald-500/30"
                                : "bg-slate-950/40 border-slate-850 hover:bg-slate-900/60 hover:border-slate-700"
                            }`}
                          >
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-700/50" 
                              style={{ backgroundColor: preset.hex }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] font-black block text-slate-100 leading-none">
                                {preset.code}
                              </span>
                              <span className="text-[7.5px] text-slate-400 font-semibold block truncate leading-tight mt-0.5">
                                {preset.name}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Color Picker */}
                    <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 self-start">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kustom:</span>
                      <input
                        type="color"
                        value={labelBgColor.startsWith("#") ? labelBgColor : "#1e90ff"}
                        onChange={(e) => setLabelBgColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                        title="Pilih warna kustom"
                      />
                      <input
                        type="text"
                        value={labelBgColor}
                        onChange={(e) => setLabelBgColor(e.target.value)}
                        placeholder="#ffffff"
                        className="w-20 px-2 py-1 bg-slate-950 border border-slate-850 rounded text-[10px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-300 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview - 5 cols */}
              <div className="md:col-span-5 flex flex-col items-center space-y-4 bg-slate-950/40 p-4.5 rounded-2xl border border-slate-800/60">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  📐 Live Preview (Skala 1:1)
                </h4>

                {/* The 7.5cm x 4cm label container */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center w-full overflow-auto">
                  <div
                    id="printable-spine-label"
                    className="w-[283px] h-[151px] bg-white text-black border-2 border-solid border-black flex flex-row overflow-hidden relative select-none font-sans shrink-0"
                    style={{
                      width: "283px",
                      height: "151px",
                      minWidth: "283px",
                      minHeight: "151px",
                      maxWidth: "283px",
                      maxHeight: "151px",
                      backgroundColor: "#ffffff",
                      color: "#000000",
                      boxSizing: "border-box"
                    }}
                  >
                    {/* Column 1: Barcode & Vertical texts (Exactly 54px width, 147px inner height) */}
                    <div 
                      className="h-full relative border-r border-black shrink-0 bg-white overflow-hidden"
                      style={{
                        width: "54px",
                        minWidth: "54px",
                        maxWidth: "54px",
                        boxSizing: "border-box"
                      }}
                    >
                      {/* Left vertical text: Book Title */}
                      <div 
                        className="absolute text-center text-[7px] text-gray-500 font-bold truncate uppercase"
                        style={{
                          width: "135px",
                          height: "10px",
                          left: "9px",
                          top: "73.5px",
                          transform: "translate(-50%, -50%) rotate(-90deg)",
                          transformOrigin: "center center"
                        }}
                      >
                        {selectedBookForLabel.title}
                      </div>

                      {/* Center rotated barcode (height adjusted to 18px for scanning and clarity, perfectly centered) */}
                      <div 
                        className="absolute flex items-center justify-center"
                        style={{
                          width: "130px",
                          height: "18px",
                          left: "27px",
                          top: "73.5px",
                          transform: "translate(-50%, -50%) rotate(-90deg)",
                          transformOrigin: "center center"
                        }}
                      >
                        <svg ref={labelBarcodeRef} className="w-full h-full block" />
                      </div>

                      {/* Right vertical text: Book ID (Beautiful, proportional, perfectly aligned on the right side of the barcode, no truncation) */}
                      <div 
                        className="absolute text-center text-[8px] font-bold text-black uppercase tracking-wider truncate"
                        style={{
                          width: "135px",
                          height: "10px",
                          left: "45px",
                          top: "73.5px",
                          transform: "translate(-50%, -50%) rotate(-90deg)",
                          transformOrigin: "center center"
                        }}
                      >
                        {labelBarcodeValue || selectedBookForLabel.id}
                      </div>
                    </div>

                    {/* Column 2: Library Header (Top colored, Exactly 73px) & Call Number (Bottom white, Exactly 74px) (Exactly 115px width) */}
                    <div 
                      className="h-full flex flex-col border-r border-black shrink-0 bg-white"
                      style={{
                        width: "115px",
                        minWidth: "115px",
                        maxWidth: "115px",
                        boxSizing: "border-box"
                      }}
                    >
                      {/* Top Box: Category Color */}
                      <div 
                        className="h-[73px] w-full p-1.5 flex flex-col justify-center items-center text-center border-b border-black shrink-0 overflow-hidden"
                        style={{
                          backgroundColor: labelBgColor,
                          boxSizing: "border-box"
                        }}
                      >
                        <p className="text-[8px] font-black leading-tight text-black uppercase w-full break-words px-0.5 text-center">
                          {labelLibraryName}
                        </p>
                        <p className="text-[7px] font-bold leading-tight text-black/90 uppercase w-full break-words px-0.5 mt-1 text-center">
                          {labelSchoolName}
                        </p>
                      </div>

                      {/* Bottom Box: White with Call Number & Watermark */}
                      <div className="h-[74px] w-full relative flex flex-col items-center justify-center bg-white shrink-0 overflow-hidden">
                        {/* Elegant faint watermark background */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.06] pointer-events-none select-none">
                          <BookMarked className="w-9 h-9 text-black" />
                          <span className="text-[6px] font-black tracking-wider mt-0.5 text-black uppercase whitespace-nowrap">
                            {labelLibraryName.substring(0, 15)}
                          </span>
                        </div>

                        {/* Bold Call Number content */}
                        <div className="relative z-10 text-center flex flex-col items-center justify-center leading-none">
                          <p className="text-[13px] font-black text-black tracking-wide leading-none">
                            {labelClassification || "000"}
                          </p>
                          <p className="text-[11px] font-black text-black tracking-widest mt-1 leading-none">
                            {labelAuthorCode || "Xxx"}
                          </p>
                          <p className="text-[11px] font-black text-black tracking-wide lowercase mt-0.5 leading-none">
                            {labelTitleCode || "x"}
                          </p>
                          <div className="text-[7px] font-bold text-gray-700 mt-1.5 leading-none">
                            {labelYearVol && <span>{labelYearVol}</span>}
                            {labelYearVol && labelCopyNo && <span className="mx-0.5">•</span>}
                            {labelCopyNo && <span>{labelCopyNo}</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Book Title & QR Code (Exactly 110px width) */}
                    <div 
                      className="h-full flex flex-col justify-between bg-white py-1 px-1 shrink-0 overflow-hidden"
                      style={{
                        width: "110px",
                        minWidth: "110px",
                        maxWidth: "110px",
                        boxSizing: "border-box"
                      }}
                    >
                      {/* Top: Horizontal Title - Dynamic text size to prevent truncation/cutoff and fit nicely without dots */}
                      <p 
                        className="font-extrabold text-black text-center uppercase tracking-normal w-full pt-0.5 px-0.5 leading-tight break-words shrink-0 text-wrap"
                        style={{
                          fontSize: selectedBookForLabel.title.length > 50 ? "6px" : selectedBookForLabel.title.length > 25 ? "7px" : "8px"
                        }}
                      >
                        {selectedBookForLabel.title}
                      </p>

                      {/* Center: Dynamic QR Code */}
                      <div className="flex-1 flex items-center justify-center p-0">
                        {qrCodeUrl ? (
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code" 
                            className="w-[72px] h-[72px] object-contain block select-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-[72px] h-[72px] bg-gray-100 animate-pulse rounded-md" />
                        )}
                      </div>

                      {/* Bottom: Book Author (Exactly centered, capitalized each word, fits nicely) */}
                      <p className="text-[7.5px] font-bold text-gray-800 text-center tracking-wide truncate w-full pb-0.5 px-0.5 shrink-0">
                        {selectedBookForLabel.author
                          ? selectedBookForLabel.author
                              .toLowerCase()
                              .split(" ")
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-semibold text-center leading-normal max-w-[200px]">
                  Garis putus-putus abu-abu adalah batas ukuran label <span className="text-slate-300">7.5 x 4 cm</span> yang akan dicetak/disimpan.
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4.5 bg-slate-950/60 border-t border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-[11px] text-slate-400 font-medium">
                Pilih <strong className="text-emerald-400">Cetak Label</strong> untuk mencetak langsung dengan printer, atau <strong className="text-amber-400">Simpan PDF</strong> untuk mengunduh berkas PDF siap cetak.
              </div>
              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsLabelModalOpen(false);
                    setSelectedBookForLabel(null);
                  }}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-850 text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={isPdfDownloading}
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/25 cursor-pointer hover:-translate-y-0.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isPdfDownloading ? "Menyimpan..." : "Simpan PDF"}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintLabel}
                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/25 cursor-pointer hover:-translate-y-0.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Label</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Print Styles for Spine Label */}
      {isLabelModalOpen && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-spine-label, #printable-spine-label * {
              visibility: visible !important;
            }
            #printable-spine-label {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 75mm !important;
              height: 40mm !important;
              border: 2px solid #000000 !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              z-index: 9999999 !important;
            }
            @page {
              size: 75mm 40mm;
              margin: 0 !important;
            }
          }
        `}} />
      )}
    </div>
  );
}

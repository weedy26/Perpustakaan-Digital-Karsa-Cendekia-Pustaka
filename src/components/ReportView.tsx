import React, { useState, useMemo, useRef } from "react";
import { 
  FileText, 
  Download, 
  Book, 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  Calendar,
  Loader2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { Book as BookType, Member, Loan } from "../types";
import { jsPDF } from "jspdf";
// @ts-ignore
import domtoimage from "dom-to-image-more";

interface ReportViewProps {
  books: BookType[];
  members: Member[];
  loans: Loan[];
  identity: { libraryName: string; schoolName: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomChartTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl text-xs font-sans">
        <p className="font-extrabold tracking-tight text-slate-200">{label}</p>
        <div className="flex items-center space-x-1.5 mt-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 block"></span>
          <p className="text-slate-300 font-medium">
            Peminjaman: <span className="font-extrabold text-white">{payload[0].value} Buku</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function ReportView({
  books,
  members,
  loans,
  identity
}: ReportViewProps) {
  const [activePeriod, setActivePeriod] = useState<"week" | "month" | "year">("week");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // CSV Generation Helper
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBooks = () => {
    const headers = ["ID Buku", "Judul", "Penulis", "Tahun", "Kategori", "Total Qty", "Stok Tersedia"];
    const rows = books.map(b => [
      b.id,
      b.title,
      b.author,
      String(b.year),
      b.category,
      String(b.qty),
      String(b.availableQty)
    ]);
    downloadCSV("laporan_data_buku.csv", headers, rows);
  };

  const handleDownloadMembers = () => {
    const headers = ["NIS / No Anggota", "Nama Lengkap", "ID Kelas", "No WA", "Email", "Tanggal Daftar"];
    const rows = members.map(m => [
      m.id,
      m.name,
      m.classId,
      m.phone,
      m.email || "-",
      m.registerDate
    ]);
    downloadCSV("laporan_data_anggota.csv", headers, rows);
  };

  const handleDownloadActiveLoans = () => {
    const headers = ["ID Pinjam", "NIS Siswa", "Nama Siswa", "Judul Buku", "Tanggal Pinjam", "Jatuh Tempo", "Status", "Denda"];
    const active = loans.filter(l => l.returnDate === null);
    const rows = active.map(l => {
      const stud = members.find(m => m.id === l.memberId);
      const bk = books.find(b => b.id === l.bookId);
      return [
        l.id,
        l.memberId,
        stud ? stud.name : "Dihapus",
        bk ? bk.title : "Dihapus",
        l.loanDate,
        l.dueDate,
        l.status,
        `Rp ${l.fineAmount}`
      ];
    });
    downloadCSV("laporan_peminjaman_aktif.csv", headers, rows);
  };

  const handleDownloadOverdueLoans = () => {
    const headers = ["ID Pinjam", "NIS Siswa", "Nama Siswa", "Judul Buku", "Tanggal Pinjam", "Jatuh Tempo", "Denda"];
    const overdue = loans.filter(l => l.returnDate === null && l.status === "TERLAMBAT");
    const rows = overdue.map(l => {
      const stud = members.find(m => m.id === l.memberId);
      const bk = books.find(b => b.id === l.bookId);
      return [
        l.id,
        l.memberId,
        stud ? stud.name : "Dihapus",
        bk ? bk.title : "Dihapus",
        l.loanDate,
        l.dueDate,
        `Rp ${l.fineAmount}`
      ];
    });
    downloadCSV("laporan_peminjaman_terlambat.csv", headers, rows);
  };

  // 1 Minggu (7 Hari Terakhir)
  const weekData = useMemo(() => {
    const data = [];
    const indonesianMonthsShort = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
      "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
    ];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dateVal}`;
      const label = `${d.getDate()} ${indonesianMonthsShort[d.getMonth()]}`;
      const count = loans.filter(l => {
        if (!l.loanDate) return false;
        return l.loanDate.split("T")[0] === dateString;
      }).length;
      data.push({ name: label, "Peminjaman": count });
    }
    return data;
  }, [loans]);

  // 1 Bulan (30 Hari Terakhir)
  const monthData = useMemo(() => {
    const data = [];
    const indonesianMonthsShort = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
      "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
    ];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dateVal}`;
      const label = `${d.getDate()} ${indonesianMonthsShort[d.getMonth()]}`;
      const count = loans.filter(l => {
        if (!l.loanDate) return false;
        return l.loanDate.split("T")[0] === dateString;
      }).length;
      data.push({ name: label, "Peminjaman": count });
    }
    return data;
  }, [loans]);

  // 1 Tahun (12 Bulan Terakhir)
  const yearData = useMemo(() => {
    const data = [];
    const indonesianMonthsShort = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
      "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
    ];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = `${indonesianMonthsShort[month]} ${year}`;
      const count = loans.filter(l => {
        if (!l.loanDate) return false;
        const lDate = new Date(l.loanDate.split("T")[0]);
        return lDate.getFullYear() === year && lDate.getMonth() === month;
      }).length;
      data.push({ name: label, "Peminjaman": count });
    }
    return data;
  }, [loans]);

  const activeData = useMemo(() => {
    if (activePeriod === "week") return weekData;
    if (activePeriod === "month") return monthData;
    return yearData;
  }, [activePeriod, weekData, monthData, yearData]);

  const stats = useMemo(() => {
    let total = 0;
    let maxVal = -1;
    let maxLabel = "-";
    activeData.forEach(item => {
      total += item.Peminjaman;
      if (item.Peminjaman > maxVal) {
        maxVal = item.Peminjaman;
        maxLabel = item.name;
      }
    });
    const avg = total / activeData.length;
    return {
      total,
      avg: avg.toFixed(1),
      peak: maxVal > 0 ? `${maxLabel} (${maxVal} buku)` : "-"
    };
  }, [activeData]);

  const handleDownloadPDF = async () => {
    const element = chartRef.current;
    if (!element) return;
    
    setIsGeneratingPdf(true);
    try {
      // Use dom-to-image-more to render element to high quality PNG data URL
      const imgData = await domtoimage.toPng(element, {
        bgcolor: "#0b0f19",
        style: {
          transform: "scale(1)",
          transformOrigin: "top left"
        }
      });
      
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      
      // Load image to get original aspect ratio
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const imgHeight = (img.height * imgWidth) / img.width;
      
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`laporan_grafik_peminjaman_${activePeriod}.pdf`);
    } catch (error) {
      console.error("Gagal mengunduh PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>LAPORAN</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-ping"></span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
            {identity.libraryName} • {identity.schoolName}
          </p>
        </div>
      </div>

      {/* Title Panel */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm space-y-1.5">
        <h2 className="text-lg font-extrabold text-white">Laporan Perpustakaan</h2>
        <p className="text-xs text-slate-400">
          Unduh data instansi perpustakaan Anda secara dinamis ke dalam format berkas CSV yang kompatibel dengan Microsoft Excel atau spreadsheet lainnya.
        </p>
      </div>

      {/* Grid of Report download widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Book report */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md hover:border-slate-700 transition-all duration-150">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 flex items-center justify-center text-emerald-400 border border-emerald-900/30">
              <Book className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-[14px]">Laporan Data Buku</h3>
              <p className="text-xs text-slate-500">Unduh semua data koleksi buku lengkap.</p>
            </div>
          </div>
          <button
            onClick={handleDownloadBooks}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-950/25 hover:shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV Excel</span>
          </button>
        </div>

        {/* Members report */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md hover:border-slate-700 transition-all duration-150">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 flex items-center justify-center text-emerald-400 border border-emerald-900/30">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-[14px]">Laporan Data Anggota</h3>
              <p className="text-xs text-slate-500">Unduh semua data daftar anggota terdaftar.</p>
            </div>
          </div>
          <button
            onClick={handleDownloadMembers}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-950/25 hover:shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV Excel</span>
          </button>
        </div>

        {/* Active loans report */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md hover:border-slate-700 transition-all duration-150">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 flex items-center justify-center text-emerald-400 border border-emerald-900/30">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-[14px]">Peminjaman Aktif</h3>
              <p className="text-xs text-slate-500">Unduh data buku yang sedang dipinjam saat ini.</p>
            </div>
          </div>
          <button
            onClick={handleDownloadActiveLoans}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-950/25 hover:shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV Excel</span>
          </button>
        </div>

        {/* Overdue report */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md hover:border-slate-700 transition-all duration-150">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 flex items-center justify-center text-rose-400 border border-rose-900/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-[14px]">Buku Terlambat</h3>
              <p className="text-xs text-slate-500">Unduh data buku yang terlambat dikembalikan.</p>
            </div>
          </div>
          <button
            onClick={handleDownloadOverdueLoans}
            className="w-full flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-rose-950/25 hover:shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV Excel</span>
          </button>
        </div>
      </div>

      {/* Graphical Trend Report & PDF Download Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Grafik Laporan Peminjaman Buku</span>
            </h3>
            <p className="text-xs text-slate-400">
              Analisis grafik visual data sirkulasi buku pada periode tertentu.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Filter Period Pills */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              {[
                { id: "week", label: "1 Minggu" },
                { id: "month", label: "1 Bulan" },
                { id: "year", label: "1 Tahun" }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePeriod(p.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activePeriod === p.id
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-950/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Cetak PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Printable/Screenshot Container */}
        <div 
          ref={chartRef} 
          className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-md space-y-6"
        >
          {/* Header identity specifically for PDF export or presentation */}
          <div className="border-b border-slate-800 pb-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <span className="bg-emerald-950/80 px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase text-emerald-400 border border-emerald-900/30">
                  LAPORAN GRAFIK SIRKULASI
                </span>
                <h3 className="text-base font-black text-white mt-2 leading-none uppercase">
                  {identity.libraryName}
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">
                  {identity.schoolName}
                </p>
              </div>
              <div className="text-left sm:text-right font-mono text-[10px] text-slate-400 leading-normal space-y-0.5 shrink-0">
                <p className="font-bold"><span className="text-slate-500">Tanggal Cetak:</span> {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="font-bold">
                  <span className="text-slate-500">Periode Laporan:</span>{" "}
                  <span className="text-emerald-400 uppercase font-extrabold">
                    {activePeriod === "week" ? "1 Minggu Terakhir" : activePeriod === "month" ? "1 Bulan Terakhir" : "1 Tahun Terakhir"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Core Stats Overview widget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Transaksi</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {stats.total} <span className="text-xs text-slate-500 font-medium">Buku</span>
              </span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Rata-rata sirkulasi</span>
              <span className="text-2xl font-black text-blue-400 mt-1 block">
                {stats.avg} <span className="text-xs text-slate-500 font-medium">{activePeriod === "year" ? "Buku / Bulan" : "Buku / Hari"}</span>
              </span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Puncak Aktivitas</span>
              <span className="text-xs font-extrabold text-amber-400 mt-2 block truncate">
                {stats.peak}
              </span>
            </div>
          </div>

          {/* Interactive Responsive Recharts Canvas */}
          <div className="h-80 w-full pr-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorLoanReport" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                  interval={activePeriod === "month" ? 4 : 0}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area 
                  type="monotone"
                  dataKey="Peminjaman" 
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorLoanReport)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Simple Grid/Table summarizing the active data inside the card - great for print outs! */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Rincian Data Tabel Laporan</span>
              </span>
              <span className="text-[9px] font-semibold text-slate-500">Menampilkan seluruh data sirkulasi sela-aktif</span>
            </div>
            
            <div className="max-h-48 overflow-y-auto mt-2 space-y-1.5 pr-1 text-[11px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="grid grid-cols-2 gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 bg-slate-950/20 rounded-md">
                <span>{activePeriod === "year" ? "Bulan & Tahun" : "Hari & Tanggal"}</span>
                <span className="text-right">Jumlah Peminjaman</span>
              </div>
              {activeData.map((row, idx) => (
                <div 
                  key={idx} 
                  className={`grid grid-cols-2 gap-4 px-2 py-1.5 rounded-lg border border-transparent transition-all ${
                    row.Peminjaman > 0 
                      ? "bg-emerald-950/15 border-emerald-900/10 text-slate-200" 
                      : "text-slate-400 hover:bg-slate-950/10"
                  }`}
                >
                  <span className="font-semibold">{row.name}</span>
                  <span className={`text-right font-bold ${row.Peminjaman > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                    {row.Peminjaman} Buku
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

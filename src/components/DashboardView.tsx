import React, { useState, useMemo } from "react";
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  AlertTriangle, 
  RotateCw, 
  Plus, 
  MessageSquare, 
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { Book, Member, Loan, LibraryIdentity, SystemConfig } from "../types";
import { formatToDDMMYYYY } from "../utils/dateFormatter";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl text-xs font-sans">
        <p className="font-extrabold tracking-tight text-slate-200">{label}</p>
        <div className="flex items-center space-x-1.5 mt-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 block"></span>
          <p className="text-slate-300 font-medium">
            Peminjaman: <span className="font-extrabold text-white">{payload[0].value} buku</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardViewProps {
  books: Book[];
  members: Member[];
  loans: Loan[];
  identity: LibraryIdentity;
  config: SystemConfig;
  onReturnLoan: (loanId: string) => void;
  onOpenAddLoan: () => void;
  onSendWa: (loan: Loan) => void;
  onRefresh: () => void;
  googleUser?: any;
  isSyncing?: boolean;
  onPushToSheets?: () => void;
  onPullFromSheets?: () => void;
}

export default function DashboardView({
  books,
  members,
  loans,
  identity,
  config,
  onReturnLoan,
  onOpenAddLoan,
  onSendWa,
  onRefresh,
  googleUser,
  isSyncing = false,
  onPushToSheets,
  onPullFromSheets
}: DashboardViewProps) {
  const [filter, setFilter] = useState<"SEMUA" | "DIPINJAM" | "TERLAMBAT">("SEMUA");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active loans (not returned yet)
  const activeLoans = loans.filter(l => l.returnDate === null);
  
  const dipinjamCount = activeLoans.filter(l => l.status === "DIPINJAM").length;
  const terlambatCount = activeLoans.filter(l => l.status === "TERLAMBAT").length;

  // Calculate stats
  const totalAnggota = members.length;
  const totalBukuJenis = books.length;
  const totalStokBuku = books.reduce((acc, b) => acc + b.qty, 0);
  const totalPinjamAktif = activeLoans.length;
  
  // Total fines calculated
  const totalDendaAmount = activeLoans.reduce((acc, l) => acc + l.fineAmount, 0);

  // Generate last 7 days of loan trend
  const last7DaysTrend = useMemo(() => {
    const trendData = [];
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
      
      // Filter loans by loanDate
      const count = loans.filter(l => {
        if (!l.loanDate) return false;
        return l.loanDate.split("T")[0] === dateString;
      }).length;
      
      trendData.push({
        name: label,
        "Jumlah Peminjaman": count,
        date: dateString
      });
    }
    return trendData;
  }, [loans]);

  // Filtered active loans list
  const filteredActiveLoans = activeLoans.filter(l => {
    if (filter === "SEMUA") return true;
    return l.status === filter;
  });

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const formatRupiah = (num: number) => {
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
            <span>DASHBOARD</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-ping"></span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
            {identity.libraryName} • {identity.schoolName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          {googleUser ? (
            <>
              <button
                onClick={onPushToSheets}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
                title="Simpan data lokal saat ini ke Google Sheets"
              >
                <span>💾</span>
                <span>{isSyncing ? "Menyimpan..." : "Simpan ke Sheet"}</span>
              </button>
              <button
                onClick={onPullFromSheets}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 bg-slate-900 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-extrabold border border-emerald-900/40 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                title="Tarik data terbaru dari Google Sheets"
              >
                <span>🔄</span>
                <span>{isSyncing ? "Menarik..." : "Tarik dari Sheet"}</span>
              </button>
            </>
          ) : null}
          <button
            onClick={handleRefreshClick}
            className="flex items-center space-x-2 bg-slate-900 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-800 shadow-sm hover:bg-slate-800 hover:text-emerald-400 transition-all duration-200 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onOpenAddLoan}
            className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-950/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Peminjaman</span>
          </button>
        </div>
      </div>

      {/* Primary Bento Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Featured Bento Banner (Span 8) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-emerald-900/10 flex flex-col justify-between min-h-[250px]">
          {/* Subtle decorative vector circles */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase w-fit block text-amber-300 border border-amber-400/25">
              SISTEM PERPUSTAKAAN MODERN
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Sirkulasi Cerdas & Manajemen Literasi Sekolah
            </h2>
            <p className="text-emerald-100/90 text-xs leading-relaxed font-medium">
              Kelola katalog buku, klasifikasi kelas, pendaftaran anggota, pencetakan kartu, serta hitung denda keterlambatan secara otomatis.
            </p>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <button 
              onClick={onOpenAddLoan}
              className="bg-white text-emerald-800 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-950/20 hover:bg-slate-50 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              Mulai Transaksi Baru
            </button>
            {googleUser ? (
              <>
                <button 
                  onClick={onPushToSheets}
                  disabled={isSyncing}
                  className="bg-amber-500 hover:bg-amber-600 border border-amber-400 text-emerald-950 px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Simpan data lokal saat ini ke Google Sheets"
                >
                  <span>💾</span>
                  <span>Simpan ke Sheets</span>
                </button>
                <button 
                  onClick={onPullFromSheets}
                  disabled={isSyncing}
                  className="bg-emerald-700/40 hover:bg-emerald-700/60 border border-emerald-600/30 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="Tarik data terbaru dari Google Sheets"
                >
                  <span>🔄</span>
                  <span>Tarik dari Sheets</span>
                </button>
              </>
            ) : (
              <button 
                onClick={handleRefreshClick}
                className="bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/20 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Sinkronisasi Lokal
              </button>
            )}
          </div>
        </div>

        {/* Categories Bento Grid (Span 4) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-6 border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Klasifikasi Koleksi
            </h3>
            <p className="text-[13px] font-bold text-slate-200 leading-tight mb-4">
              Distribusi Buku berdasarkan Kategori Utama
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-amber-950/20 p-3.5 rounded-2xl flex flex-col justify-between border border-amber-900/30">
              <span className="text-lg">📈</span>
              <div className="mt-2">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase block tracking-wider">Pelajaran</span>
                <span className="text-xs font-bold text-slate-200">
                  {books.filter(b => b.category === "Pelajaran").length} Judul
                </span>
              </div>
            </div>
            
            <div className="bg-emerald-950/20 p-3.5 rounded-2xl flex flex-col justify-between border border-emerald-900/30">
              <span className="text-lg">⚖</span>
              <div className="mt-2">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase block tracking-wider">Fiksi</span>
                <span className="text-xs font-bold text-slate-200">
                  {books.filter(b => b.category === "Fiksi").length} Judul
                </span>
              </div>
            </div>

            <div className="bg-blue-950/20 p-3.5 rounded-2xl flex flex-col justify-between border border-blue-900/30">
              <span className="text-lg">🖥</span>
              <div className="mt-2">
                <span className="text-[10px] font-extrabold text-blue-400 uppercase block tracking-wider">Referensi</span>
                <span className="text-xs font-bold text-slate-200">
                  {books.filter(b => b.category === "Referensi").length} Judul
                </span>
              </div>
            </div>

            <div className="bg-purple-950/20 p-3.5 rounded-2xl flex flex-col justify-between border border-purple-900/30">
              <span className="text-lg">🎨</span>
              <div className="mt-2">
                <span className="text-[10px] font-extrabold text-purple-400 uppercase block tracking-wider">Lainnya</span>
                <span className="text-xs font-bold text-slate-200">
                  {books.filter(b => b.category === "Lainnya").length} Judul
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Anggota */}
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800/80 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-750 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Total Anggota
            </span>
            <span className="text-3xl font-black text-white block">
              {totalAnggota}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Siswa Terdaftar
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center border border-emerald-900/30">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Total Buku */}
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800/80 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-750 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Total Buku
            </span>
            <span className="text-3xl font-black text-white block">
              {totalBukuJenis}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Stok Fisik: <strong className="text-emerald-400 font-bold">{totalStokBuku}</strong>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center border border-emerald-900/30">
            <BookOpen className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Dipinjam */}
        <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800/80 shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-750 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Buku Dipinjam
            </span>
            <span className="text-3xl font-black text-white block">
              {totalPinjamAktif}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Sedang Dipinjam
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-950/40 text-blue-400 flex items-center justify-center border border-blue-900/30">
            <ClipboardList className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Terlambat */}
        <div className="bg-[#0f141d] p-5 rounded-3xl border border-slate-800 shadow-md flex items-center justify-between text-white relative overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Keterlambatan
            </span>
            <span className="text-3xl font-black text-rose-400 block">
              {terlambatCount}
            </span>
            <span className="text-[11px] font-bold text-emerald-400 block">
              Denda: {formatRupiah(totalDendaAmount)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-rose-400 relative z-10 shadow-inner border border-slate-700/50">
            <AlertTriangle className="w-5.5 h-5.5" />
          </div>
          {/* Glowing dot overlay */}
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>

      {/* Trends & Data Visualization Section */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
              <span>Tren Aktivitas Sirkulasi</span>
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Peminjaman Buku 7 Hari Terakhir
            </h3>
          </div>
          <div className="mt-2 md:mt-0 text-[11px] font-semibold text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            Aktualisasi Data Real-Time
          </div>
        </div>

        <div className="h-72 w-full pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7DaysTrend}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.2 }} />
              <Bar 
                dataKey="Jumlah Peminjaman" 
                fill="url(#colorTrend)" 
                radius={[8, 8, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters Navigation Badges */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={() => setFilter("SEMUA")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filter === "SEMUA"
              ? "bg-emerald-800 text-white shadow-sm"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          SEMUA ({totalPinjamAktif})
        </button>
        <button
          onClick={() => setFilter("DIPINJAM")}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            filter === "DIPINJAM"
              ? "bg-emerald-800 text-white shadow-sm"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${filter === "DIPINJAM" ? "bg-white" : "bg-emerald-500"}`}></span>
          <span>{dipinjamCount} DIPINJAM</span>
        </button>
        <button
          onClick={() => setFilter("TERLAMBAT")}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
            filter === "TERLAMBAT"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${filter === "TERLAMBAT" ? "bg-white" : "bg-rose-500"}`}></span>
          <span>{terlambatCount} TERLAMBAT</span>
        </button>
      </div>

      {/* Main List Section */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800/80 shadow-sm overflow-hidden">
        {/* Block Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
          <div className="flex items-center space-x-2.5">
            <ClipboardList className="w-5 h-5 text-slate-400" />
            <h2 className="text-[14px] font-bold text-slate-200">
              Peminjaman Aktif & Perlu Perhatian
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Menampilkan {filteredActiveLoans.length} entri
          </span>
        </div>

        {/* List Table */}
        <div className="overflow-x-auto">
          {filteredActiveLoans.length === 0 ? (
            <div className="p-10 text-center text-slate-400 bg-slate-900">
              <CheckCircle2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-medium">Tidak ada peminjaman aktif saat ini.</p>
              <p className="text-xs text-slate-500 mt-1">Semua buku telah dikembalikan dengan aman.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/20">
                  <th className="py-4 px-6">Siswa</th>
                  <th className="py-4 px-6">Buku</th>
                  <th className="py-4 px-6">Tgl Pinjam</th>
                  <th className="py-4 px-6">Jatuh Tempo</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900">
                {filteredActiveLoans.map((loan) => {
                  const member = members.find(m => m.id === loan.memberId);
                  const book = books.find(b => b.id === loan.bookId);

                  return (
                    <tr key={loan.id} className="hover:bg-slate-800/40 transition-all duration-150">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-200 text-[13px]">
                          {member ? member.name : "Unknown Member"}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                          NIS: {loan.memberId}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-300 text-[13px] tracking-tight">
                          {book ? book.title : "Unknown Book"}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          {book ? `${book.author} • ${book.year}` : ""}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                        {formatToDDMMYYYY(loan.loanDate)}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                        {formatToDDMMYYYY(loan.dueDate)}
                      </td>
                      <td className="py-4 px-6">
                        {loan.status === "TERLAMBAT" ? (
                          <span className="inline-flex items-center space-x-1 bg-rose-950/40 text-rose-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-900/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>Terlambat</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-blue-950/40 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-900/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>Dipinjam</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => onReturnLoan(loan.id)}
                            className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm shadow-emerald-950/20 cursor-pointer"
                          >
                            <span>📥</span>
                            <span>Kembalikan</span>
                          </button>
                          <button
                            onClick={() => onSendWa(loan)}
                            className="inline-flex items-center space-x-1 bg-[#25d366] hover:bg-[#128c7e] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm shadow-green-950/20 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WA</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Clock, Search, Printer, Calendar, BookOpen, AlertCircle } from "lucide-react";
import { Loan, Member, Book, LibraryIdentity } from "../types";
import { formatToDDMMYYYY } from "../utils/dateFormatter";

interface HistoryViewProps {
  loans: Loan[];
  members: Member[];
  books: Book[];
  identity: LibraryIdentity;
}

export default function HistoryView({
  loans,
  members,
  books,
  identity
}: HistoryViewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState("ALL");

  const filteredLoans = loans.filter((l) => {
    if (selectedMemberId === "ALL") return true;
    return l.memberId === selectedMemberId;
  });

  const handlePrintHistory = () => {
    window.print();
  };

  const formatRupiah = (num: number) => {
    if (num === 0) return "Rp 0";
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-800 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>RIWAYAT</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-ping"></span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
            {identity.libraryName} • {identity.schoolName}
          </p>
        </div>
      </div>

      {/* Intro Box with Print Button */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 print:hidden">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
            <span>Riwayat Peminjaman</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Lihat daftar riwayat transaksi peminjaman buku perpustakaan per anggota secara lengkap.
          </p>
        </div>
        <button
          onClick={handlePrintHistory}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md shadow-blue-950/25 hover:shadow-lg transition-all duration-200 whitespace-nowrap cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Riwayat</span>
        </button>
      </div>

      {/* Selector Container */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm space-y-4 print:hidden">
        <div className="space-y-1.5 max-w-md">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pilih Anggota
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-200 cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-slate-200">Semua Anggota</option>
            {members.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                {m.name} - {m.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800/80 shadow-sm overflow-hidden p-6 print:p-0 print:border-none">
        
        {/* Print-Only Header */}
        <div className="hidden print:block text-center space-y-2 mb-6 border-b-2 border-slate-800 pb-4">
          <h2 className="text-xl font-extrabold uppercase tracking-widest">{identity.libraryName} PUSTAKA</h2>
          <p className="text-xs uppercase font-semibold">{identity.schoolName}</p>
          <p className="text-[10px] text-slate-500">{identity.address}</p>
          <p className="text-xs font-bold mt-4 border-t border-slate-200 pt-2">
            LAPORAN RIWAYAT TRANSAKSI PEMINJAMAN {selectedMemberId !== "ALL" ? ` - ${members.find(m => m.id === selectedMemberId)?.name}` : ""}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50 print:bg-transparent">
                {selectedMemberId === "ALL" && <th className="py-4 px-6 w-1/4">Siswa</th>}
                <th className="py-4 px-6 w-1/3">Buku</th>
                <th className="py-4 px-6">Tgl Pinjam</th>
                <th className="py-4 px-6">Tgl Kembali</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-red-400">Denda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm font-medium">
                    Tidak ada riwayat peminjaman untuk anggota ini.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const student = members.find(m => m.id === loan.memberId);
                  const book = books.find(b => b.id === loan.bookId);

                  return (
                    <tr key={loan.id} className="hover:bg-slate-950/40 transition-all duration-150">
                      {selectedMemberId === "ALL" && (
                        <td className="py-4.5 px-6">
                          <div className="font-extrabold text-slate-200 text-[13px]">
                            {student ? student.name : "Member Dihapus"}
                          </div>
                          <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                            NIS: {loan.memberId}
                          </div>
                        </td>
                      )}
                      <td className="py-4.5 px-6">
                        <div className="font-extrabold text-slate-300 text-[13px]">
                          {book ? book.title : "Buku Dihapus"}
                        </div>
                        {book && (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            {book.author}
                          </div>
                        )}
                      </td>
                      <td className="py-4.5 px-6 font-mono text-[11.5px] text-slate-400">
                        {formatToDDMMYYYY(loan.loanDate)}
                      </td>
                      <td className="py-4.5 px-6 font-mono text-[11.5px] text-slate-400">
                        {loan.returnDate ? formatToDDMMYYYY(loan.returnDate) : <span className="text-slate-600 font-bold">—</span>}
                      </td>
                      <td className="py-4.5 px-6 text-xs">
                        <span className={`font-bold ${
                          loan.status === "SELESAI" 
                            ? "text-emerald-400" 
                            : loan.status === "TERLAMBAT" 
                            ? "text-rose-400" 
                            : "text-blue-400"
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className={`py-4.5 px-6 font-bold text-xs ${loan.fineAmount > 0 ? "text-red-400 font-extrabold" : "text-slate-500"}`}>
                        {formatRupiah(loan.fineAmount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

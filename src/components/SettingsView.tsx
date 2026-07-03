import React, { useState, useEffect } from "react";
import { 
  Building2, 
  MessageSquare, 
  Cpu, 
  User, 
  Save, 
  Upload, 
  Play, 
  Database,
  BellRing,
  CheckCircle,
  Clock,
  PhoneCall
} from "lucide-react";
import { LibraryIdentity, WaTemplate, SystemConfig } from "../types";
import LibraryLogo from "./LibraryLogo";

interface SettingsViewProps {
  identity: LibraryIdentity;
  onUpdateIdentity: (identity: LibraryIdentity) => void;
  templates: WaTemplate[];
  onUpdateTemplate: (type: "PINJAM" | "TERLAMBAT", text: string) => void;
  config: SystemConfig;
  onUpdateConfig: (config: SystemConfig) => void;
  onResetDatabase: () => void;
  onRunDelayCheck: () => void;
  onUpdatePassword: (oldPass: string, newPass: string) => boolean;
}

export default function SettingsView({
  identity,
  onUpdateIdentity,
  templates,
  onUpdateTemplate,
  config,
  onUpdateConfig,
  onResetDatabase,
  onRunDelayCheck,
  onUpdatePassword
}: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"IDENTITAS" | "WA" | "SISTEM" | "AKUN">("IDENTITAS");

  // Identitas Form State
  const [logo, setLogo] = useState(identity.logo);
  const [libName, setLibName] = useState(identity.libraryName);
  const [schoolName, setSchoolName] = useState(identity.schoolName);
  const [address, setAddress] = useState(identity.address);
  const [officerName, setOfficerName] = useState(identity.officerName);
  const [officerNip, setOfficerNip] = useState(identity.officerNip);
  const [officerPhone, setOfficerPhone] = useState(identity.officerPhone);
  const [schoolYear, setSchoolYear] = useState(identity.schoolYear);

  // WA Template State
  const [selectedTemplateType, setSelectedTemplateType] = useState<"PINJAM" | "TERLAMBAT">("PINJAM");
  const activeTemplate = templates.find(t => t.type === selectedTemplateType) || templates[0];
  const [templateText, setTemplateText] = useState(activeTemplate.text);

  // System Configuration State
  const [fineAmount, setFineAmount] = useState(config.finePerDay);
  const [maxDays, setMaxDays] = useState(config.maxLoanDays);
  const [triggerDaily, setTriggerDaily] = useState(true);

  useEffect(() => {
    setLogo(identity.logo);
    setLibName(identity.libraryName);
    setSchoolName(identity.schoolName);
    setAddress(identity.address);
    setOfficerName(identity.officerName);
    setOfficerNip(identity.officerNip);
    setOfficerPhone(identity.officerPhone);
    setSchoolYear(identity.schoolYear);
  }, [identity]);

  // Admin Profile State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUpdateTemplateType = (type: "PINJAM" | "TERLAMBAT") => {
    setSelectedTemplateType(type);
    const selected = templates.find(t => t.type === type);
    if (selected) {
      setTemplateText(selected.text);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setLogo(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateIdentity({
      logo,
      libraryName: libName,
      schoolName: schoolName,
      address,
      officerName,
      officerNip,
      officerPhone,
      schoolYear
    });
    alert("Berhasil memperbarui Identitas Perpustakaan!");
  };

  const handleSaveTemplate = () => {
    onUpdateTemplate(selectedTemplateType, templateText);
    alert("Berhasil memperbarui Template Pesan WhatsApp!");
  };

  const handleSaveConfig = () => {
    onUpdateConfig({
      finePerDay: Number(fineAmount),
      maxLoanDays: Number(maxDays)
    });
    alert("Berhasil memperbarui Konfigurasi Sistem!");
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      alert("Harap isi semua kolom password!");
      return;
    }
    const success = onUpdatePassword(oldPassword, newPassword);
    if (success) {
      setOldPassword("");
      setNewPassword("");
    }
  };

  // Helper to format live WhatsApp Message Preview on the right phone screen
  const getRenderedWaPreview = () => {
    let output = templateText;
    
    // Replace placeholders with realistic student mockup values
    output = output.replace(/{NAMA_SISWA}/g, "Budi Santoso");
    output = output.replace(/{JUDUL_BUKU}/g, "Laskar Pelangi");
    output = output.replace(/{TGL_PINJAM}/g, "2026-05-30");
    output = output.replace(/{TGL_JATUH_TEMPO}/g, "2026-06-06");
    output = output.replace(/{TARIF_DENDA}/g, "1000");
    output = output.replace(/{HARI_TERLAMBAT}/g, "5");
    output = output.replace(/{TOTAL_DENDA}/g, "5.000");

    // Basic markdown replacement to bold
    return output.split("\n").map((line, i) => {
      // Bold matcher for *text*
      let cleanLine = line;
      const boldRegex = /\*(.*?)\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <div key={i} className="min-h-[1.2rem]">
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
  };

  const handlePlaceholderClick = (placeholder: string) => {
    setTemplateText(prev => prev + " " + placeholder);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>PENGATURAN</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-ping"></span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
            {identity.libraryName} • {identity.schoolName}
          </p>
        </div>
      </div>

      {/* Tabs list bar */}
      <div className="flex flex-wrap border-b border-slate-800 bg-slate-900 p-2 rounded-2xl shadow-sm gap-1">
        <button
          onClick={() => setActiveSubTab("IDENTITAS")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "IDENTITAS"
              ? "bg-slate-950 text-emerald-400 border border-slate-800/80"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>IDENTITAS PERPUSTAKAAN</span>
        </button>
        <button
          onClick={() => setActiveSubTab("WA")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "WA"
              ? "bg-slate-950 text-emerald-400 border border-slate-800/80"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>TEMPLATE WA</span>
        </button>
        <button
          onClick={() => setActiveSubTab("SISTEM")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "SISTEM"
              ? "bg-slate-950 text-emerald-400 border border-slate-800/80"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>SISTEM</span>
        </button>
        <button
          onClick={() => setActiveSubTab("AKUN")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "AKUN"
              ? "bg-slate-950 text-emerald-400 border border-slate-800/80"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <User className="w-4 h-4" />
          <span>AKUN ADMIN</span>
        </button>
      </div>

      {/* Identitas Perpustakaan Tab */}
      {activeSubTab === "IDENTITAS" && (
        <form onSubmit={handleSaveIdentity} className="bg-slate-900 rounded-3xl border border-slate-800/80 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Col - Instansi details */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-[15px] border-b pb-2 border-slate-800 flex items-center space-x-2">
                <span>Identitas Instansi</span>
              </h3>

              {/* Logo Mock Upload */}
              <div className="p-4 bg-slate-950 border border-slate-800/60 rounded-2xl flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-slate-800 overflow-hidden p-1">
                  {logo && logo.startsWith("data:") ? (
                    <img src={logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <LibraryLogo size={36} variant="colored" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Upload Logo Baru
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer" 
                  />
                </div>
              </div>

              {/* Nama Perpustakaan */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nama Perpustakaan
                </label>
                <input
                  type="text"
                  value={libName}
                  onChange={(e) => setLibName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-200"
                />
              </div>

              {/* Nama Sekolah */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-slate-200"
                />
              </div>

              {/* Alamat Lengkap */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Alamat Lengkap
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-300"
                />
              </div>
            </div>

            {/* Right Col - Petugas Pengelola */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-[15px] border-b pb-2 border-slate-800">
                Petugas Pengelola
              </h3>

              {/* Nama Petugas */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nama Petugas Perpustakaan
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-200"
                />
              </div>

              {/* NIP Petugas */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  NIP Petugas
                </label>
                <input
                  type="text"
                  value={officerNip}
                  onChange={(e) => setOfficerNip(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono font-semibold text-slate-200"
                />
              </div>

              {/* No HP Petugas */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  No HP Petugas
                </label>
                <input
                  type="text"
                  value={officerPhone}
                  onChange={(e) => setOfficerPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-200"
                />
              </div>

              {/* Tahun Ajaran */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Identitas Perpustakaan</span>
            </button>
          </div>
        </form>
      )}

      {/* WA Template Tab */}
      {activeSubTab === "WA" && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Text editor area */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center space-x-3">
              <select
                value={selectedTemplateType}
                onChange={(e) => handleUpdateTemplateType(e.target.value as any)}
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-extrabold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="PINJAM">Konfirmasi Pinjam</option>
                <option value="TERLAMBAT">Pemberitahuan Terlambat</option>
              </select>

              <button
                onClick={handleSaveTemplate}
                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </div>

            {/* Variable Buttons placeholders list */}
            <div className="flex flex-wrap gap-1.5 py-1">
              {["{NAMA_SISWA}", "{JUDUL_BUKU}", "{TGL_PINJAM}", "{TGL_JATUH_TEMPO}", "{TARIF_DENDA}", "{HARI_TERLAMBAT}", "{TOTAL_DENDA}"].map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => handlePlaceholderClick(ph)}
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-900/40 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer"
                >
                  {ph}
                </button>
              ))}
            </div>

            {/* Textarea editor */}
            <textarea
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed text-slate-300"
            />
          </div>

          {/* Right Live WhatsApp Simulator Preview on phone */}
          <div className="lg:col-span-5 flex justify-center">
            {/* The Phone frame */}
            <div className="w-[300px] h-[520px] rounded-[36px] bg-[#0c1017] border-4 border-slate-800 p-2.5 flex flex-col relative shadow-2xl overflow-hidden select-none">
              
              {/* Phone Speaker & Camera notches */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-full flex items-center justify-between px-2.5 z-20">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
                <div className="w-7 h-1 bg-slate-900 rounded-full"></div>
              </div>

              {/* Phone Screen Screen Area */}
              <div className="flex-1 bg-[#efeae2] rounded-[28px] overflow-hidden flex flex-col pt-4">
                {/* Simulated WA Header */}
                <div className="bg-[#075e54] text-white p-3 flex items-center space-x-2 pt-5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
                    📚
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-black tracking-tight leading-tight">
                      Karsa Cendekia Pustaka
                    </div>
                    <div className="text-[7.5px] text-emerald-200 leading-none">Online</div>
                  </div>
                  {/* Phone controls */}
                  <PhoneCall className="w-3.5 h-3.5 text-white/90" />
                </div>

                {/* Simulated Chat wallpaper screen */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2 relative">
                  
                  {/* WhatsApp chat bubble */}
                  <div className="bg-white text-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm text-[9.5px] max-w-[90%] leading-normal relative">
                    {/* Tiny triangle accent on top-left of bubble */}
                    <div className="absolute top-0 -left-1 w-2 h-2 bg-white transform rotate-45"></div>
                    
                    {/* Chat Bubble rendered body with real boldings */}
                    <div className="space-y-1 relative z-10">
                      {getRenderedWaPreview()}
                    </div>
                    
                    {/* Time receipt info */}
                    <div className="text-[7px] text-slate-400 text-right mt-1 font-medium">
                      07:00 ✓✓
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Sistem Tab */}
      {activeSubTab === "SISTEM" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-150">
          {/* Main system config fields */}
          <div className="lg:col-span-7 bg-slate-900 rounded-3xl border border-slate-800/80 p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-white text-[15px] border-b pb-2 border-slate-800">
              Konfigurasi Denda & Peminjaman
            </h3>

            {/* Fine rate */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Denda Per Hari (Rp)
              </label>
              <input
                type="number"
                value={fineAmount}
                onChange={(e) => setFineAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-extrabold text-slate-200"
              />
            </div>

            {/* Borrow days limit */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Lama Peminjaman (Hari)
              </label>
              <input
                type="number"
                value={maxDays}
                onChange={(e) => setMaxDays(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-extrabold text-slate-200"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveConfig}
                className="inline-flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </div>

          {/* Action triggers and databases operations */}
          <div className="lg:col-span-5 bg-slate-900 rounded-3xl border border-slate-800/80 p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-white text-[15px] border-b pb-2 border-slate-800">
              Operasi & Utilitas Sistem
            </h3>

            <div className="space-y-4">
              {/* Reset database */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Reset seluruh database dan mengembalikan ke data instansi standar bawaan aplikasi demo.
                </p>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-slate-950 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/30 border border-slate-800 rounded-xl text-xs font-bold py-3 text-slate-400 transition-all cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>Inisialisasi Database</span>
                </button>
              </div>

              {/* Automatic daily cron trigger toggle */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Aktifkan pemicu bot otomatisasi harian untuk mengecek keterlambatan buku setiap pagi jam 07:00 WIB.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTriggerDaily(!triggerDaily);
                    alert(`Daily automated cron trigger ${!triggerDaily ? "diaktifkan" : "dimatikan"}!`);
                  }}
                  className={`w-full inline-flex items-center justify-center space-x-2 border rounded-xl text-xs font-bold py-3 transition-all cursor-pointer ${
                    triggerDaily 
                      ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/30" 
                      : "bg-slate-950 text-slate-500 border-slate-800"
                  }`}
                >
                  <BellRing className="w-4 h-4 animate-bounce" />
                  <span>{triggerDaily ? "Aktifkan Trigger Harian (07.00)" : "Mati - Aktifkan Trigger Harian"}</span>
                </button>
              </div>

              {/* Recalculate delays / fines manually */}
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Picu kalkulator sistem untuk mengecek tanggal kembali dan menghitung denda berjalan secara instan.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onRunDelayCheck();
                    alert("Berhasil memeriksa seluruh keterlambatan pengembalian buku! Semua nominal denda telah dikalkulasi ulang berdasarkan waktu lokal saat ini.");
                  }}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-900/30 rounded-xl text-xs font-bold py-3 transition-all shadow-sm cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Jalankan Cek Keterlambatan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Akun Admin Tab */}
      {activeSubTab === "AKUN" && (
        <form onSubmit={handleSavePassword} className="bg-slate-900 rounded-3xl border border-slate-800/80 p-6 shadow-sm max-w-md space-y-5 animate-in fade-in duration-150">
          <h3 className="font-extrabold text-white text-[15px] border-b pb-2 border-slate-800">
            Keamanan Akun Admin
          </h3>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Password Lama *
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-200 placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Password Baru *
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-200 placeholder:text-slate-600"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center space-x-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      )}

      {/* Database Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 p-6 space-y-6">
            <div className="flex items-center space-x-3 text-rose-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-extrabold text-slate-100">Konfirmasi Reset Database</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin mereset seluruh database perpustakaan ke data awal? Semua data baru Anda akan hilang! Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDatabase();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-950/25 cursor-pointer"
              >
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

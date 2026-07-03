import React, { useState, useRef } from "react";
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
  UserCheck,
  Contact,
  Mail
} from "lucide-react";
import { Member, ClassItem } from "../types";
import { formatIndonesianDate } from "../utils/dateFormatter";

interface MemberViewProps {
  members: Member[];
  classes: ClassItem[];
  onAddMember: (newMember: Member | Member[]) => void;
  onEditMember: (updatedMember: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onPrintCard: (memberId: string) => void; // switches tab to CardView for this member
  identity: { libraryName: string; schoolName: string };
}

export default function MemberView({
  members,
  classes,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onPrintCard,
  identity
}: MemberViewProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");

  // Upload Massal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState<string>("");

  // Form states
  const [nis, setNis] = useState("");
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [registerDate, setRegisterDate] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const filteredMembers = members.filter((m) => {
    const className = classes.find(c => c.id === m.classId)?.name || "";
    const term = search.toLowerCase();
    return (
      m.id.toLowerCase().includes(term) ||
      m.name.toLowerCase().includes(term) ||
      m.phone.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      className.toLowerCase().includes(term)
    );
  });

  const openAddModal = () => {
    setModalMode("ADD");
    setNis("");
    setName("");
    // Default to first class if exists
    setClassId(classes[0]?.id || "");
    setPhone("");
    setEmail("");
    setRegisterDate(new Date().toISOString().split("T")[0]);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setModalMode("EDIT");
    setNis(m.id);
    setName(m.name);
    setClassId(m.classId);
    setPhone(m.phone);
    setEmail(m.email);
    setRegisterDate(m.registerDate);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim()) return setErrorMsg("NIS / Nomor Anggota wajib diisi!");
    if (!name.trim()) return setErrorMsg("Nama lengkap wajib diisi!");
    if (!classId) return setErrorMsg("Silakan pilih kelas!");
    if (!phone.trim()) return setErrorMsg("Nomor HP/WA wajib diisi!");

    // Validate unique NIS on add
    if (modalMode === "ADD" && members.some(m => m.id === nis.trim())) {
      return setErrorMsg("NIS sudah terdaftar untuk anggota lain!");
    }

    const memberData: Member = {
      id: nis.trim(),
      name: name.trim(),
      classId,
      phone: phone.trim(),
      email: email.trim(),
      registerDate: registerDate || new Date().toISOString().split("T")[0]
    };

    if (modalMode === "ADD") {
      onAddMember(memberData);
    } else {
      onEditMember(memberData);
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
        const nisIdx = header.findIndex(h => 
          h === "nis" || h === "id" || h === "nomor anggota" || h === "memberid" || 
          h.includes("id anggota") || h.includes("nis") || h.includes("nomor")
        );
        const nameIdx = header.findIndex(h => 
          h === "nama" || h === "name" || h === "nama lengkap" || h === "fullname" || 
          h.includes("nama lengkap") || h.includes("nama anggota")
        );
        const classIdx = header.findIndex(h => 
          h === "id_kelas" || h === "classid" || h === "kelas" || h === "id kelas" || 
          h.includes("id kelas") || h.includes("kelas")
        );
        const phoneIdx = header.findIndex(h => 
          h === "whatsapp" || h === "phone" || h === "no hp" || h === "wa" || h === "telepon" || h === "no. hp" || 
          h.includes("no hp") || h.includes("whatsapp") || h.includes("telepon") || h.includes("wa") || h.includes("phone")
        );
        const emailIdx = header.findIndex(h => 
          h === "email" || h === "surel" || h.includes("email")
        );

        if (nisIdx === -1 || nameIdx === -1) {
          throw new Error("Kolom wajib 'nis' dan 'nama' tidak ditemukan di baris header pertama CSV");
        }

        const importedMembers: Member[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          // regex to split by comma or semicolon while ignoring delimiters inside quotes
          const matches = line.match(/(".*?"|[^",;]+)(?=\s*[,;]|\s*$)/g) || line.split(/[;,]/);
          const cols = matches.map(c => c.trim().replace(/^["']|["']$/g, ""));

          if (cols.length < 2) continue;

          const id = cols[nisIdx] || "";
          const name = cols[nameIdx] || "";
          if (!id || !name) continue;

          // Find class ID or default to c1
          let resolvedClassId = "c1";
          if (classIdx !== -1 && cols[classIdx]) {
            const rawClass = cols[classIdx];
            // find if exists in classes
            const matchedClass = classes.find(c => c.id.toLowerCase() === rawClass.toLowerCase() || c.name.toLowerCase() === rawClass.toLowerCase());
            if (matchedClass) {
              resolvedClassId = matchedClass.id;
            } else {
              resolvedClassId = rawClass;
            }
          } else if (classes.length > 0) {
            resolvedClassId = classes[0].id;
          }

          const phone = phoneIdx !== -1 ? cols[phoneIdx] || "" : "";
          const email = emailIdx !== -1 ? cols[emailIdx] || "" : "";

          importedMembers.push({
            id,
            name,
            classId: resolvedClassId,
            phone,
            email,
            registerDate: new Date().toISOString().split("T")[0]
          });
        }

        if (importedMembers.length === 0) {
          throw new Error("Tidak ada baris data valid yang berhasil dibaca.");
        }

        onAddMember(importedMembers);
        setIsUploadOpen(false);
        setUploadedFile(null);
        alert(`Berhasil mengimpor ${importedMembers.length} anggota baru dari berkas CSV!`);
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
            <span>ANGGOTA</span>
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
            <span>Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800/80 shadow-sm overflow-hidden p-6 space-y-6">
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, kelas, HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-500 font-medium text-slate-200"
          />
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto border border-slate-800 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/50">
                <th className="py-4 px-6">NIS / Anggota</th>
                <th className="py-4 px-6">Nama</th>
                <th className="py-4 px-6">Kelas</th>
                <th className="py-4 px-6">No. HP / Whatsapp</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Tgl Daftar</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 text-sm font-medium">
                    Tidak ada data anggota ditemukan.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((item) => {
                  const mClass = classes.find(c => c.id === item.classId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-950/40 transition-all duration-150">
                      <td className="py-4.5 px-6 font-mono text-[12px] text-slate-400 font-semibold">
                        {item.id}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="font-extrabold text-slate-200 text-[13.5px]">
                          {item.name}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 font-extrabold text-slate-400 text-xs">
                        {mClass ? mClass.name : "N/A"}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className="inline-flex items-center space-x-1.5 bg-emerald-950/60 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-900/40">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{item.phone}</span>
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-slate-400 text-xs">
                        {item.email || <span className="text-slate-600 font-bold">—</span>}
                      </td>
                      <td className="py-4.5 px-6 text-slate-400 text-xs font-medium">
                        {formatIndonesianDate(item.registerDate)}
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => onPrintCard(item.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 text-xs font-bold transition-all border border-amber-900/30 cursor-pointer"
                            title="Cetak Kartu Anggota"
                          >
                            <Contact className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 text-xs font-bold transition-all border border-blue-900/30 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmId(item.id);
                              setDeleteConfirmTitle(item.name);
                            }}
                            className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 transition-all border border-slate-800/80 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
                  Upload Massal Anggota (Excel / CSV)
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
                Tarik dan taruh berkas data siswa atau klik tombol telusuri untuk menambahkan anggota sekaligus secara massal. Kolom wajib: <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-400 font-mono text-[10px] font-bold">nis, nama, id_kelas, whatsapp, email</code>.
              </p>

              {/* Drag and Drop */}
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
                      : "bg-slate-955 text-slate-600 cursor-not-allowed shadow-none border border-slate-850"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-850 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-[15px]">
                  {modalMode === "ADD" ? "Tambah Anggota Baru" : "Edit Detail Anggota"}
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

              {/* NIS Field - Disabled on Edit */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  NIS / Nomor Anggota
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 0012345681"
                  value={nis}
                  disabled={modalMode === "EDIT"}
                  onChange={(e) => setNis(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-mono font-semibold disabled:bg-slate-950 disabled:text-slate-600 disabled:cursor-not-allowed"
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Maya Sari Dewi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Class */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pilih Kelas
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                  >
                    <option value="" disabled>-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date Registered */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tanggal Terdaftar
                  </label>
                  <input
                    type="date"
                    value={registerDate}
                    onChange={(e) => setRegisterDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Alamat Email (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="Contoh: siswa@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-medium"
                  />
                </div>
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
                  <span>Simpan Anggota</span>
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
              <h3 className="text-base font-extrabold text-slate-100">Konfirmasi Hapus Anggota</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus anggota <strong className="text-slate-200">"{deleteConfirmTitle}"</strong>? Tindakan ini tidak dapat dibatalkan.
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
                  onDeleteMember(deleteConfirmId);
                  setDeleteConfirmId(null);
                  setDeleteConfirmTitle("");
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-950/25 cursor-pointer"
              >
                Hapus Anggota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

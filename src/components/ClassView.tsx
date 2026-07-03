import React, { useState, useRef } from "react";
import { Search, Plus, Edit3, Trash2, X, School, Check, RefreshCw, FileSpreadsheet, Upload, Download } from "lucide-react";
import { ClassItem, Member } from "../types";

interface ClassViewProps {
  classes: ClassItem[];
  onAddClass: (newClass: Omit<ClassItem, "id">) => void;
  onEditClass: (updatedClass: ClassItem) => void;
  onDeleteClass: (classId: string) => void;
  identity: { libraryName: string; schoolName: string };
  members: Member[];
  onAddMember: (newMembers: Member[]) => void;
}

export default function ClassView({
  classes,
  onAddClass,
  onEditClass,
  onDeleteClass,
  identity,
  members,
  onAddMember
}: ClassViewProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");

  // Delete confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState<string>("");
  
  // Bulk import modal states
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkClass, setBulkClass] = useState<ClassItem | null>(null);
  const [bulkTab, setBulkTab] = useState<"PASTE" | "FILE">("PASTE");
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<Omit<Member, "classId" | "registerDate">[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form fields
  const [selectedId, setSelectedId] = useState("");
  const [className, setClassName] = useState("");
  const [homeroom, setHomeroom] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.homeroomTeacher.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setModalMode("ADD");
    setSelectedId("");
    setClassName("");
    setHomeroom("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassItem) => {
    setModalMode("EDIT");
    setSelectedId(c.id);
    setClassName(c.name);
    setHomeroom(c.homeroomTeacher);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setErrorMsg("Nama kelas wajib diisi!");
      return;
    }
    if (!homeroom.trim()) {
      setErrorMsg("Nama wali kelas wajib diisi!");
      return;
    }

    if (modalMode === "ADD") {
      onAddClass({ name: className, homeroomTeacher: homeroom });
    } else {
      onEditClass({ id: selectedId, name: className, homeroomTeacher: homeroom });
    }

    setIsModalOpen(false);
  };

  const openBulkModal = (item: ClassItem) => {
    setBulkClass(item);
    setBulkTab("PASTE");
    setBulkText("");
    setBulkError("");
    setParsedStudents([]);
    setIsBulkOpen(true);
  };

  const parseInput = (text: string) => {
    if (!text.trim()) {
      setParsedStudents([]);
      return;
    }
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const result: Omit<Member, "classId" | "registerDate">[] = [];

    lines.forEach((line) => {
      // Skip Excel separator specifiers or BOM artifacts
      if (line.toLowerCase().startsWith("sep=") || line.startsWith("\uFEFF")) {
        return;
      }

      // If the line contains headers, skip it
      if (
        line.toLowerCase().includes("nama") || 
        line.toLowerCase().includes("nis") || 
        line.toLowerCase().includes("name") ||
        line.toLowerCase().includes("no.") ||
        line.toLowerCase().includes("phone") ||
        line.toLowerCase().includes("telepon")
      ) {
        return;
      }

      // Split by tab (Excel/Google Sheets copies tabs) or semicolon or comma
      const cols = line.split(/\t|;|,/).map(col => col.trim().replace(/^["']|["']$/g, ""));
      
      let nis = "";
      let name = "";
      let phone = "";
      let email = "";

      if (cols.length === 1) {
        // Just a name provided
        name = cols[0];
        nis = "";
      } else if (cols.length >= 2) {
        // Check if first column is just a row numbering (e.g. 1, 2, 3...)
        let startIdx = 0;
        if (/^\d+$/.test(cols[0]) && cols[0].length <= 2 && cols.length > 2) {
          startIdx = 1;
        }

        const col1 = cols[startIdx] || "";
        const col2 = cols[startIdx + 1] || "";
        const col3 = cols[startIdx + 2] || "";
        const col4 = cols[startIdx + 3] || "";

        // Check if first columns looks like a NIS (numeric and length >= 3)
        const col1IsNis = /^\d+$/.test(col1) && col1.length >= 3;

        if (col1IsNis) {
          nis = col1;
          name = col2;
          phone = col3 || "";
          email = col4 || "";
        } else {
          name = col1;
          phone = col2 || "";
          email = col3 || "";
          nis = "";
        }
      }

      if (phone) {
        phone = phone.replace(/\D/g, "");
      }
      if (!phone) {
        phone = "081200000000";
      }

      if (name) {
        result.push({
          id: nis,
          name: name,
          phone: phone,
          email: email
        });
      }
    });

    setParsedStudents(result);
  };

  React.useEffect(() => {
    if (isBulkOpen) {
      parseInput(bulkText);
    }
  }, [bulkText, isBulkOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readAndParseFile(e.target.files[0]);
    }
  };

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
      readAndParseFile(e.dataTransfer.files[0]);
    }
  };

  const readAndParseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setBulkText(text);
      }
    };
    reader.onerror = () => {
      setBulkError("Gagal membaca berkas.");
    };
    reader.readAsText(file);
  };

  const handleEditParsedStudent = (index: number, field: "id" | "name" | "phone" | "email", value: string) => {
    setParsedStudents(prev => prev.map((s, idx) => {
      if (idx === index) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleRemoveParsedStudent = (index: number) => {
    setParsedStudents(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveBulkImport = () => {
    if (parsedStudents.length === 0) {
      setBulkError("Tidak ada data siswa untuk diimpor!");
      return;
    }

    const importedIds = new Set<string>();
    for (const student of parsedStudents) {
      if (!student.id.trim()) {
        setBulkError(`NIS tidak boleh kosong untuk siswa "${student.name}"!`);
        return;
      }
      if (importedIds.has(student.id)) {
        setBulkError(`Duplikat NIS dalam daftar impor: ${student.id}`);
        return;
      }
      importedIds.add(student.id);
    }

    const existingIds = new Set(members.map(m => m.id));
    for (const student of parsedStudents) {
      if (existingIds.has(student.id)) {
        setBulkError(`NIS ${student.id} ("${student.name}") sudah terdaftar di sistem! Silakan ubah NIS tersebut.`);
        return;
      }
    }

    if (!bulkClass) return;

    const newMembers: Member[] = parsedStudents.map(student => ({
      id: student.id.trim(),
      name: student.name.trim(),
      classId: bulkClass.id,
      phone: student.phone.trim(),
      email: student.email.trim(),
      registerDate: new Date().toISOString().split("T")[0]
    }));

    onAddMember(newMembers);
    setIsBulkOpen(false);
    setBulkClass(null);
    setBulkText("");
    setParsedStudents([]);
  };

  const downloadCsvTemplate = () => {
    // Semicolon separator with sep=; and BOM makes Excel open columns cleanly in different cells
    const sep = "sep=;\n";
    const headers = "NIS;Nama Lengkap;WhatsApp;Email\n";
    const row1 = "1001;Dwi Cahyono;08123456789;dwi@gmail.com\n";
    const row2 = "1002;Tri Lestari;08112233445;tri@gmail.com\n";
    const row3 = "1003;Eko Wijaya;08155667788;eko@gmail.com\n";
    const csvContent = "\uFEFF" + sep + headers + row1 + row2 + row3;
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_siswa.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>KELAS</span>
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
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-950/50 transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas</span>
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
            placeholder="Cari kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-500 font-medium text-slate-200"
          />
        </div>

        {/* Classes Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-4 px-6 w-1/3">Nama Kelas</th>
                <th className="py-4 px-6 w-1/3">Wali Kelas</th>
                <th className="py-4 px-6 w-1/3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-slate-500 text-sm font-medium">
                    Tidak ada kelas ditemukan.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-all duration-150">
                    <td className="py-4.5 px-6 font-bold text-slate-200 text-[14px]">
                      {item.name}
                    </td>
                    <td className="py-4.5 px-6 font-medium text-slate-300 text-[13px]">
                      {item.homeroomTeacher}
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openBulkModal(item)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 text-xs font-bold transition-all border border-emerald-900/30 cursor-pointer"
                          title="Input Massal Nama Siswa format Excel / CSV"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Input Massal</span>
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/40 text-amber-400 text-xs font-bold transition-all border border-amber-900/30 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmId(item.id);
                            setDeleteConfirmTitle(item.name);
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 transition-all border border-slate-800/80 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-850 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <School className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-[15px]">
                  {modalMode === "ADD" ? "Tambah Kelas Baru" : "Edit Detail Kelas"}
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

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: X IPA 1, VIII, IX A"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Wali Kelas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Hartati, M.Pd."
                  value={homeroom}
                  onChange={(e) => setHomeroom(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200 font-semibold"
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
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkOpen && bulkClass && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-850 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-[15px]">
                    Input Massal Siswa - {bulkClass.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Wali Kelas: {bulkClass.homeroomTeacher}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBulkOpen(false);
                  setBulkClass(null);
                  setBulkText("");
                  setParsedStudents([]);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {bulkError && (
                <div className="p-3 bg-rose-950/50 text-rose-400 text-xs font-bold rounded-xl border border-rose-900/30 flex items-center space-x-1.5">
                  <span>⚠️</span>
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setBulkTab("PASTE")}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
                    bulkTab === "PASTE"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  📋 Tempel dari Excel / Sheets
                </button>
                <button
                  type="button"
                  onClick={() => setBulkTab("FILE")}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] ${
                    bulkTab === "FILE"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  📁 Unggah File CSV / TXT
                </button>
              </div>

              {/* Tab Contents */}
              {bulkTab === "PASTE" ? (
                <div className="space-y-3">
                  <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950/30 p-3 rounded-xl border border-slate-850">
                    <span className="font-extrabold text-slate-300 block">Cara Penggunaan:</span>
                    <p className="leading-relaxed">
                      Buka program Excel atau Google Sheets Anda, blok dan <strong>Salin (Ctrl+C)</strong> kolom data siswa (bisa berupa kolom Nama saja, atau kolom berurutan <strong>[NIS, Nama, No. HP, Email]</strong>), lalu <strong>Tempel (Ctrl+V)</strong> pada kotak di bawah ini.
                    </p>
                  </div>
                  <textarea
                    rows={6}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="Contoh format tempel:&#10;Dwi Cahyono&#10;Tri Lestari&#10;&#10;Atau dengan kolom lengkap (Pemisah Tab Excel):&#10;1051	Dwi Cahyono	08123456789	dwi@gmail.com&#10;1052	Tri Lestari	08112233445	tri@gmail.com"
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-200"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-[11px] text-slate-400 bg-slate-950/30 p-4 rounded-xl border border-slate-850 space-y-3 leading-relaxed">
                    <div>
                      <span className="font-extrabold text-slate-300 block mb-1">Format Kolom Berkas CSV:</span>
                      <code className="block bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400 whitespace-pre">
                        sep=;{"\n"}
                        NIS;Nama Lengkap;WhatsApp;Email{"\n"}
                        1001;Dwi Cahyono;08123456789;dwi@gmail.com{"\n"}
                        1002;Tri Lestari;08112233445;tri@gmail.com
                      </code>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 border-t border-slate-850/60">
                      <span className="text-[10px] text-slate-500 font-medium">
                        * Kolom dapat dipisahkan dengan tanda koma (,), titik koma (;), atau tab.
                      </span>
                      <button
                        type="button"
                        onClick={downloadCsvTemplate}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-900/40 text-[10px] font-bold transition-all cursor-pointer self-start sm:self-auto"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Template CSV</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Drag and Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      dragActive 
                        ? "border-emerald-500 bg-emerald-950/20" 
                        : bulkText 
                        ? "border-emerald-500 bg-emerald-950/20" 
                        : "border-slate-800 hover:border-emerald-500 hover:bg-slate-950/10"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv,.txt"
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mb-2.5">
                      <Upload className="w-5 h-5" />
                    </div>
                    {bulkText ? (
                      <div>
                        <p className="text-xs font-bold text-slate-200">Berkas berhasil dibaca!</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Klik untuk mengganti dengan berkas lain</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-300">Tarik dan taruh berkas CSV / TXT di sini</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">atau klik untuk menelusuri komputer Anda</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parsedStudents.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                      📋 Pratinjau Hasil Pembacaan ({parsedStudents.length} Siswa)
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedStudents([])}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Bersihkan Semua
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-56">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60 sticky top-0">
                          <th className="py-2.5 px-4 w-28">NIS / No Anggota</th>
                          <th className="py-2.5 px-4">Nama Lengkap</th>
                          <th className="py-2.5 px-4 w-32">WhatsApp</th>
                          <th className="py-2.5 px-4">Email (Opsional)</th>
                          <th className="py-2.5 px-4 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 text-xs">
                        {parsedStudents.map((student, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/20">
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={student.id}
                                onChange={(e) => handleEditParsedStudent(idx, "id", e.target.value)}
                                className="w-full px-2 py-1 bg-slate-950 border border-slate-850 rounded text-xs text-slate-200 font-mono font-semibold"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={student.name}
                                onChange={(e) => handleEditParsedStudent(idx, "name", e.target.value)}
                                className="w-full px-2 py-1 bg-slate-950 border border-slate-850 rounded text-xs text-slate-200 font-semibold"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={student.phone}
                                onChange={(e) => handleEditParsedStudent(idx, "phone", e.target.value)}
                                className="w-full px-2 py-1 bg-slate-950 border border-slate-850 rounded text-xs text-slate-200 font-semibold"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={student.email}
                                placeholder="—"
                                onChange={(e) => handleEditParsedStudent(idx, "email", e.target.value)}
                                className="w-full px-2 py-1 bg-slate-950 border border-slate-850 rounded text-xs text-slate-300"
                              />
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveParsedStudent(idx)}
                                className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                                title="Hapus baris ini"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-normal block italic">
                    * Anda dapat mengedit langsung data NIS, nama, atau no. HP di atas sebelum mengklik simpan.
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-950/30 border-t border-slate-850 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsBulkOpen(false);
                  setBulkClass(null);
                  setBulkText("");
                  setParsedStudents([]);
                }}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              
              <button
                type="button"
                onClick={handleSaveBulkImport}
                disabled={parsedStudents.length === 0}
                className={`inline-flex items-center space-x-1 font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md ${
                  parsedStudents.length > 0
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20 cursor-pointer"
                    : "bg-slate-955 text-slate-600 cursor-not-allowed border border-slate-850"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Impor {parsedStudents.length} Siswa Ke {bulkClass.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 p-6 space-y-6">
            <div className="flex items-center space-x-3 text-rose-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-extrabold text-slate-100">Konfirmasi Hapus Kelas</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus kelas <strong className="text-slate-200">"{deleteConfirmTitle}"</strong>? Tindakan ini tidak dapat dibatalkan.
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
                  onDeleteClass(deleteConfirmId);
                  setDeleteConfirmId(null);
                  setDeleteConfirmTitle("");
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-950/25 cursor-pointer"
              >
                Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

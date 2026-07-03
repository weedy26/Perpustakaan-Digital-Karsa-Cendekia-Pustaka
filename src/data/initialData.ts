import { ClassItem, Book, Member, Loan, LibraryIdentity, WaTemplate, SystemConfig } from "../types";

export const initialClasses: ClassItem[] = [
  { id: "c1", name: "VIII", homeroomTeacher: "Hartati, M.Pd." },
  { id: "c2", name: "X IPA 1", homeroomTeacher: "Siti Aminah, S.Pd." },
  { id: "c3", name: "X IPS 2", homeroomTeacher: "Budi Hartono, S.Kom." }
];

export const initialBooks: Book[] = [
  {
    id: "b1",
    title: "SEJARAH INDONESIA KELAS XI",
    author: "SUTJIPTO",
    year: 2020,
    category: "Pelajaran",
    qty: 15,
    availableQty: 14,
    coverImage: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: "b2",
    title: "FISIKA KUANTUM DASAR",
    author: "DWI S.",
    year: 2022,
    category: "Pelajaran",
    qty: 15,
    availableQty: 14,
    coverImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: "b3",
    title: "LASKAR PELANGI",
    author: "ANDREA HIRATA",
    year: 2005,
    category: "Fiksi",
    qty: 10,
    availableQty: 10,
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: "b4",
    title: "ENSIKLOPEDIA ANTARIKSA",
    author: "PROF. WAHYU",
    year: 2024,
    category: "Referensi",
    qty: 8,
    availableQty: 8,
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  }
];

export const initialMembers: Member[] = [
  {
    id: "0012345681",
    name: "Maya Sari Dewi",
    classId: "c2", // X IPA 1
    phone: "08123456789",
    email: "maya@gmail.com",
    registerDate: "2026-04-17"
  },
  {
    id: "0044332211",
    name: "Syakira",
    classId: "c2", // X IPA 1
    phone: "081575706756",
    email: "syakira@gmail.com",
    registerDate: "2026-04-18"
  },
  {
    id: "0011223344",
    name: "Budi Setiawan",
    classId: "c1", // VIII
    phone: "082225417408",
    email: "",
    registerDate: "2026-04-18"
  }
];

export const initialLoans: Loan[] = [
  {
    id: "P001",
    memberId: "0044332211", // Syakira
    bookId: "b1", // Sejarah Indonesia
    loanDate: "2026-05-18",
    dueDate: "2026-05-25",
    returnDate: null,
    status: "DIPINJAM",
    fineAmount: 0
  },
  {
    id: "P002",
    memberId: "0012345681", // Maya Sari Dewi
    bookId: "b2", // Fisika Kuantum
    loanDate: "2026-05-10",
    dueDate: "2026-05-17",
    returnDate: null,
    status: "TERLAMBAT",
    fineAmount: 35000 // Rp 35.000 denda
  },
  {
    id: "P003",
    memberId: "0011223344", // Budi Setiawan
    bookId: "b3", // Laskar Pelangi
    loanDate: "2026-04-10",
    dueDate: "2026-04-17",
    returnDate: "2026-04-15",
    status: "SELESAI",
    fineAmount: 0
  }
];

export const initialLibraryIdentity: LibraryIdentity = {
  logo: "📚",
  libraryName: "KARSA CENDEKIA PUSTAKA",
  schoolName: "SMP NEGERI 26 PURWOREJO",
  address: "Jl. Jenderal Sudirman No. 120, Purworejo",
  officerName: "Ahmad Syarif",
  officerNip: "19890212 201504 1 003",
  officerPhone: "081234567890",
  schoolYear: "2025/2026"
};

export const initialWaTemplates: WaTemplate[] = [
  {
    type: "PINJAM",
    text: `*Konfirmasi Peminjaman Buku*

Halo *{NAMA_SISWA}*,
Peminjaman buku Anda telah dicatat.

📖 Buku : {JUDUL_BUKU}
📅 Tgl Pinjam : {TGL_PINJAM}
⏰ Jatuh Tempo : *{TGL_JATUH_TEMPO}*

Harap kembalikan tepat waktu.
Denda: *Rp {TARIF_DENDA}/hari*

🏫 KARSA CENDEKIA PUSTAKA
🧑‍💼 Petugas : Ahmad Syarif`
  },
  {
    type: "TERLAMBAT",
    text: `*Pemberitahuan Keterlambatan Peminjaman*

Halo *{NAMA_SISWA}*,
Buku yang Anda pinjam telah melewati batas waktu pengembalian.

📖 Buku : {JUDUL_BUKU}
📅 Tgl Pinjam : {TGL_PINJAM}
⏰ Jatuh Tempo : *{TGL_JATUH_TEMPO}*
⚠️ Keterlambatan : {HARI_TERLAMBAT} hari
💵 Denda Berjalan : *Rp {TOTAL_DENDA}*

Mohon segera mengembalikan buku ke perpustakaan.

🏫 KARSA CENDEKIA PUSTAKA
🧑‍💼 Petugas : Ahmad Syarif`
  }
];

export const initialSystemConfig: SystemConfig = {
  finePerDay: 1000,
  maxLoanDays: 7
};

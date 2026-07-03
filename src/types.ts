export interface ClassItem {
  id: string;
  name: string;
  homeroomTeacher: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  category: "Pelajaran" | "Fiksi" | "Referensi" | "Lainnya";
  qty: number;
  availableQty: number;
  coverImage?: string;
}

export interface Member {
  id: string; // NIS / No Anggota
  name: string;
  classId: string; // References ClassItem.id
  phone: string;
  email: string;
  registerDate: string;
}

export interface Loan {
  id: string; // e.g., P001
  memberId: string;
  bookId: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null; // null if still active
  status: "DIPINJAM" | "TERLAMBAT" | "SELESAI";
  fineAmount: number;
}

export interface LibraryIdentity {
  logo: string; // Base64 or icon
  libraryName: string;
  schoolName: string;
  address: string;
  officerName: string;
  officerNip: string;
  officerPhone: string;
  schoolYear: string;
}

export interface WaTemplate {
  type: "PINJAM" | "TERLAMBAT";
  text: string;
}

export interface SystemConfig {
  finePerDay: number;
  maxLoanDays: number;
}

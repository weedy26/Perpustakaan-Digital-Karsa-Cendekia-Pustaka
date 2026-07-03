import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { ClassItem, Book, Member, Loan, LibraryIdentity, WaTemplate, SystemConfig } from "../types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/drive.file");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Restore access token from localStorage for persistent realtime connection
      const savedToken = localStorage.getItem("library_google_token");
      if (savedToken) {
        cachedAccessToken = savedToken;
      }

      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem("library_google_token");
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Gagal mendapatkan access token dari Google Auth");
    }

    cachedAccessToken = credential.accessToken;
    // Persist the token to localStorage to achieve persistent realtime synchronization
    localStorage.setItem("library_google_token", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    cachedAccessToken = localStorage.getItem("library_google_token");
  }
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem("library_google_token");
};

// -------------------------------------------------------------
// GOOGLE SHEETS API UTILITIES
// -------------------------------------------------------------

export async function findOrCreateSpreadsheet(token: string): Promise<string> {
  const fileName = "Sistem Perpustakaan - Karsa Cendekia Pustaka";
  const query = encodeURIComponent(`name='${fileName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!searchRes.ok) {
    throw new Error("Gagal mencari spreadsheet di Google Drive");
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // Create spreadsheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: {
        title: fileName
      },
      sheets: [
        { properties: { title: "Kelas" } },
        { properties: { title: "Buku" } },
        { properties: { title: "Anggota" } },
        { properties: { title: "Peminjaman" } },
        { properties: { title: "Identitas" } },
        { properties: { title: "Sistem_Config" } },
        { properties: { title: "WA_Template" } }
      ]
    })
  });
  
  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error("Create spreadsheet error:", errText);
    throw new Error("Gagal membuat spreadsheet baru di Google Drive");
  }
  
  const createData = await createRes.json();
  return createData.spreadsheetId;
}

export async function fetchSheetData(spreadsheetId: string, token: string, sheetName: string): Promise<any[][]> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z10000`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return data.values || [];
}

export async function pushToSheet(spreadsheetId: string, token: string, sheetName: string, headers: string[], rows: any[][]) {
  // Clear the sheet first to prevent trailing old rows
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z10000:clear`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  // Write new headers and values
  const values = [headers, ...rows];
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      range: `${sheetName}!A1`,
      majorDimension: "ROWS",
      values
    })
  });
}

// Full load from Sheets
export async function loadAllFromGoogleSheets(spreadsheetId: string, token: string) {
  const classesRows = await fetchSheetData(spreadsheetId, token, "Kelas");
  const booksRows = await fetchSheetData(spreadsheetId, token, "Buku");
  const membersRows = await fetchSheetData(spreadsheetId, token, "Anggota");
  const loansRows = await fetchSheetData(spreadsheetId, token, "Peminjaman");
  const identityRows = await fetchSheetData(spreadsheetId, token, "Identitas");
  const configRows = await fetchSheetData(spreadsheetId, token, "Sistem_Config");
  const templateRows = await fetchSheetData(spreadsheetId, token, "WA_Template");

  const classes: ClassItem[] = classesRows.slice(1).map(r => ({
    id: r[0] || "",
    name: r[1] || "",
    homeroomTeacher: r[2] || ""
  }));

  const books: Book[] = booksRows.slice(1).map(r => ({
    id: r[0] || "",
    title: r[1] || "",
    author: r[2] || "",
    year: Number(r[3]) || 2026,
    category: (r[4] || "Lainnya") as any,
    qty: Number(r[5]) || 0,
    availableQty: Number(r[6]) || 0,
    coverImage: r[7] || undefined
  }));

  const members: Member[] = membersRows.slice(1).map(r => ({
    id: r[0] || "",
    name: r[1] || "",
    classId: r[2] || "",
    phone: r[3] || "",
    email: r[4] || "",
    registerDate: r[5] || ""
  }));

  const loans: Loan[] = loansRows.slice(1).map(r => ({
    id: r[0] || "",
    memberId: r[1] || "",
    bookId: r[2] || "",
    loanDate: r[3] || "",
    dueDate: r[4] || "",
    returnDate: r[5] === "" || r[5] === undefined ? null : r[5],
    status: (r[6] || "DIPINJAM") as any,
    fineAmount: Number(r[7]) || 0
  }));

  let identity: LibraryIdentity | null = null;
  if (identityRows.length > 1) {
    const r = identityRows[1];
    identity = {
      logo: r[0] || "",
      libraryName: r[1] || "",
      schoolName: r[2] || "",
      address: r[3] || "",
      officerName: r[4] || "",
      officerNip: r[5] || "",
      officerPhone: r[6] || "",
      schoolYear: r[7] || ""
    };
  }

  let config: SystemConfig | null = null;
  if (configRows.length > 1) {
    const r = configRows[1];
    config = {
      finePerDay: Number(r[0]) || 1000,
      maxLoanDays: Number(r[1]) || 7
    };
  }

  let templates: WaTemplate[] = [];
  if (templateRows.length > 1) {
    templates = templateRows.slice(1).map(r => ({
      type: (r[0] || "PINJAM") as any,
      text: r[1] || ""
    }));
  }

  return { classes, books, members, loans, identity, config, templates };
}

// Ensure all required sheets exist
export async function ensureAllSheetsExist(spreadsheetId: string, token: string): Promise<void> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error("Gagal membaca detail spreadsheet dari Google Drive");
  }
  const meta = await res.json();
  const sheets = meta.sheets || [];
  const existingTitles = sheets.map((s: any) => s.properties.title);
  
  const requiredSheets = ["Kelas", "Buku", "Anggota", "Peminjaman", "Identitas", "Sistem_Config", "WA_Template"];
  const missingSheets = requiredSheets.filter(title => !existingTitles.includes(title));
  
  if (missingSheets.length > 0) {
    const requests = missingSheets.map(title => ({
      addSheet: {
        properties: { title }
      }
    }));
    
    const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ requests })
    });
    
    if (!addRes.ok) {
      console.error("Gagal menambahkan sheet yang kurang:", await addRes.text());
    }
  }
}

// Format the sheet professionally (emerald green theme, frozen header row, bold font, auto-resized columns)
export async function applyBeautifulFormattingToSheets(spreadsheetId: string, token: string) {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const meta = await res.json();
    const sheets = meta.sheets || [];
    
    const requests: any[] = [];
    
    for (const s of sheets) {
      const sheetId = s.properties.sheetId;
      
      // 1. Freeze first row
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: {
              frozenRowCount: 1
            }
          },
          fields: "gridProperties.frozenRowCount"
        }
      });
      
      // 2. Format row 1 (A1:L1) with beautiful Karsa Cendekia Pustaka Emerald Green (#064e3b)
      requests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 10
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.024,   // 6/255 -> #064e3b
                green: 0.306, // 78/255
                blue: 0.231   // 59/255
              },
              textFormat: {
                foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                bold: true,
                fontSize: 10,
                fontFamily: "Inter"
              },
              alignment: {
                horizontal: "CENTER",
                vertical: "MIDDLE"
              }
            }
          },
          fields: "userEnteredFormat(backgroundColor,textFormat,alignment)"
        }
      });
      
      // 3. Auto resize columns to content width
      requests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: 0,
            endIndex: 10
          }
        }
      });
    }
    
    if (requests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests })
      });
    }
  } catch (err) {
    console.warn("Gagal menerapkan format tabel visual:", err);
  }
}

// Full upload to Sheets with auto tab creation and formatting
export async function saveAllToGoogleSheets(
  spreadsheetId: string,
  token: string,
  data: {
    classes: ClassItem[];
    books: Book[];
    members: Member[];
    loans: Loan[];
    identity: LibraryIdentity;
    config: SystemConfig;
    templates: WaTemplate[];
  }
) {
  // Ensure all tabs exist first
  await ensureAllSheetsExist(spreadsheetId, token);

  // Push Kelas
  const classesRows = data.classes.map(c => [c.id, c.name, c.homeroomTeacher]);
  await pushToSheet(spreadsheetId, token, "Kelas", ["ID KELAS (Jangan Diubah)", "NAMA KELAS", "WALI KELAS"], classesRows);

  // Push Buku
  const booksRows = data.books.map(b => [b.id, b.title, b.author, b.year, b.category, b.qty, b.availableQty, b.coverImage || ""]);
  await pushToSheet(spreadsheetId, token, "Buku", [
    "ID BUKU (Jangan Diubah)", 
    "JUDUL BUKU", 
    "PENULIS / PENGARANG", 
    "TAHUN TERBIT", 
    "KATEGORI BUKU (Pelajaran/Fiksi/Lainnya)", 
    "JUMLAH TOTAL STOK", 
    "STOK TERSEDIA (Otomatis)", 
    "LINK COVER BUKU (URL Unsplash)"
  ], booksRows);

  // Push Anggota
  const membersRows = data.members.map(m => [m.id, m.name, m.classId, m.phone, m.email, m.registerDate]);
  await pushToSheet(spreadsheetId, token, "Anggota", [
    "ID ANGGOTA / NIS", 
    "NAMA LENGKAP ANGGOTA", 
    "ID KELAS (Hubungkan ke ID Kelas)", 
    "NO HP / WHATSAPP (Format: 08...)", 
    "EMAIL (Opsional)", 
    "TANGGAL DAFTAR (Format: YYYY-MM-DD)"
  ], membersRows);

  // Push Peminjaman
  const loansRows = data.loans.map(l => [l.id, l.memberId, l.bookId, l.loanDate, l.dueDate, l.returnDate || "", l.status, l.fineAmount]);
  await pushToSheet(spreadsheetId, token, "Peminjaman", [
    "ID PINJAM (Otomatis)", 
    "ID ANGGOTA / NIS", 
    "ID BUKU", 
    "TANGGAL PINJAM (YYYY-MM-DD)", 
    "JATUH TEMPO (YYYY-MM-DD)", 
    "TANGGAL KEMBALI", 
    "STATUS (DIPINJAM/TERLAMBAT/SELESAI)", 
    "TOTAL DENDA TERAKUMULASI (Rupiah)"
  ], loansRows);

  // Push Identitas
  const idRows = [[
    data.identity.logo,
    data.identity.libraryName,
    data.identity.schoolName,
    data.identity.address,
    data.identity.officerName,
    data.identity.officerNip,
    data.identity.officerPhone,
    data.identity.schoolYear
  ]];
  await pushToSheet(spreadsheetId, token, "Identitas", [
    "LOGO PERPUSTAKAAN (DataURI)", 
    "NAMA PERPUSTAKAAN", 
    "NAMA SEKOLAH", 
    "ALAMAT LENGKAP", 
    "NAMA KEPALA/PETUGAS PERPUS", 
    "NIP PETUGAS", 
    "NO TELEPON PETUGAS", 
    "TAHUN AJARAN"
  ], idRows);

  // Push Sistem_Config
  const configRows = [[data.config.finePerDay, data.config.maxLoanDays]];
  await pushToSheet(spreadsheetId, token, "Sistem_Config", ["TARIF DENDA PER HARI (Rupiah)", "MAKSIMAL LAMA PINJAM (Hari)"], configRows);

  // Push WA_Template
  const templateRows = data.templates.map(t => [t.type, t.text]);
  await pushToSheet(spreadsheetId, token, "WA_Template", ["TIPE NOTIFIKASI (PINJAM/TERLAMBAT)", "TEKS TEMPLATE PESAN"], templateRows);

  // Format the tabs professionally
  await applyBeautifulFormattingToSheets(spreadsheetId, token);
}

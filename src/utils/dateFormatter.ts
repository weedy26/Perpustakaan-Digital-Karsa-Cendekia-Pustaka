/**
 * Utility to format dates into Indonesian standard "tanggal, bulan, tahun" (e.g., "30 Juni 2026")
 */
export function formatIndonesianDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  
  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    // Check if it's YYYY-MM-DD
    const dateStr = typeof dateInput === "string" ? dateInput.trim() : "";
    if (!dateStr) return "—";
    
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      date = new Date(year, month, day);
    } else {
      date = new Date(dateStr);
    }
  }

  if (isNaN(date.getTime())) return "—";

  const day = date.getDate();
  const monthIdx = date.getMonth();
  const year = date.getFullYear();

  const indonesianMonths = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
  ];

  return `${day} ${indonesianMonths[monthIdx]} ${year}`;
}

/**
 * Utility to format dates into Indonesian standard "DD-MM-YYYY" (e.g., "30-06-2026")
 */
export function formatToDDMMYYYY(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  
  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    const dateStr = typeof dateInput === "string" ? dateInput.trim() : "";
    if (!dateStr) return "—";
    
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      date = new Date(year, month, day);
    } else {
      date = new Date(dateStr);
    }
  }

  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Calculates expiry date based on a given date and number of years to add
 */
export function calculateExpiryDate(dateStr: string, yearsToAdd: number = 3): string {
  if (!dateStr) return "";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return "";
  
  const year = parseInt(parts[0], 10) + yearsToAdd;
  const month = parts[1];
  const day = parts[2];
  
  return `${year}-${month}-${day}`;
}

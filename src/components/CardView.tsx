import React, { useState, useEffect } from "react";
import { FileText, Download, Contact, HelpCircle } from "lucide-react";
import { Member, ClassItem, LibraryIdentity } from "../types";
import LibraryLogo from "./LibraryLogo";
// @ts-ignore
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { formatIndonesianDate, calculateExpiryDate } from "../utils/dateFormatter";

interface CardViewProps {
  members: Member[];
  classes: ClassItem[];
  identity: LibraryIdentity;
  selectedMemberIdInitially?: string;
}

export default function CardView({
  members,
  classes,
  identity,
  selectedMemberIdInitially = ""
}: CardViewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(selectedMemberIdInitially);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (selectedMemberIdInitially) {
      setSelectedMemberId(selectedMemberIdInitially);
    } else if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [selectedMemberIdInitially, members]);

  const activeMember = members.find(m => m.id === selectedMemberId) || members[0];
  const activeClass = activeMember ? classes.find(c => c.id === activeMember.classId) : null;

  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    if (!activeMember) {
      setQrCodeUrl("");
      return;
    }
    
    const className = activeClass ? activeClass.name : "Umum";
    const validityDate = formatIndonesianDate(calculateExpiryDate(activeMember.registerDate, 3));
    
    const qrText = `=== KARTU ANGGOTA PERPUSTAKAAN ===\nNama        : ${activeMember.name}\nNo. Anggota : ${activeMember.id}\nKelas       : ${className}\nBerlaku S/D : ${validityDate}\n==================================`;

    QRCode.toDataURL(qrText, {
      margin: 1,
      width: 200,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    })
    .then((url) => {
      setQrCodeUrl(url);
    })
    .catch((err) => {
      console.error("Gagal membuat QR Code:", err);
    });
  }, [activeMember, activeClass]);

  const handleDownloadWord = () => {
    if (!activeMember) return;

    const schoolName = identity.schoolName;
    const libraryName = identity.libraryName;
    const memberName = activeMember.name;
    const memberId = activeMember.id;
    const validityDate = formatIndonesianDate(calculateExpiryDate(activeMember.registerDate, 3));

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Kartu Anggota Perpustakaan - ${memberName}</title>
        <style>
          @page {
            size: 8.56cm 5.4cm landscape;
            margin: 0.5cm;
          }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .card-table {
            width: 8.56cm;
            height: 5.4cm;
            background-color: #003820;
            color: #ffffff;
            border-radius: 10px;
            border-collapse: collapse;
            overflow: hidden;
            font-size: 9pt;
          }
          .header-cell {
            padding: 8px;
            text-align: center;
            border-bottom: 2px solid #fbbf24;
          }
          .school-title {
            font-size: 7.5pt;
            font-weight: bold;
            color: #e2e8f0;
            text-transform: uppercase;
            margin: 0;
            letter-spacing: 1px;
          }
          .card-label {
            font-size: 6.5pt;
            font-weight: bold;
            color: #fbbf24;
            text-transform: uppercase;
            margin: 2px 0 0 0;
            letter-spacing: 2px;
            white-space: nowrap;
          }
          .library-title {
            font-size: 11pt;
            font-weight: 900;
            color: #fbbf24;
            text-transform: uppercase;
            margin: 1px 0 0 0;
            letter-spacing: 1.5px;
          }
          .photo-cell {
            width: 2.2cm;
            padding: 8px;
            text-align: center;
            vertical-align: middle;
          }
          .photo-placeholder {
            width: 1.8cm;
            height: 2.4cm;
            background-color: #002e1c;
            border: 1px solid #10b981;
            border-radius: 5px;
            color: #10b981;
            font-size: 18pt;
            line-height: 2.4cm;
            text-align: center;
            font-weight: bold;
          }
          .info-cell {
            padding: 8px 12px 8px 4px;
            vertical-align: top;
          }
          .qr-cell {
            width: 2.0cm;
            padding: 8px;
            text-align: center;
            vertical-align: middle;
          }
          .qr-image {
            width: 1.6cm;
            height: 1.6cm;
            background-color: #ffffff;
            border-radius: 4px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .label-col {
            width: 70px;
            font-size: 7.5pt;
            font-weight: bold;
            color: #f1f5f9;
            text-transform: uppercase;
            padding: 3px 0;
          }
          .colon-col {
            width: 10px;
            color: #fcd34d;
            font-weight: bold;
            padding: 3px 0;
          }
          .value-col {
            font-size: 8.5pt;
            font-weight: bold;
            color: #ffffff;
            padding: 3px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          }
          .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
          }
          .badge-cell {
            padding-left: 8px;
            padding-bottom: 8px;
            font-size: 5pt;
            font-weight: bold;
            color: #f1f5f9;
          }
          .badge-text-gold {
            color: #fcd34d;
          }
          .motto-cell {
            padding-right: 8px;
            padding-bottom: 8px;
            text-align: right;
            font-size: 6.5pt;
            font-style: italic;
            color: #d1fae5;
          }
          .motto-gold {
            color: #fcd34d;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <table class="card-table" cellpadding="0" cellspacing="0" border="0">
          <!-- Header -->
          <tr>
            <td colspan="3" class="header-cell">
              <div class="school-title">${schoolName}</div>
              <div class="card-label">KARTU ANGGOTA</div>
              <div class="library-title">${libraryName}</div>
            </td>
          </tr>
          
          <!-- Main body with Photo and Info -->
          <tr>
            <td class="photo-cell">
              <div class="photo-placeholder">👤</div>
            </td>
            <td class="info-cell">
              <table class="info-table" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="label-col">Nama</td>
                  <td class="colon-col">:</td>
                  <td class="value-col">${memberName}</td>
                </tr>
                <tr>
                  <td class="label-col">NIS</td>
                  <td class="colon-col">:</td>
                  <td class="value-col">${memberId}</td>
                </tr>
                <tr>
                  <td class="label-col">No. Anggota</td>
                  <td class="colon-col">:</td>
                  <td class="value-col">${memberId}</td>
                </tr>
                <tr>
                  <td class="label-col">Berlaku s/d</td>
                  <td class="colon-col">:</td>
                  <td class="value-col">${validityDate}</td>
                </tr>
              </table>
            </td>
            <td class="qr-cell">
              ${qrCodeUrl ? `<img src="${qrCodeUrl}" class="qr-image" />` : `<div style="width:1.6cm;height:1.6cm;background-color:#ffffff;border-radius:4px;"></div>`}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td colspan="3" style="padding: 0;">
              <table class="footer-table" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="badge-cell">
                    BACA &bull; PELAJARI &bull; PAHAMI<br/>
                    <span class="badge-text-gold">GAPAI MASA DEPAN GEMILANG</span>
                  </td>
                  <td class="motto-cell">
                    Membaca adalah jendela dunia,<br/>
                    <span class="motto-gold">ilmu adalah kuncinya.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kartu_Anggota_${memberName.replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!activeMember) return;
    setIsDownloading(true);
    const element = document.getElementById("printable-library-card");
    if (!element) {
      setIsDownloading(false);
      return;
    }

    try {
      // Create a high-quality snapshot of the card element using dom-to-image-more
      // We pass scale: 3 to ensure extremely high resolution crisp rendering
      const dataUrl = await domtoimage.toPng(element, {
        quality: 1.0,
        scale: 3,
        style: {
          // ensure the card renders properly during screenshot
          contentVisibility: "visible"
        }
      });

      // Custom Landscape PDF sized precisely to match physical standard ID cards: 85.6mm x 54mm
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54]
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 85.6, 54);
      pdf.save(`Kartu_Anggota_${activeMember.name.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Gagal mengunduh PDF kartu:", error);
      alert("Gagal mengunduh PDF kartu anggota. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-800 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>KARTU</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-ping"></span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
            {identity.libraryName} • {identity.schoolName}
          </p>
        </div>
      </div>

      {/* Banner Instruction & Dual Download/Print Action buttons */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 print:hidden">
        <div className="space-y-1.5 flex-1">
          <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
            <span>Simpan Kartu Anggota</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Simpan kartu anggota Anda langsung sebagai berkas <strong className="text-emerald-400">PDF berkualitas tinggi</strong> atau berkas <strong className="text-amber-400">Word (.doc)</strong> untuk kemudahan pengarsipan dan pencetakan instan. Ukuran kartu didesain presisi sesuai standar internasional <strong className="text-slate-300">8.56cm x 5.4cm</strong>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 flex-shrink-0">
          <button
            onClick={handleDownloadPDF}
            disabled={!activeMember || isDownloading}
            className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? "Memproses PDF..." : "Simpan PDF"}</span>
          </button>
          <button
            onClick={handleDownloadWord}
            disabled={!activeMember}
            className="flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Simpan Word</span>
          </button>
        </div>
      </div>

      {/* Selector Container */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800/80 shadow-sm space-y-4 print:hidden">
        <div className="space-y-1.5 max-w-md">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pilih Pratinjau Anggota
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-200 cursor-pointer"
          >
            {members.length === 0 ? (
              <option value="">Tidak ada anggota terdaftar</option>
            ) : (
              members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.name} - {m.id}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Renders the School Card Mockup */}
      {activeMember ? (
        <div className="flex justify-center py-6 print:py-0 print:m-0">
          {/* Print container with CSS utilities to center it perfectly on page when printed */}
          <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800/85 flex items-center justify-center print:bg-transparent print:p-0 print:border-none">
            
            {/* The Actual ID Card */}
            <div 
              id="printable-library-card"
              className="w-[450px] h-[285px] rounded-[24px] bg-[#003820] text-white flex flex-col justify-between relative shadow-2xl overflow-hidden border border-[rgba(6,95,70,0.3)] select-none print:shadow-none print:border-none"
              style={{ contentVisibility: "auto" }}
            >
              {/* Dynamic SVG Background Decor - Multi-layer Curves, Concentric Circles & Gold Accent Waves */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 450 285" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Upper Left Light White/Cream Curved Panel */}
                <path d="M-10 -10 H 118 L 82 102 C 72 132 58 145 18 165 C -2 175 -10 185 -10 185 Z" fill="#f4faf6" />
                {/* Vibrant Emerald outline swoop */}
                <path d="M 118 -10 L 82 102 C 72 132 58 145 18 165 C -2 175 -10 185 -10 185" stroke="#00a862" strokeWidth="5" />
                {/* Shiny Golden highlight swoop */}
                <path d="M 115 -10 L 79 100 C 69 130 55 143 15 163" stroke="#fbc02d" strokeWidth="2.2" />
                
                {/* Lower background curvy shape (emerald) */}
                <path d="M-10 205 C 30 205 110 230 160 260 C 180 272 200 280 340 280 L 460 280 L 460 295 L -10 295 Z" fill="#0c633c" />
                <path d="M-10 205 C 30 205 110 230 160 260 C 180 272 200 280 340 280" stroke="#00a862" strokeWidth="3.5" />
                
                {/* Elegant subtle concentric rings on right side */}
                <circle cx="450" cy="142" r="120" stroke="#015231" strokeWidth="1.5" opacity="0.35" />
                <circle cx="450" cy="142" r="150" stroke="#015231" strokeWidth="1.5" opacity="0.3" />
                <circle cx="450" cy="142" r="180" stroke="#015231" strokeWidth="1.2" opacity="0.25" />
              </svg>

              {/* Dotted mesh grid decoration on top-right */}
              <div className="absolute right-4 top-4 flex flex-col space-y-1 opacity-15 z-0">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex space-x-1">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="w-[3px] h-[3px] rounded-full bg-[#a7f3d0]"></div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Upper Left School Logo Shield (Absolute Overlaid Container) */}
              <div className="absolute left-3 top-3 w-[88px] h-[92px] flex flex-col items-center justify-between py-1 px-0.5 z-10">
                <span className="text-[5px] font-black text-[#064e3b] tracking-tighter leading-none text-center truncate max-w-[84px] uppercase font-sans">
                  {identity.schoolName}
                </span>
                
                {/* Super-high-fidelity dynamic vector school crest */}
                {identity.logo && identity.logo.startsWith("data:") ? (
                  <div className="w-[54px] h-[54px] bg-white rounded-full p-1 flex items-center justify-center overflow-hidden drop-shadow-sm">
                    <img src={identity.logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <LibraryLogo className="drop-shadow-sm" size={54} variant="colored" />
                )}

                <span className="text-[5px] font-bold bg-[#ffd700] border border-[rgba(245,158,11,0.3)] text-[#0f172a] px-1 py-[1.5px] rounded-[3px] tracking-tight leading-none text-center truncate max-w-[84px] uppercase font-mono">
                  {identity.libraryName}
                </span>
              </div>

              {/* Photo Slot Placeholder with crisp curved double borders */}
              <div className="absolute left-[13px] top-[110px] p-[3px] bg-white rounded-[20px] border border-[rgba(16,185,129,0.2)] shadow-md z-10">
                <div className="w-[66px] h-[88px] bg-[#002e1c] rounded-[16px] flex items-center justify-center overflow-hidden">
                  <svg className="w-10 h-10 text-[#257d54]" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Header Details (Logo & Library/School Title Center Aligned) */}
              <div className="absolute left-[125px] top-[10px] right-4 flex flex-col items-center justify-center text-center z-10">
                {/* Gold Crest Sprout coming out of an open book */}
                <svg className="w-4.5 h-4.5 text-amber-400 mb-0.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 65 C30 55 45 58 50 63 C55 58 70 55 85 65 L85 30 C70 20 55 23 50 28 C45 23 30 20 15 30 Z" fill="none" stroke="#fbc02d" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M50 28 L50 63" stroke="#fbc02d" strokeWidth="4.5" />
                  <path d="M50 32 C50 22 55 18 62 18 C58 24 53 28 50 32 Z" fill="#fbc02d" />
                  <path d="M50 35 C50 25 45 21 38 21 C42 27 47 31 50 35 Z" fill="#fbc02d" />
                  <path d="M50 20 C50 12 53 8 50 4 C47 8 50 12 50 20 Z" fill="#fbc02d" />
                </svg>

                {/* KARTU ANGGOTA Label */}
                <div className="text-[7.5px] font-black tracking-[0.25em] text-amber-400 uppercase mb-0.5 font-sans drop-shadow-sm block leading-normal whitespace-nowrap">
                  KARTU ANGGOTA
                </div>

                {/* Library Title */}
                <h2 className="text-[13px] leading-tight tracking-wide text-white uppercase drop-shadow-sm font-black font-serif">
                  {(() => {
                    const words = identity.libraryName.split(" ");
                    if (words.length >= 3) {
                      return (
                        <span>
                          {words[0]} <span className="text-amber-400 font-extrabold">{words[1]}</span> {words.slice(2).join(" ")}
                        </span>
                      );
                    } else if (words.length === 2) {
                      return (
                        <span>
                          {words[0]} <span className="text-amber-400 font-extrabold">{words[1]}</span>
                        </span>
                      );
                    }
                    return <span className="text-amber-400 font-extrabold">{identity.libraryName}</span>;
                  })()}
                </h2>

                {/* School Name Subtitle */}
                <p className="text-[8.5px] leading-normal font-bold text-[#e2e8f0] uppercase tracking-widest mt-0.5">
                  {identity.schoolName}
                </p>

                {/* Fancy horizontal line separator with circle divider */}
                <div className="flex items-center justify-center mt-1 mb-1.5 w-full max-w-[260px] mx-auto opacity-75">
                  <div className="h-[0.8px] bg-[rgba(251,191,36,0.5)] flex-1"></div>
                  <div className="w-[4.5px] h-[4.5px] rounded-full bg-[#fbbf24] mx-1.5"></div>
                  <div className="h-[0.8px] bg-[rgba(251,191,36,0.5)] flex-1"></div>
                </div>
              </div>

              {/* Center Fields Layout */}
              <div className="absolute left-[110px] top-[106px] right-[132px] space-y-1 z-10 font-sans">
                {[
                  { label: "Nama", value: activeMember.name },
                  { label: "NIS", value: activeMember.id },
                  { label: "Kelas", value: activeClass ? activeClass.name : "Umum" },
                  { label: "No. Anggota", value: activeMember.id },
                  { label: "Berlaku s/d", value: formatIndonesianDate(calculateExpiryDate(activeMember.registerDate, 3)) },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center text-[9.5px]">
                    <span className="w-[58px] font-extrabold text-[#f1f5f9] uppercase tracking-wider">{item.label}</span>
                    <span className="mr-2 text-[#fcd34d] font-bold">:</span>
                    <div className="flex-1 relative min-w-0">
                      <span className="font-extrabold text-white tracking-wide truncate block max-w-[130px] pr-1">
                        {item.value}
                      </span>
                      {/* Underline for exact line aesthetic */}
                      <div className="absolute left-0 right-0 -bottom-[1px] h-[0.5px] bg-[rgba(255,255,255,0.2)]"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Side Book Column Scene & QR Code with Motto */}
              <div className="absolute right-4 top-[84px] w-[114px] flex flex-col items-end space-y-3 z-10">
                
                {/* Micro standing books on golden shelf scene */}
                <div className="w-[105px] h-[34px] relative pointer-events-none flex items-end justify-end space-x-1 pr-1.5">
                  {/* Potted Plant */}
                  <div className="flex flex-col items-center mr-1.5">
                    {/* SVG Leaves */}
                    <svg className="w-4.5 h-4.5 text-[#34d399]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C11.5 5 9 7 9 10C9 11.7 10.3 13 12 13C13.7 13 15 11.7 15 10C15 7 12.5 5 12 2Z" />
                      <path d="M12 6C12.5 9 15 11 15 13C15 14.3 13.9 15 12 15C10.1 15 9 14.3 9 13C9 11 11.5 9 12 6Z" opacity="0.8" />
                    </svg>
                    {/* Tiny Pot */}
                    <div className="w-[15px] h-[11px] bg-[#f1f5f9] border border-[#cbd5e1] rounded-b-sm shadow-sm flex items-center justify-center">
                      <div className="w-[1px] h-1.5 bg-[#34d399]"></div>
                    </div>
                  </div>
                  
                  {/* Standing Books */}
                  <div className="flex items-end space-x-0.5 pb-[1.5px]">
                    {/* Light Green Book */}
                    <div className="w-2.5 h-[24px] bg-[#8bc34a] rounded-[2px] transform -rotate-[10deg] border border-[rgba(5,150,105,0.2)] shadow-sm flex flex-col justify-between p-[0.5px]">
                      <div className="h-[1.5px] bg-[rgba(255,255,255,0.5)] rounded-full"></div>
                      <div className="h-[1.5px] bg-[rgba(255,255,255,0.5)] rounded-full"></div>
                    </div>
                    {/* White Spine Book */}
                    <div className="w-1.8 h-[27px] bg-[#fdfdfd] rounded-[2px] transform -rotate-[5deg] border border-[#e2e8f0] shadow-sm flex flex-col justify-between p-[0.5px]">
                      <div className="h-full w-[0.8px] bg-[#cbd5e1] mx-auto"></div>
                    </div>
                    {/* Dark Green Book */}
                    <div className="w-2.2 h-[29px] bg-[#1a5a22] rounded-[2px] border border-[rgba(2,44,34,0.4)] shadow-sm flex flex-col justify-between p-[0.5px]">
                      <div className="h-[1.5px] bg-[rgba(252,211,77,0.6)] rounded-full"></div>
                      <div className="h-[1.5px] bg-[rgba(252,211,77,0.6)] rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Gold shelf line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#fbbf24] rounded-full shadow-sm"></div>
                </div>

                {/* QR Code Container Badge */}
                <div className="w-[60px] h-[60px] bg-white p-[3px] rounded-[11px] shadow-lg border border-[rgba(226,232,240,0.5)] flex items-center justify-center mr-1">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-full h-full object-contain rounded-[8px]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded-[8px] animate-pulse" />
                  )}
                </div>

              </div>

              {/* Motto Script at the bottom-right corner */}
              <div className="absolute right-4 bottom-4 text-right z-10 pointer-events-none flex flex-col items-end">
                <p className="text-[7px] text-[#d1fae5] font-sans italic leading-none opacity-95">
                  Membaca adalah jendela dunia,
                </p>
                <div className="text-[7.5px] font-bold text-[#fcd34d] italic leading-none mt-1 relative inline-block">
                  ilmu <span className="text-white">adalah kuncinya.</span>
                  {/* Decorative underline */}
                  <svg className="absolute -bottom-[2.5px] left-0 w-full h-[2.5px] text-amber-400" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0,2 Q50,8 100,2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Bottom Left Custom Pill Badge (BACA • PELAJARI • PAHAMI) */}
              <div className="absolute left-[13px] bottom-3.5 bg-[#002414] border border-[rgba(16,185,129,0.2)] rounded-[10px] px-2 py-1 z-10 flex items-center space-x-1.5 shadow-sm pointer-events-none">
                <div className="w-4 h-4 rounded-full bg-[#065f46] flex items-center justify-center text-white flex-shrink-0 border border-[rgba(16,185,129,0.3)]">
                  <svg className="w-2.2 h-2.2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[5px] font-black tracking-wider text-[#f1f5f9] uppercase leading-none">
                    BACA • PELAJARI • PAHAMI
                  </span>
                  <span className="text-[5px] font-black tracking-wider text-[#fcd34d] uppercase leading-none mt-[1.5px]">
                    GAPAI MASA DEPAN GEMILANG
                  </span>
                </div>
              </div>

              {/* Overlapping Barcode Bottom Center Badge */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white rounded-t-[14px] px-5 pt-2 pb-1.5 flex flex-col items-center border-t-2 border-x border-amber-500/30 shadow-lg z-10">
                <div className="flex space-x-[1px] items-stretch h-[22px]">
                  {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 2, 1].map((weight, index) => (
                    <div 
                      key={index} 
                      className="bg-slate-950" 
                      style={{ width: `${weight * 1.05}px` }}
                    ></div>
                  ))}
                </div>
                <span className="text-[7.5px] font-bold text-slate-800 font-mono tracking-[0.18em] mt-1.5">
                  {activeMember.id}
                </span>
              </div>

              {/* Ambient shine gradient overlay on card hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(255,255,255,0)] via-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0)] transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
            </div>

          </div>
        </div>
      ) : (
        <div className="p-10 text-center text-slate-400 text-sm">
          Harap tambahkan data anggota terlebih dahulu sebelum mencetak kartu.
        </div>
      )}

      {/* CSS rules specifically for printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-library-card, #printable-library-card * {
            visibility: visible;
          }
          #printable-library-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(1.3);
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}

import React from "react";

interface LibraryLogoProps {
  className?: string;
  size?: number | string;
  variant?: "transparent" | "white" | "colored";
}

export default function LibraryLogo({ 
  className = "", 
  size = "100%", 
  variant = "colored" 
}: LibraryLogoProps) {
  // We can design a highly-detailed vector SVG reproducing the original logo perfectly.
  // Using paths and curved text paths for the texts.
  
  const outerCircleBg = variant === "transparent" ? "transparent" : "#ffffff";
  const textColorTop = "#059669"; // Emerald 600
  const textColorBottom = "#d97706"; // Amber 600 / Yellow

  return (
    <svg 
      className={`select-none ${className}`}
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="95" fill={outerCircleBg} />
      
      {/* Outer Borders */}
      <circle cx="100" cy="100" r="95" stroke="#15803d" strokeWidth="3" />
      <circle cx="100" cy="100" r="91" stroke="#15803d" strokeWidth="1" opacity="0.6" />
      <circle cx="100" cy="100" r="70" stroke="#15803d" strokeWidth="1.5" />

      {/* Invisible Paths for Curved Text */}
      {/* Top Semi-circle path (clockwise) */}
      <path 
        id="logo-text-path-top" 
        d="M 26 100 A 74 74 0 1 1 174 100" 
        fill="none" 
      />
      {/* Bottom Semi-circle path (clockwise, so text is upright but we adjust rotation, or we can use another path) */}
      {/* For bottom text to be upright along the bottom arc, the path must run from right to left or we can use a reverse arc. */}
      {/* If we start at left (26, 100) and go to right (174, 100) with sweep-flag=0 (counter-clockwise/upside down): */}
      <path 
        id="logo-text-path-bottom" 
        d="M 174 100 A 74 74 0 0 1 26 100" 
        fill="none" 
      />

      {/* Top Text: SMP NEGERI 26 */}
      <text fill={textColorTop} className="font-extrabold text-[12.5px] tracking-[0.06em] font-sans">
        <textPath 
          href="#logo-text-path-top" 
          startOffset="50%" 
          textAnchor="middle"
        >
          SMP NEGERI 26
        </textPath>
      </text>

      {/* Bottom Text: KARSA CENDEKIA PUSTAKA */}
      <text fill={textColorBottom} className="font-extrabold text-[11px] tracking-[0.02em] font-sans">
        <textPath 
          href="#logo-text-path-bottom" 
          startOffset="50%" 
          textAnchor="middle"
        >
          KARSA CENDEKIA PUSTAKA
        </textPath>
      </text>

      {/* Center Group */}
      <g transform="translate(100, 100) scale(0.95)">
        {/* Yellow Laurel/Wings Emblem */}
        {/* Left Wing */}
        <path 
          d="M -5 -5 
             C -20 -35, -45 -35, -40 5 
             C -35 25, -15 35, -5 38 
             C -15 28, -25 15, -20 -5 
             C -15 -20, -5 -15, -5 -5 Z" 
          fill="#f59e0b" 
          stroke="#b45309" 
          strokeWidth="1" 
        />
        <path 
          d="M -15 -15 
             C -35 -45, -55 -25, -45 10 
             C -40 25, -25 35, -10 40 
             C -20 30, -32 15, -25 -5 
             C -20 -20, -10 -15, -15 -15 Z" 
          fill="#fbbf24" 
          stroke="#b45309" 
          strokeWidth="1" 
          opacity="0.9"
        />

        {/* Right Wing */}
        <path 
          d="M 5 -5 
             C 20 -35, 45 -35, 40 5 
             C 35 25, 15 35, 5 38 
             C 15 28, 25 15, 20 -5 
             C 15 -20, 5 -15, 5 -5 Z" 
          fill="#f59e0b" 
          stroke="#b45309" 
          strokeWidth="1" 
        />
        <path 
          d="M 15 -15 
             C 35 -45, 55 -25, 45 10 
             C 40 25, 25 35, 10 40 
             C 20 30, 32 15, 25 -5 
             C 20 -20, 10 -15, 15 -15 Z" 
          fill="#fbbf24" 
          stroke="#b45309" 
          strokeWidth="1" 
          opacity="0.9"
        />

        {/* Open Book in the Center */}
        <g transform="translate(0, 0)">
          {/* Book Background shadow/outlines */}
          <path 
            d="M -24 -15 Q -12 -20 0 -13 Q 12 -20 24 -15 L 24 15 Q 12 10 0 17 Q -12 10 -24 15 Z" 
            fill="#ffffff" 
            stroke="#1e293b" 
            strokeWidth="2" 
            strokeLinejoin="round" 
          />
          {/* Middle dividing line */}
          <line x1="0" y1="-12" x2="0" y2="17" stroke="#1e293b" strokeWidth="2" />
          
          {/* Left Pages Lines */}
          <line x1="-18" y1="-10" x2="-6" y2="-12" stroke="#475569" strokeWidth="1" />
          <line x1="-18" y1="-5" x2="-6" y2="-7" stroke="#475569" strokeWidth="1" />
          <line x1="-18" y1="0" x2="-6" y2="-2" stroke="#475569" strokeWidth="1" />
          <line x1="-18" y1="5" x2="-6" y2="3" stroke="#475569" strokeWidth="1" />
          
          {/* Right Pages Lines */}
          <line x1="6" y1="-12" x2="18" y2="-10" stroke="#475569" strokeWidth="1" />
          <line x1="6" y1="-7" x2="18" y2="-5" stroke="#475569" strokeWidth="1" />
          <line x1="6" y1="-2" x2="18" y2="0" stroke="#475569" strokeWidth="1" />
          <line x1="6" y1="3" x2="18" y2="5" stroke="#475569" strokeWidth="1" />
        </g>

        {/* Interlocking Rings above the book */}
        <g transform="translate(0, -26) scale(0.7)">
          {/* Chain/audi rings */}
          <circle cx="-15" cy="0" r="7" stroke="#1e293b" strokeWidth="1.5" fill="none" />
          <circle cx="-5" cy="0" r="7" stroke="#1e293b" strokeWidth="1.5" fill="none" />
          <circle cx="5" cy="0" r="7" stroke="#1e293b" strokeWidth="1.5" fill="none" />
          <circle cx="15" cy="0" r="7" stroke="#1e293b" strokeWidth="1.5" fill="none" />
        </g>

        {/* Pen Nib / Flame Below the book */}
        <g transform="translate(0, 24)">
          {/* Golden Torch / Pen tip */}
          <path d="M -3 -8 L 3 -8 L 1 5 L 0 10 L -1 5 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
          {/* Glowing dot */}
          <circle cx="0" cy="-1" r="2.5" fill="#ef4444" />
        </g>

        {/* Ribbon banner at the bottom saying "PURWOREJO" */}
        <g transform="translate(0, 38)">
          {/* Ribbon background folds */}
          <path d="M -38 0 L -28 -5 L -28 7 L -38 12 Z" fill="#047857" stroke="#064e3b" strokeWidth="1" />
          <path d="M 38 0 L 28 -5 L 28 7 L 38 12 Z" fill="#047857" stroke="#064e3b" strokeWidth="1" />
          
          {/* Main Ribbon Center */}
          <path 
            d="M -30 -6 L 30 -6 L 26 8 L -26 8 Z" 
            fill="#10b981" 
            stroke="#047857" 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
          />
          {/* Ribbon Gold border accents */}
          <path d="M -29 -4 L 29 -4" stroke="#fcd34d" strokeWidth="0.8" />
          <path d="M -25 6 L 25 6" stroke="#fcd34d" strokeWidth="0.8" />
          
          {/* Ribbon Text */}
          <text 
            x="0" 
            y="3" 
            fill="#ffffff" 
            fontSize="7" 
            fontWeight="bold" 
            textAnchor="middle" 
            fontFamily="sans-serif" 
            letterSpacing="0.08em"
            className="font-black"
          >
            PURWOREJO
          </text>
        </g>
      </g>

      {/* Decorative small circles on left and right */}
      <circle cx="34" cy="118" r="2.5" fill="#15803d" />
      <circle cx="166" cy="118" r="2.5" fill="#15803d" />
    </svg>
  );
}

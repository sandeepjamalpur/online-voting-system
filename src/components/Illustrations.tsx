import React from 'react';

// ============================================================================
// VOTER STUDENT ILLUSTRATION (Matching Uploaded Image in "Voters" Card)
// Cheerful college student with backpack holding up a ballot paper with checkmark
// ============================================================================
export const VoterStudentIllustration: React.FC<{ className?: string }> = ({
  className = 'w-48 h-48',
}) => (
  <svg
    viewBox="0 0 260 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Student voter holding up ballot paper"
  >
    <defs>
      {/* Soft halo behind student */}
      <radialGradient id="voterHalo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1E5C49" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#0B3B2C" stopOpacity="0" />
      </radialGradient>

      {/* Skin tone gradients */}
      <linearGradient id="voterSkin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F5BE9E" />
        <stop offset="100%" stopColor="#E2A17E" />
      </linearGradient>
      <linearGradient id="voterSkinShadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D58E6B" />
        <stop offset="100%" stopColor="#C47955" />
      </linearGradient>

      {/* Hoodie gradient (Warm Sage/Olive Green) */}
      <linearGradient id="hoodieGreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#558471" />
        <stop offset="100%" stopColor="#3C6454" />
      </linearGradient>

      {/* Hair gradient (Rich Dark Brown/Black) */}
      <linearGradient id="hairDark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2D231E" />
        <stop offset="100%" stopColor="#17120E" />
      </linearGradient>

      {/* Card subtle shadow */}
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
      </filter>
    </defs>

    {/* Soft subtle green glow behind character */}
    <circle cx="130" cy="130" r="110" fill="url(#voterHalo)" />

    {/* Backpack body behind shoulders */}
    <path
      d="M58 175 C52 205 54 240 60 255 L85 255 L80 180 Z"
      fill="#1A202C"
    />
    <path
      d="M202 175 C208 205 206 240 200 255 L175 255 L180 180 Z"
      fill="#1A202C"
    />

    {/* Body / Torso (Olive green hoodie) */}
    <path
      d="M72 255 L78 185 C80 152 98 140 130 140 C162 140 180 152 182 185 L188 255 Z"
      fill="url(#hoodieGreen)"
    />

    {/* Backpack Straps over chest */}
    <path
      d="M84 165 C80 185 78 220 80 255"
      stroke="#1A202C"
      strokeWidth="11"
      strokeLinecap="round"
    />
    <path
      d="M176 165 C180 185 182 220 180 255"
      stroke="#1A202C"
      strokeWidth="11"
      strokeLinecap="round"
    />

    {/* Inner White T-Shirt Collar */}
    <path
      d="M112 140 C114 152 122 158 130 158 C138 158 146 152 148 140 Z"
      fill="#FFFFFF"
    />

    {/* Hoodie Collar Fold & Seam */}
    <path
      d="M106 140 C112 156 120 164 130 164 C140 164 148 156 154 140 C162 144 168 152 170 165 C164 170 150 174 130 174 C110 174 96 170 90 165 C92 152 98 144 106 140 Z"
      fill="#365C4C"
    />
    {/* Hoodie Strings */}
    <path d="M122 163 L120 190" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
    <path d="M138 163 L140 190" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
    <circle cx="120" cy="191" r="2" fill="#E2E8F0" />
    <circle cx="140" cy="191" r="2" fill="#E2E8F0" />

    {/* Neck */}
    <path d="M116 120 L116 144 C116 150 144 150 144 144 L144 120 Z" fill="url(#voterSkin)" />
    {/* Neck shadow under jaw */}
    <path d="M116 120 C122 130 138 130 144 120 C140 126 120 126 116 120 Z" fill="url(#voterSkinShadow)" />

    {/* Head (Friendly proportions) */}
    <ellipse cx="130" cy="98" rx="27" ry="32" fill="url(#voterSkin)" />

    {/* Ears */}
    <path d="M103 94 C100 94 98 100 100 106 C102 110 105 110 106 106 Z" fill="url(#voterSkin)" />
    <path d="M157 94 C160 94 162 100 160 106 C158 110 155 110 154 106 Z" fill="url(#voterSkin)" />
    <path d="M102 100 C101 102 102 104 104 104" stroke="url(#voterSkinShadow)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M158 100 C159 102 158 104 156 104" stroke="url(#voterSkinShadow)" strokeWidth="1.5" strokeLinecap="round" />

    {/* Cheerful Eyes */}
    <ellipse cx="120" cy="95" rx="3.5" ry="4.5" fill="#1A202C" />
    <circle cx="121.5" cy="93.5" r="1.5" fill="#FFFFFF" />

    <ellipse cx="140" cy="95" rx="3.5" ry="4.5" fill="#1A202C" />
    <circle cx="141.5" cy="93.5" r="1.5" fill="#FFFFFF" />

    {/* Eyebrows */}
    <path d="M114 88 C118 85 124 87 125 88" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M146 88 C142 85 136 87 135 88" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" />

    {/* Nose */}
    <path d="M129 97 C128 103 129 106 132 106" stroke="#C47955" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Big Warm Open Smile with White Teeth */}
    <path
      d="M120 112 C120 122 140 122 140 112 Z"
      fill="#991B1B"
    />
    <path
      d="M122 112 C125 116 135 116 138 112 Z"
      fill="#FFFFFF"
    />

    {/* Cheeks soft blush */}
    <circle cx="112" cy="104" r="5" fill="#F43F5E" fillOpacity="0.2" />
    <circle cx="148" cy="104" r="5" fill="#F43F5E" fillOpacity="0.2" />

    {/* Hair (Modern voluminous wavy styled hair with front wave) */}
    <path
      d="M103 94 C100 82 104 68 115 62 C128 55 145 56 154 64 C162 71 161 84 158 92 C155 88 150 82 144 80 C134 77 126 80 120 84 C114 87 108 92 103 94 Z"
      fill="url(#hairDark)"
    />
    <path
      d="M110 68 C120 60 135 58 145 64 C140 62 128 62 118 67 Z"
      fill="#4A3728"
    />

    {/* Left arm relaxed at side */}
    <path
      d="M178 180 C186 200 190 230 188 255"
      stroke="#3C6454"
      strokeWidth="15"
      strokeLinecap="round"
    />

    {/* Right Arm raised holding Ballot Paper */}
    <path
      d="M84 180 L62 146 C58 140 60 130 68 132 L84 140"
      stroke="#3C6454"
      strokeWidth="15"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right Hand / Fingers gripping paper */}
    <ellipse cx="64" cy="132" rx="8" ry="9" fill="url(#voterSkin)" />
    <ellipse cx="60" cy="130" rx="3.5" ry="5" fill="url(#voterSkinShadow)" />
    <ellipse cx="64" cy="128" rx="3.5" ry="5" fill="url(#voterSkinShadow)" />
    <ellipse cx="68" cy="129" rx="3.5" ry="5" fill="url(#voterSkinShadow)" />

    {/* OFFICIAL BALLOT PAPER HELD HIGH */}
    <g transform="rotate(-6 56 95)" filter="url(#cardShadow)">
      {/* Paper Card */}
      <rect
        x="30"
        y="60"
        width="54"
        height="68"
        rx="8"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      {/* Top green header line */}
      <rect x="36" y="66" width="42" height="3" rx="1.5" fill="#E2E8F0" />

      {/* "VOTE" bold typography */}
      <text
        x="57"
        y="83"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="#0B3B2C"
        fontFamily="sans-serif"
        letterSpacing="1"
      >
        VOTE
      </text>

      {/* Green circular verification badge with white checkmark */}
      <circle cx="57" cy="103" r="13" fill="#10B981" />
      <path
        d="M51.5 103 L55.5 107 L62.5 99.5"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

// ============================================================================
// ADMIN OFFICER ILLUSTRATION (Matching Uploaded Image in "Admin" Card)
// Professional young commissioner in smart suit & glasses holding digital tablet
// ============================================================================
export const AdminOfficerIllustration: React.FC<{ className?: string }> = ({
  className = 'w-48 h-48',
}) => (
  <svg
    viewBox="0 0 260 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Admin officer in suit holding analytics tablet"
  >
    <defs>
      {/* Soft circular background glow */}
      <circle id="adminBg" cx="130" cy="130" r="110" fill="#F8FAFC" />

      {/* Skin tone */}
      <linearGradient id="adminSkin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F9D2B8" />
        <stop offset="100%" stopColor="#E9B698" />
      </linearGradient>

      {/* Dark Suit Jacket */}
      <linearGradient id="suitDark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2D3748" />
        <stop offset="100%" stopColor="#1A202C" />
      </linearGradient>

      {/* Floating badge shadow */}
      <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.08" />
      </filter>
    </defs>

    {/* Background Soft Glow */}
    <circle cx="130" cy="130" r="105" fill="#F1F5F9" />

    {/* FLOATING 3D ANALYTICS BADGE (Top Right - exactly like Mockup) */}
    <g transform="translate(182, 60)" filter="url(#badgeShadow)">
      <rect width="36" height="36" rx="10" fill="#E8F5E9" stroke="#C8E6C9" strokeWidth="1.5" />
      {/* 3 Ascending Green Bar Charts */}
      <rect x="8" y="21" width="4.5" height="9" rx="1.5" fill="#10B981" />
      <rect x="15.5" y="14" width="4.5" height="16" rx="1.5" fill="#059669" />
      <rect x="23" y="8" width="4.5" height="22" rx="1.5" fill="#0B3B2C" />
    </g>

    {/* Body / Tailored Suit Jacket */}
    <path
      d="M74 255 L80 180 C82 152 98 142 130 142 C162 142 178 152 180 180 L186 255 Z"
      fill="url(#suitDark)"
    />

    {/* Crisp White Shirt V-Front */}
    <path d="M116 142 L130 184 L144 142 Z" fill="#FFFFFF" />

    {/* Pointed Shirt Collars */}
    <path d="M114 142 L128 156 L124 142 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
    <path d="M146 142 L132 156 L136 142 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />

    {/* Forest Green Corporate Tie */}
    <path
      d="M127 150 L133 150 L136 195 L130 202 L124 195 Z"
      fill="#0B3B2C"
    />

    {/* Suit Lapels */}
    <path d="M96 150 L118 190 L112 195 L88 156 Z" fill="#1A202C" />
    <path d="M164 150 L142 190 L148 195 L172 156 Z" fill="#1A202C" />

    {/* Neck */}
    <path d="M118 122 L118 144 C118 150 142 150 142 144 L142 122 Z" fill="url(#adminSkin)" />

    {/* Head */}
    <ellipse cx="130" cy="98" rx="26" ry="31" fill="url(#adminSkin)" />

    {/* Ears */}
    <ellipse cx="104" cy="98" rx="4" ry="7" fill="url(#adminSkin)" />
    <ellipse cx="156" cy="98" rx="4" ry="7" fill="url(#adminSkin)" />

    {/* Glasses (Modern Round Dark Rims - exactly like Mockup) */}
    <rect x="110" y="88" width="16" height="15" rx="5" stroke="#1A202C" strokeWidth="2.5" fill="#E0F2FE" fillOpacity="0.3" />
    <rect x="134" y="88" width="16" height="15" rx="5" stroke="#1A202C" strokeWidth="2.5" fill="#E0F2FE" fillOpacity="0.3" />
    {/* Glasses Bridge */}
    <path d="M126 94 C128 92 132 92 134 94" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Glasses Arms to Ears */}
    <line x1="106" y1="92" x2="110" y2="94" stroke="#1A202C" strokeWidth="2" strokeLinecap="round" />
    <line x1="150" y1="94" x2="154" y2="92" stroke="#1A202C" strokeWidth="2" strokeLinecap="round" />

    {/* Eyes behind lenses */}
    <circle cx="118" cy="95.5" r="2.5" fill="#1A202C" />
    <circle cx="119" cy="94.5" r="0.8" fill="#FFFFFF" />

    <circle cx="142" cy="95.5" r="2.5" fill="#1A202C" />
    <circle cx="143" cy="94.5" r="0.8" fill="#FFFFFF" />

    {/* Eyebrows */}
    <path d="M112 84 C116 82 122 83 124 85" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M148 84 C144 82 138 83 136 85" stroke="#1A202C" strokeWidth="2.5" strokeLinecap="round" />

    {/* Nose */}
    <path d="M129 97 C128 103 129 105 132 105" stroke="#D58E6B" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Confident Friendly Smile */}
    <path
      d="M122 112 C126 117 134 117 138 112"
      stroke="#1A202C"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />

    {/* Neat Side-Parted Dark Hair */}
    <path
      d="M104 94 C102 78 108 64 122 62 C138 60 154 66 156 82 C156 88 152 90 148 84 C142 74 132 72 120 74 C112 76 106 84 104 94 Z"
      fill="#1A202C"
    />

    {/* Arms holding the Digital Tablet */}
    <path
      d="M84 184 L114 200"
      stroke="#1A202C"
      strokeWidth="16"
      strokeLinecap="round"
    />
    <path
      d="M176 184 L146 200"
      stroke="#1A202C"
      strokeWidth="16"
      strokeLinecap="round"
    />

    {/* DIGITAL TABLET WITH LIVE ANALYTICS (Held in front) */}
    <g transform="rotate(3 140 190)" filter="url(#badgeShadow)">
      {/* Tablet Bezel */}
      <rect
        x="108"
        y="160"
        width="68"
        height="50"
        rx="7"
        fill="#0F172A"
        stroke="#334155"
        strokeWidth="2"
      />
      {/* Tablet Glass Screen */}
      <rect
        x="112"
        y="164"
        width="60"
        height="42"
        rx="4"
        fill="#FFFFFF"
      />

      {/* Screen Chart Header Line */}
      <rect x="116" y="169" width="24" height="2" rx="1" fill="#E2E8F0" />

      {/* Live Analytics Green Bars */}
      <rect x="118" y="190" width="6" height="12" rx="2" fill="#10B981" />
      <rect x="127" y="180" width="6" height="22" rx="2" fill="#059669" />
      <rect x="136" y="174" width="6" height="28" rx="2" fill="#0B3B2C" />
      <rect x="145" y="184" width="6" height="18" rx="2" fill="#10B981" />
      <rect x="154" y="178" width="6" height="24" rx="2" fill="#059669" />
      <rect x="163" y="186" width="3" height="16" rx="1.5" fill="#10B981" />

      {/* Hands holding the sides of the tablet */}
      <ellipse cx="109" cy="185" rx="5" ry="9" fill="url(#adminSkin)" />
      <ellipse cx="175" cy="190" rx="5" ry="9" fill="url(#adminSkin)" />
    </g>
  </svg>
);

// ============================================================================
// CELEBRATION PARTY HORN / CONFETTI BADGE (Matching Screen 5)
// ============================================================================
export const CelebrationHornIllustration: React.FC<{ className?: string }> = ({
  className = 'w-20 h-20',
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Success Party Horn"
  >
    {/* Outer circle */}
    <circle cx="50" cy="50" r="46" fill="#0B3B2C" />
    <circle cx="50" cy="50" r="40" fill="#10B981" fillOpacity="0.25" />

    {/* Party Horn */}
    <path
      d="M32 64 L54 44 L60 50 L40 70 Z"
      fill="#F59E0B"
      stroke="#D97706"
      strokeWidth="2"
    />
    <ellipse
      cx="57"
      cy="47"
      rx="5"
      ry="9"
      transform="rotate(-45 57 47)"
      fill="#FEF3C7"
      stroke="#F59E0B"
      strokeWidth="2"
    />
    <path
      d="M32 64 C28 68 24 67 22 65"
      stroke="#D97706"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />

    {/* Confetti Sparks */}
    <circle cx="68" cy="34" r="2.5" fill="#FEF08A" />
    <circle cx="76" cy="42" r="2" fill="#38BDF8" />
    <circle cx="62" cy="24" r="2" fill="#F472B6" />
    <rect x="70" y="24" width="3" height="6" rx="1.5" transform="rotate(25 70 24)" fill="#34D399" />
    <rect x="52" y="20" width="3" height="5" rx="1" transform="rotate(-30 52 20)" fill="#FBBF24" />
    <rect x="78" y="52" width="3" height="6" rx="1" transform="rotate(45 78 52)" fill="#A78BFA" />

    {/* Sparkle Star */}
    <path
      d="M72 16 L73.5 20 L77.5 21.5 L73.5 23 L72 27 L70.5 23 L66.5 21.5 L70.5 20 Z"
      fill="#FDE047"
    />
  </svg>
);

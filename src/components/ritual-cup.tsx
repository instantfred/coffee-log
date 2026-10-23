/** Decorative vector artwork: no downloaded assets or client-side rendering. */
export function RitualCup() {
  return (
    <svg viewBox="0 0 220 230" fill="none" aria-hidden="true" className="ritual-cup h-auto w-full overflow-visible">
      <defs>
        <linearGradient id="ritual-ceramic" x1="47" y1="98" x2="169" y2="171" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF8E9" /><stop offset=".5" stopColor="#EED5B7" /><stop offset="1" stopColor="#BB9373" /></linearGradient>
        <linearGradient id="ritual-saucer" x1="39" y1="143" x2="173" y2="196" gradientUnits="userSpaceOnUse"><stop stopColor="#EAD3B5" /><stop offset="1" stopColor="#9D7155" /></linearGradient>
        <radialGradient id="ritual-coffee"><stop stopColor="#9C6240" /><stop offset="1" stopColor="#3F231A" /></radialGradient>
        <filter id="ritual-shadow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <ellipse cx="113" cy="192" rx="79" ry="17" fill="#130D09" opacity=".45" filter="url(#ritual-shadow)" />
      <ellipse cx="105" cy="171" rx="88" ry="33" fill="url(#ritual-saucer)" />
      <ellipse cx="105" cy="166" rx="87" ry="30" fill="#EFDBC0" />
      <ellipse cx="105" cy="166" rx="65" ry="21" stroke="#B99574" strokeOpacity=".5" />
      <path d="M166 110C206 98 207 157 166 151" stroke="#AE8262" strokeWidth="14" />
      <path d="M166 106C199 101 200 148 170 147" stroke="#F1DCC1" strokeWidth="9" />
      <path d="M43 98C43 98 44 139 52 151C70 179 141 180 158 150C166 137 169 98 169 98H43Z" fill="url(#ritual-ceramic)" />
      <path d="M51 114C53 145 60 154 75 160" stroke="#FFF9EA" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="106" cy="98" rx="63" ry="26" fill="#FFF1DB" />
      <ellipse cx="106" cy="99" rx="55" ry="20" fill="url(#ritual-coffee)" />
      <ellipse cx="106" cy="99" rx="52" ry="18" stroke="#C69762" strokeOpacity=".6" strokeWidth="2" />
      <path d="M106 110C95 104 78 99 85 92C92 86 104 94 106 98C110 88 125 87 129 93C133 101 116 105 106 110Z" fill="#EAC99A" />
      <path d="M107 110L105 95" stroke="#885334" strokeWidth="1.5" strokeLinecap="round" />
      <g stroke="#F9DFC2" strokeWidth="3" strokeLinecap="round" opacity=".65">
        <path className="steam" d="M83 65C72 53 94 48 83 34" />
        <path className="steam steam-late" d="M107 61C95 45 120 38 108 20" />
        <path className="steam" d="M131 67C122 55 142 49 132 37" />
      </g>
      <g transform="translate(171 185) rotate(-25)"><ellipse rx="8" ry="12" fill="#382118" /><path d="M0-9C-5-3 5 3 0 9" stroke="#A6724C" strokeWidth="1.5" /></g>
      <g transform="translate(187 175) rotate(24)"><ellipse rx="7" ry="10" fill="#4D2D1E" /><path d="M0-7C-4-2 4 2 0 7" stroke="#AD7850" strokeWidth="1.5" /></g>
    </svg>
  );
}

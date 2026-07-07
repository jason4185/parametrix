type ParametricShieldProps = {
  className?: string;
};

export function ParametricShield({ className = "" }: ParametricShieldProps) {
  return (
    <svg
      aria-hidden="true"
      className={["h-auto w-full max-w-[520px]", className]
        .filter(Boolean)
        .join(" ")}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 540 560"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="parametrixRadarFill" cx="50%" cy="44%" r="58%">
          <stop stopColor="#00E5FF" stopOpacity="0.1" />
          <stop offset="0.52" stopColor="#7DD3FC" stopOpacity="0.04" />
          <stop offset="1" stopColor="#071013" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="parametrixFrameStroke" x1="74" x2="462" y1="76" y2="503">
          <stop stopColor="#00E5FF" />
          <stop offset="0.48" stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#FFB020" />
        </linearGradient>
        <linearGradient id="parametrixThreshold" x1="94" x2="452" y1="282" y2="282">
          <stop stopColor="#00E5FF" />
          <stop offset="0.52" stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#FFB020" />
        </linearGradient>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="560"
          id="parametrixGlow"
          width="540"
          x="0"
          y="0"
        >
          <feGaussianBlur result="blur" stdDeviation="5" />
          <feColorMatrix
            in="blur"
            result="glow"
            values="0 0 0 0 0 0 0 0 0 0.9 0 0 0 0 1 0 0 0 0.25 0"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>{`
        .pmx-radar-pulse {
          animation: pmxRadarPulse 6.5s ease-in-out infinite;
          transform-origin: 270px 248px;
        }

        .pmx-radar-pulse-delayed {
          animation: pmxRadarPulse 6.5s ease-in-out 1.6s infinite;
          transform-origin: 270px 248px;
        }

        .pmx-data-dot {
          animation: pmxDataFloat 4.8s ease-in-out infinite;
        }

        .pmx-data-dot-delayed {
          animation-delay: 1.2s;
        }

        .pmx-threshold {
          animation: pmxThresholdGlow 3.8s ease-in-out infinite;
        }

        @keyframes pmxRadarPulse {
          0%, 100% {
            opacity: 0.34;
            transform: scale(0.98);
          }

          50% {
            opacity: 0.48;
            transform: scale(1.025);
          }
        }

        @keyframes pmxDataFloat {
          0%, 100% {
            opacity: 0.44;
            transform: translateY(0);
          }

          50% {
            opacity: 0.78;
            transform: translateY(-7px);
          }
        }

        @keyframes pmxThresholdGlow {
          0%, 100% {
            opacity: 0.72;
            filter: drop-shadow(0 0 8px rgba(255, 176, 32, 0.12));
          }

          50% {
            opacity: 1;
            filter: drop-shadow(0 0 18px rgba(0, 229, 255, 0.16));
          }
        }
      `}</style>

      <g opacity="0.72">
        <path
          d="M86 190C156 152 230 142 304 164"
          stroke="#00E5FF"
          strokeDasharray="2 14"
          strokeLinecap="round"
          strokeOpacity="0.25"
          strokeWidth="2"
        />
        <path
          d="M98 342C182 306 300 304 438 338"
          stroke="#7DD3FC"
          strokeDasharray="2 16"
          strokeLinecap="round"
          strokeOpacity="0.22"
          strokeWidth="2"
        />
        <path
          d="M132 414C211 382 300 378 394 408"
          stroke="#FFB020"
          strokeDasharray="2 18"
          strokeLinecap="round"
          strokeOpacity="0.18"
          strokeWidth="2"
        />
        <path
          d="M74 248H464M102 150H428M118 456H390M176 96V488M270 76V514M374 122V438"
          stroke="#00E5FF"
          strokeOpacity="0.08"
          strokeWidth="1"
        />
      </g>

      <g filter="url(#parametrixGlow)">
        <path
          d="M254 34C315 61 389 71 450 125L428 272C414 371 352 454 258 520C163 466 104 379 87 266L72 119C123 94 181 57 254 34Z"
          fill="rgba(0, 229, 255, 0.12)"
          stroke="url(#parametrixFrameStroke)"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path
          d="M116 134C159 116 209 88 259 70C307 91 368 100 416 140L398 268C385 348 336 416 258 474C180 427 132 356 118 262L104 146C108 142 112 138 116 134Z"
          fill="url(#parametrixRadarFill)"
          stroke="#00E5FF"
          strokeOpacity="0.18"
          strokeWidth="2"
        />

        <g className="pmx-radar-pulse" opacity="0.48">
          <circle cx="270" cy="248" r="62" stroke="#00E5FF" strokeWidth="2.5" />
          <circle
            cx="270"
            cy="248"
            r="108"
            stroke="#7DD3FC"
            strokeDasharray="10 13"
            strokeWidth="2.5"
          />
        </g>
        <g className="pmx-radar-pulse-delayed" opacity="0.38">
          <circle
            cx="270"
            cy="248"
            r="150"
            stroke="#FFB020"
            strokeDasharray="3 18"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <circle
            cx="270"
            cy="248"
            r="190"
            stroke="#00E5FF"
            strokeDasharray="1 22"
            strokeLinecap="round"
            strokeOpacity="0.32"
            strokeWidth="2"
          />
        </g>

        <path
          d="M94 282C132 282 149 258 181 264C213 270 214 304 246 306C283 308 292 256 330 258C366 260 375 291 405 288C425 286 437 278 452 278"
          className="pmx-threshold"
          stroke="url(#parametrixThreshold)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="7"
        />
        <path
          d="M94 282H452"
          stroke="#F8FAFC"
          strokeLinecap="round"
          strokeDasharray="5 18"
          strokeOpacity="0.16"
          strokeWidth="2"
        />

        <g className="pmx-data-dot">
          <circle cx="160" cy="212" fill="#00E5FF" r="5" />
          <circle cx="160" cy="212" r="14" stroke="#00E5FF" strokeOpacity="0.28" />
        </g>
        <g className="pmx-data-dot pmx-data-dot-delayed">
          <circle cx="372" cy="182" fill="#FFB020" r="5" />
          <circle cx="372" cy="182" r="15" stroke="#FFB020" strokeOpacity="0.18" />
        </g>
        <g className="pmx-data-dot" style={{ animationDelay: "2s" }}>
          <circle cx="395" cy="326" fill="#7DD3FC" r="5" />
          <circle cx="395" cy="326" r="13" stroke="#7DD3FC" strokeOpacity="0.26" />
        </g>
        <g className="pmx-data-dot" style={{ animationDelay: "2.8s" }}>
          <circle cx="204" cy="372" fill="#FFB020" r="5" />
          <circle cx="204" cy="372" r="13" stroke="#FFB020" strokeOpacity="0.26" />
        </g>

        <g transform="translate(178 166)">
          <path
            d="M35 3C47 21 61 36 61 53C61 70.7 49.4 82 35 82C20.6 82 9 70.7 9 53C9 36 23 21 35 3Z"
            fill="#00E5FF"
            fillOpacity="0.13"
            stroke="#00E5FF"
            strokeWidth="3"
          />
          <path
            d="M27 57C32 63 42 63 48 56"
            stroke="#7DD3FC"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </g>

        <g transform="translate(328 154)">
          <path
            d="M30 9C22.3 9 16 15.3 16 23V56C8.9 61 5 68.2 5 77C5 91.4 16.6 103 31 103C45.4 103 57 91.4 57 77C57 68 52.9 60.6 46 56V23C46 15.3 39.7 9 32 9H30Z"
            fill="#FFB020"
            fillOpacity="0.12"
            stroke="#FFB020"
            strokeWidth="3"
          />
          <path
            d="M31 29V76"
            stroke="#FFB020"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <circle cx="31" cy="78" fill="#FFB020" r="10" />
          <path
            d="M46 31H56M46 45H52"
            stroke="#FFB020"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </g>

        <g transform="translate(224 374)">
          <circle
            cx="56"
            cy="56"
            fill="#071013"
            fillOpacity="0.7"
            r="48"
            stroke="#FFB020"
            strokeWidth="4"
          />
          <circle
            cx="56"
            cy="56"
            r="35"
            stroke="#7DD3FC"
            strokeDasharray="6 9"
            strokeOpacity="0.28"
            strokeWidth="2.5"
          />
          <text
            fill="#FFB020"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontSize="18"
            fontWeight="700"
            textAnchor="middle"
            x="56"
            y="51"
          >
            GEN
          </text>
          <path
            d="M39 66H73"
            stroke="#00E5FF"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M47 76H65"
            stroke="#00E5FF"
            strokeLinecap="round"
            strokeOpacity="0.38"
            strokeWidth="3"
          />
        </g>

        <path
          d="M139 405C183 438 218 454 258 474C314 436 350 392 373 340"
          stroke="#7DD3FC"
          strokeLinecap="round"
          strokeOpacity="0.2"
          strokeWidth="3"
        />
        <path
          d="M145 118C176 104 213 86 258 70"
          stroke="#FFB020"
          strokeLinecap="round"
          strokeOpacity="0.2"
          strokeWidth="3"
        />
        <path
          d="M270 120V248L351 306"
          stroke="#00E5FF"
          strokeLinecap="round"
          strokeOpacity="0.24"
          strokeWidth="2.5"
        />
        <circle cx="270" cy="248" fill="#00E5FF" r="7" />
      </g>
    </svg>
  );
}

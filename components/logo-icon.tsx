/**
 * TourneyUp logo mark — uses the actual SVG path data from Logo.svg.
 * fill="currentColor" makes it fully theme-aware (light / dark mode).
 *
 * Usage:
 *   <LogoIcon className="h-10 w-10 text-foreground" />
 */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 399"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Original path from Logo.svg, flipped via transform to match upright orientation */}
      <g transform="translate(0,399) scale(0.1,-0.1)">
        <path d="M2855 3979 c-225 -32 -481 -175 -618 -346 -110 -136 -167 -248 -209
-408 -21 -76 -22 -107 -25 -652 l-4 -573 -529 0 c-560 0 -628 -4 -765 -47
-335 -105 -585 -370 -677 -718 -21 -76 -22 -107 -25 -657 l-4 -578 530 0 c561
0 629 4 766 47 335 105 585 370 677 718 21 76 22 107 25 653 l4 572 529 0
c560 0 628 4 765 47 335 105 585 370 677 718 21 76 22 107 25 658 l4 577 -543
-1 c-299 -1 -570 -5 -603 -10z m-508 -1180 c120 -37 200 -86 294 -179 73 -73
94 -101 132 -180 44 -91 77 -212 77 -280 l0 -30 -350 0 -350 0 0 351 0 352 65
-7 c35 -4 95 -16 132 -27z m-497 -1289 l0 -350 -30 0 c-71 0 -189 33 -280 77
-79 39 -109 60 -180 132 -122 122 -187 258 -205 424 l-7 67 351 0 351 0 0
-350z"/>
      </g>
    </svg>
  )
}

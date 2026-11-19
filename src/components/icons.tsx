/**
 * CoQuest's own flat, colourful icon set, drawn to sit where the Figma kit places its
 * illustrated icons (navigation, stat bar, shop). All artwork here is original.
 */
import type { ReactNode } from 'react'

interface IconProps { size?: number; className?: string; muted?: boolean }

const svg = (size: number, className: string | undefined, children: ReactNode) => (
  <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">{children}</svg>
)

export function LearnIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <path d="M6 15h20v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#FFC800" />
    <path d="M16 4.2 3.4 14.6a1.6 1.6 0 0 0 2 2.5L16 8.6l10.6 8.5a1.6 1.6 0 0 0 2-2.5z" fill="#FF4B4B" />
    <circle cx="16" cy="19" r="3" fill="#A56644" />
    <rect x="14.6" y="20" width="2.8" height="5" rx="1.2" fill="#A56644" />
  </>)
}

export function PracticeIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <rect x="3" y="5" width="26" height="22" rx="5" fill="#2470E8" />
    <rect x="3" y="5" width="26" height="6" rx="3" fill="#1D5FD1" />
    <path d="m10 16 4 3.5-4 3.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M17 23h5.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
  </>)
}

export function LeagueIcon({ size = 32, className, color = '#FFC800' }: IconProps & { color?: string }) {
  return svg(size, className, <>
    <path d="M6 6.5A2.5 2.5 0 0 1 8.5 4h15A2.5 2.5 0 0 1 26 6.5V16c0 6.2-4.6 10.4-10 12-5.4-1.6-10-5.8-10-12z" fill={color} />
    <path d="M16 4h7.5A2.5 2.5 0 0 1 26 6.5V16c0 6.2-4.6 10.4-10 12z" fill="#000" opacity="0.12" />
    <path d="M10 9.5 21 20" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.55" />
  </>)
}

export function QuestsIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <rect x="4" y="13" width="24" height="14" rx="3" fill="#B66E28" />
    <path d="M4 13a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v2H4z" fill="#FFC800" />
    <rect x="4" y="13.5" width="24" height="3" fill="#E5A400" />
    <rect x="13" y="12" width="6" height="8" rx="2" fill="#FFE27A" />
    <circle cx="16" cy="15.6" r="1.4" fill="#B66E28" />
  </>)
}

export function DuelIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <path d="M6 5h4l14 14-3 3L7 8z" fill="#CE82FF" />
    <path d="M26 5h-4L8 19l3 3L25 8z" fill="#A568CC" />
    <rect x="4" y="21" width="9" height="3.4" rx="1.7" transform="rotate(-45 8.5 22.7)" fill="#777" />
    <rect x="19" y="21" width="9" height="3.4" rx="1.7" transform="rotate(45 23.5 22.7)" fill="#777" />
  </>)
}

export function ShopIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <rect x="5" y="14" width="22" height="13" rx="2.5" fill="#B66E28" />
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h19A2.5 2.5 0 0 1 28 7.5V13a4 4 0 0 1-8 0 4 4 0 0 1-8 0 4 4 0 0 1-8 0z" fill="#FF4B4B" />
    <path d="M12 5h8v8a4 4 0 0 1-8 0z" fill="#fff" />
    <rect x="9" y="19" width="6" height="8" rx="1.2" fill="#84D8FF" />
    <rect x="18" y="19" width="5.5" height="4.5" rx="1.2" fill="#84D8FF" />
  </>)
}

export function MoreIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <circle cx="16" cy="16" r="12" fill="#2470E8" />
    <circle cx="10.5" cy="16" r="2" fill="#fff" /><circle cx="16" cy="16" r="2" fill="#fff" /><circle cx="21.5" cy="16" r="2" fill="#fff" />
  </>)
}

export function FlameIcon({ size = 24, className, muted = false }: IconProps) {
  return svg(size, className, <>
    <path d="M16 3c1 4.5 8 8 8 15.5A8.3 8.3 0 0 1 16 27a8.3 8.3 0 0 1-8-8.5c0-3 1.4-5.2 3-7 .6 1.6 1.4 2.6 2.6 3.2C13.2 10.600 14 6.500 16 3z" fill={muted ? '#E5E5E5' : '#FF9600'} />
    <path d="M16 15.500c2 2 3.600 3.500 3.600 5.700a3.600 3.600 0 0 1-7.200 0c0-2.200 1.600-3.700 3.600-5.700z" fill={muted ? '#fff' : '#FFC800'} />
  </>)
}

export function GemIcon({ size = 24, className }: IconProps) {
  return svg(size, className, <>
    <path d="M16 3 27 9.500v13L16 29 5 22.500v-13z" fill="#1CB0F6" />
    <path d="M16 3 27 9.500 16 16 5 9.500z" fill="#84D8FF" />
    <path d="M16 16v13L5 22.500v-13z" fill="#1899D6" />
  </>)
}

export function BoltIcon({ size = 24, className }: IconProps) {
  return svg(size, className, <path d="M18.500 3 7 18h7l-1.500 11L25 13.500h-7.300z" fill="#FFC800" stroke="#E5A400" strokeWidth="1.2" strokeLinejoin="round" />)
}

export function FreezeIcon({ size = 56, className }: IconProps) {
  return svg(size, className, <>
    <path d="M9 5h14l5 9-4 15-4-5-4 5-4-5-4 5-3-15z" fill="#84D8FF" />
    <path d="M9 5h14l-3 9H12z" fill="#DDF4FF" />
    <path d="M16 12c2.200 2.700 4 4.600 4 7a4 4 0 0 1-8 0c0-2.400 1.800-4.300 4-7z" fill="#1CB0F6" />
  </>)
}

export function WagerIcon({ size = 56, className }: IconProps) {
  return svg(size, className, <>
    <rect x="4" y="7" width="24" height="22" rx="4" fill="#FF9600" />
    <rect x="6.500" y="13" width="19" height="13.500" rx="2" fill="#fff" />
    <rect x="4" y="7" width="24" height="7" rx="3.500" fill="#FF4B4B" />
    <rect x="9.500" y="4" width="3" height="6.500" rx="1.500" fill="#fff" /><rect x="19.500" y="4" width="3" height="6.500" rx="1.500" fill="#fff" />
    <path d="M12.500 16.500h7l-4 8" stroke="#FF4B4B" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </>)
}

export function ChestIcon({ size = 40, className, open = false }: IconProps & { open?: boolean }) {
  return svg(size, className, <>
    <rect x="4" y="14" width="24" height="13" rx="3" fill={open ? '#B66E28' : '#C98A5A'} />
    <path d="M4 14a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v2H4z" fill={open ? '#FFC800' : '#D9A57C'} transform={open ? 'rotate(-14 6 14)' : undefined} />
    <rect x="13.500" y="13" width="5" height="7" rx="1.800" fill={open ? '#FFE27A' : '#F1D2B5'} />
  </>)
}

export function MedalIcon({ size = 24, className }: IconProps) {
  return svg(size, className, <>
    <path d="M10 3h5l2 9h-5zM22 3h-5l-2 9h5z" fill="#AFAFAF" />
    <circle cx="16" cy="19" r="9" fill="#E5E5E5" />
    <circle cx="16" cy="19" r="5.500" fill="#F7F7F7" />
  </>)
}

/** The Rewards tab: a blue and gold treasure chest. */
export function RewardsIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <rect x="4" y="14" width="24" height="13" rx="3" fill="#2470E8" />
    <path d="M4 14a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v2H4z" fill="#7FB8FF" />
    <rect x="4" y="14.5" width="24" height="2.6" fill="#FFC800" />
    <rect x="13.2" y="12.5" width="5.6" height="8" rx="2" fill="#FFC800" />
    <circle cx="16" cy="16.4" r="1.3" fill="#1D5FD1" />
  </>)
}

/** The Daily Puzzle: a jigsaw piece. */
export function PuzzleIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <path d="M6 9a2 2 0 0 1 2-2h5a3 3 0 1 1 6 0h5a2 2 0 0 1 2 2v5a3 3 0 1 0 0 6v5a2 2 0 0 1-2 2h-5a3 3 0 1 0-6 0H8a2 2 0 0 1-2-2v-5a3 3 0 1 1 0-6z" fill="#19B8F0" />
    <path d="M6 9a2 2 0 0 1 2-2h5a3 3 0 1 1 6 0h5a2 2 0 0 1 2 2v3H6z" fill="#9FD0FF" />
  </>)
}

/** The glossary: an open book. */
export function BookIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <path d="M3 8c4.5-1.8 9-1.5 13 1v17c-4-2.5-8.5-2.8-13-1z" fill="#2470E8" />
    <path d="M29 8c-4.5-1.8-9-1.5-13 1v17c4-2.5 8.5-2.8 13-1z" fill="#7FB8FF" />
    <path d="M6 12c2.5-.7 5-.5 7 .5M6 16c2.5-.7 5-.5 7 .5M19 12.5c2-1 4.5-1.2 7-.5M19 16.5c2-1 4.5-1.2 7-.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
  </>)
}

/** Profile tab, for players without a picture. */
export function ProfileIcon({ size = 32, className }: IconProps) {
  return svg(size, className, <>
    <circle cx="16" cy="11" r="6" fill="#2470E8" />
    <path d="M5 27a11 9 0 0 1 22 0z" fill="#7FB8FF" />
  </>)
}

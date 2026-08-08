// src/lib/fonts.ts

import {
  Inter,
  Plus_Jakarta_Sans,
  Manrope,
  Outfit,
  DM_Sans,
  Geist,
  JetBrains_Mono,
} from 'next/font/google';

/* ============================================================================
   BODY FONT
   Uncomment ONLY ONE font at a time
============================================================================ */

// ✅ Default (Currently Active)
// export const fontSans = Plus_Jakarta_Sans({
//   subsets: ["latin"],
//   variable: "--font-sans",
//   display: "swap",
//   weight: ["300", "400", "500", "600", "700", "800"],
// });

// // ⭐ Option 2 - Inter (Clean & Professional)
// export const fontSans = Inter({
//   subsets: ["latin"],
//   variable: "--font-sans",
//   display: "swap",
//   weight: ["300", "400", "500", "600", "700"],
// });

// // ⭐ Option 3 - Manrope (Premium SaaS)
// export const fontSans = Manrope({
//   subsets: ["latin"],
//   variable: "--font-sans",
//   display: "swap",
//   weight: ["300", "400", "500", "600", "700", "800"],
// });

// // ⭐ Option 4 - Outfit (Modern & Rounded)
// export const fontSans = Outfit({
//   subsets: ["latin"],
//   variable: "--font-sans",
//   display: "swap",
//   weight: ["300", "400", "500", "600", "700"],
// });

/*
// ⭐ Option 5 - DM Sans (Minimal & Elegant)
export const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});
*/

// ⭐ Option 6 - Geist (Vercel Style)
export const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

/* ============================================================================
   HEADING FONT
============================================================================ */

export const fontHeading = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

/* ============================================================================
   MONOSPACE FONT
============================================================================ */

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

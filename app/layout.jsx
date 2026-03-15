import "./globals.css";
import { Toaster } from 'sonner';

export const metadata = {
  title: "Ramadhan VibeTracker",
  description:
    "Platform pelacakan ibadah Ramadan terintegrasi — dibangun dengan Vibe Coding & diuji oleh TestSprite AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display antialiased">
        {children}
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}

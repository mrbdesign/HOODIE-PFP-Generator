import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OnchainKitClientProvider from "./OnchainKitClientProvider"; // Import the client provider

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  /* ...your metadata here... */
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <head>
        {/* ...meta tags... */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <OnchainKitClientProvider>
          {children}
        </OnchainKitClientProvider>
        {/* Footer */}
        <footer className="text-center text-sm text-gray-600 pt-0 pb-[25px] mt-0">
          <a href="https://www.mrbriandesign.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@mrbriandesign</a>
          <div className="mt-2 text-xs" style={{ color: '#CCFF00' }}>
            <span style={{ color: '#FF69B4' }}>tip:</span> <a href="ethereum:0x66AB779a9802021fEC2d5635c0503c9D63D5ed58" className="hover:underline" style={{ color: '#CCFF00' }}>0x66AB779a9802021fEC2d5635c0503c9D63D5ed58</a>
          </div>
        </footer>
      </body>
    </html>
  );
}

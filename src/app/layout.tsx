import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import TokenBubble from "@/components/TokenBubble";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Velzia Obsidian - Premium Experience",
  description: "Gestión de nivel superior para restauranteros que valoran la eficiencia y el control absoluto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="es"
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col text-white">
          {children}
          <TokenBubble />
        </body>
      </html>
    </ClerkProvider>
  );
}

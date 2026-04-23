import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import TokenBubble from "@/components/TokenBubble";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Velzia AI Scanner",
  description: "High-end expense tracking powered by AI",
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
        className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
        style={{ colorScheme: 'dark' }}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30">
          <div className="flex-1 flex flex-col relative z-10 transition-colors duration-500">
            {children}
          </div>
          <TokenBubble />
        </body>
      </html>
    </ClerkProvider>
  );
}

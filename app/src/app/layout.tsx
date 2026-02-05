import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SolanaProviders } from "./providers"; // Import our new wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anchorage Bridge Dashboard",
  description: "Institutional Solana Bridge",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaProviders>
          {children}
        </SolanaProviders>
      </body>
    </html>
  );
}
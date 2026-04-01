import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Great Phones API",
  description: "Backend API for Great Phones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-[var(--cream)] text-[var(--dk)]">
        {children}
      </body>
    </html>
  );
}

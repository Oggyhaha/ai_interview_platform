import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});



import RobotCompanion from "@/components/RobotCompanion";

export const metadata: Metadata = {
  title: "PrepYou",
  description: "An AI-powered platform for preparing for mock interviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${monaSans.className} antialiased fancy-bg min-h-screen relative`}
        suppressHydrationWarning
      >
        {children}
        <RobotCompanion />
        <Toaster />
      </body>
    </html>
  );
}

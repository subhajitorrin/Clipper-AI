import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clipper AI — Short-form Vertical Video Generator",
  description: "Turn long-form videos into engaging short-form vertical clips automatically.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#090909] text-white selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}

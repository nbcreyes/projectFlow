import { Plus_Jakarta_Sans } from "next/font/google";
import SessionProvider from "@/components/layouts/SessionProvider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: {
    default: "ProjectFlow",
    template: "%s | ProjectFlow",
  },
  description: "A warm and collaborative project management tool.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
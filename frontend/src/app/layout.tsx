import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { cn } from "@/lib/utils";
import AuthSync from "@/components/auth/AuthSync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eventic — Go from Idea to Live Event in Minutes",
  description:
    "The AI-powered event management ecosystem for visionaries. Orchestrate seamless digital and physical experiences with tranquil precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark font-sans", inter.variable, spaceGrotesk.variable)}
    >
      <body className="antialiased bg-surface text-white min-h-screen">
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#c1d949",
              colorBackground: "#111111",
              colorInputBackground: "#1a1a1a",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "#9ca3af",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "bg-surface-raised border border-white/10 shadow-2xl",
              headerTitle: "text-white font-bold",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton:
                "bg-white/5 border-white/10 hover:bg-white/10 text-white",
              formButtonPrimary:
                "bg-lime hover:bg-lime-light text-olive-dark font-semibold",
              footerActionLink: "text-lime hover:text-lime-light",
              formFieldInput:
                "bg-white/5 border-white/10 text-white placeholder:text-gray-500",
              dividerLine: "bg-white/10",
              dividerText: "text-gray-500",
            },
          }}
        >
          <AuthSync />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

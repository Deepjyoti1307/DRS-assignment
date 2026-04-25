import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string };
}) {
  const redirectUrl = searchParams?.redirect_url || "/dashboard";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-4 py-20">
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 gradient-mesh animate-mesh opacity-30" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-lime/10 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-lime/5 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* ── Top Navigation ── */}
      <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-50">
        <Link href="/" className="flex items-center gap-3 group transition-all duration-500">
          <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <img src="/logo.png" alt="Eventic Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(193,217,73,0.4)]" />
          </div>
          <span className="font-heading font-black text-2xl tracking-tighter text-white">
            Eventic
          </span>
        </Link>
        
        <Link
          href="/"
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all duration-300 px-5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>

      {/* ── Clerk Sign Up Component ── */}
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="glass-card-premium rounded-[2.5rem] p-2 sm:p-4">
          <SignUp
            forceRedirectUrl={redirectUrl}
            fallbackRedirectUrl={redirectUrl}
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-transparent shadow-none border-none",
                headerTitle: "text-white font-black text-2xl tracking-tight",
                headerSubtitle: "text-white/40 font-medium",
                socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all duration-300 rounded-xl py-3",
                formButtonPrimary: "bg-lime hover:bg-white text-olive-dark font-black uppercase tracking-widest text-[10px] py-4 rounded-xl transition-all duration-500 shadow-[0_10px_20px_rgba(193,217,73,0.2)] hover:shadow-[0_15px_30px_rgba(193,217,73,0.4)]",
                footerActionLink: "text-lime hover:text-white font-bold transition-colors",
                formFieldInput: "bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl py-3 px-4",
                formFieldLabel: "text-white/60 font-bold uppercase tracking-widest text-[9px] mb-2",
                dividerLine: "bg-white/10",
                dividerText: "text-white/20 font-bold uppercase tracking-[0.2em] text-[8px]",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

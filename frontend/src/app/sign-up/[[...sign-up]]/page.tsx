import { SignUp } from "@clerk/nextjs";

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string };
}) {
  const redirectUrl = searchParams?.redirect_url || "/dashboard";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      {/* ── Background Effects ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-olive/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-lime/5 rounded-full blur-[120px]" />
      </div>

      {/* ── Back to Home Link ── */}
      <a
        href="/"
        className="absolute top-6 left-6 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 z-10"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to home
      </a>

      {/* ── Clerk Sign Up Component ── */}
      <div className="relative z-10">
        <SignUp
          forceRedirectUrl={redirectUrl}
          fallbackRedirectUrl={redirectUrl}
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-surface-raised/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl",
            },
          }}
        />
      </div>
    </div>
  );
}

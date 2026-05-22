import { SignIn } from "@clerk/nextjs";

interface PageProps {
  searchParams: Promise<{ redirect_url?: string; email?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectUrl = params.redirect_url || '/dashboard';

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505]">
      <SignIn 
        redirectUrl={redirectUrl}
        appearance={{
          elements: {
            formFieldInput: 'bg-white/5 border-white/10 text-white',
            formButtonPrimary: 'bg-orange-500 hover:bg-orange-600',
            footerAction: 'hidden',
          },
        }}
      />
    </div>
  );
}

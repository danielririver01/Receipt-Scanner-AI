import { SignIn } from "@clerk/nextjs";

const FLASK_REGISTER_URL = process.env.NEXT_PUBLIC_FLASK_REGISTER_URL || 'http://localhost:5000/register';

interface PageProps {
  searchParams: Promise<{ redirect_url?: string; email?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectUrl = params.redirect_url || '/dashboard';
  const email = params.email;

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505]">
      <div className="flex flex-col items-center gap-6">
        <SignIn 
          redirectUrl={redirectUrl}
          appearance={{
            elements: {
              formFieldInput: 'bg-white/5 border-white/10 text-white',
              formButtonPrimary: 'bg-orange-500 hover:bg-orange-600',
              footerAction: 'hidden',
            },
          }}
          {...(email ? { initialValues: { identifier: email } } : {})}
        />
        <p className="text-sm text-gray-400">
          No tienes una cuenta?{' '}
          <a
            href={FLASK_REGISTER_URL}
            className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
          >
            Registrarse
          </a>
        </p>
      </div>
    </div>
  );
}

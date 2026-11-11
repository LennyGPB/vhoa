import { LiquidBlob } from '@/components/LiquidBlob';
import { Logo } from '@/components/Logo';

import { LoginForm } from './LoginForm';

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-16">
      <div className="relative w-full max-w-[420px]">
        {/* Goutte qui dépasse du panneau, derrière le verre. */}
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-16 w-48 sm:-right-20 sm:w-56">
          <LiquidBlob speed={0.7} intensity={1.6} seed={3} />
        </div>

        <div className="glass-frame relative overflow-hidden rounded-[32px] p-8 sm:p-10">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_30%_0%,rgb(74_168_255/0.2),transparent)]"
          />
          <div className="relative">
            <Logo height={34} />
            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Espace admin</p>
            <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-tight">Connexion</h1>
            <p className="mt-2 text-[15px] text-muted">Accès réservé. Entre le mot de passe administrateur.</p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

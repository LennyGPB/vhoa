import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin',
  // Jamais indexé par les moteurs de recherche.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="relative isolate min-h-svh overflow-x-clip">
      {/* Lueurs bleues derrière le verre, comme sur le site. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <span className="soft-blob -left-40 -top-40 size-[620px]" />
        <span
          className="soft-blob -bottom-60 -right-40 size-[680px]"
          style={{ ['--dx' as string]: '-60px', ['--dy' as string]: '-40px', ['--dur' as string]: '18s' }}
        />
      </div>
      {children}
    </div>
  );
}

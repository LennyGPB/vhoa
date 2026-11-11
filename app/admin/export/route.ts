import { requireAdmin } from '@/lib/admin-auth';
import { allEntries } from '@/lib/admin-data';

/** Cellule CSV : guillemets échappés, et neutralise les formules (=, +, -, @) à l'ouverture dans Excel. */
function cell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** Export complet de la liste d'attente (CSV « ; » + BOM, lisible directement par Excel en français). */
export async function GET() {
  await requireAdmin();
  const rows = await allEntries();
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' });

  const lines = [
    ['Email', 'Plateforme', 'Inscription', 'Mise à jour'].map(cell).join(';'),
    ...rows.map((row) =>
      [
        row.email,
        row.platform === 'IOS' ? 'iPhone' : 'Android',
        date.format(new Date(row.createdAt)),
        date.format(new Date(row.updatedAt)),
      ]
        .map(cell)
        .join(';'),
    ),
  ];
  const day = new Date().toISOString().slice(0, 10);

  return new Response(`﻿${lines.join('\r\n')}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="vhoa-liste-attente-${day}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

import { NextResponse, type NextRequest } from 'next/server';

const USER = 'vhoa_user';
const REFRESH_MAX_AGE = 60 * 24 * 3600;

/**
 * Aiguillage rapide selon la présence d'une session (cookie de renouvellement) :
 * - connecté → pas besoin des pages d'inscription / connexion, direction le feed ;
 * - visiteur → le profil et les alertes demandent un compte, direction la connexion.
 * Simple confort de navigation : les droits sont vérifiés par l'API à chaque action.
 */
export function proxy(request: NextRequest) {
  const member = request.cookies.has('vhoa_rt');
  const { pathname } = request.nextUrl;

  // Seulement les navigations : les appels internes de la page (Server Actions, en POST)
  // doivent recevoir leur réponse, pas une redirection vers une autre page.
  if (request.method !== 'GET') return NextResponse.next();

  if (member && (pathname === '/inscription' || pathname === '/connexion')) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }
  if (!member && (pathname === '/profil' || pathname.startsWith('/profil/') || pathname === '/coach' || pathname === '/premium/merci' || pathname === '/alertes' || pathname.startsWith('/analyse/'))) {
    return NextResponse.redirect(new URL('/connexion', request.url));
  }
  // Prendre la parole demande un compte : inscription d'abord, puis retour sur Créer.
  if (!member && pathname === '/creer') {
    // Arrivé par le coach : on le retrouve après l'inscription.
    const next = request.nextUrl.searchParams.get('coach') === '1' ? '/creer?coach=1' : '/creer';
    return NextResponse.redirect(new URL(`/inscription?next=${encodeURIComponent(next)}`, request.url));
  }

  const res = NextResponse.next();
  // Sessions ouvertes avant le 17/11/2026 : leur cookie d'affichage était illisible par la page,
  // qui affichait « Se connecter » à un membre. On le repose au bon format (lisible, même valeur).
  const shown = request.cookies.get(USER)?.value;
  if (member && shown) {
    res.cookies.set(USER, shown, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_MAX_AGE,
    });
  }
  return res;
}

export const config = {
  // Toutes les pages, sauf les fichiers techniques et statiques.
  matcher: ['/((?!_next/|api/|favicon.ico|icon.png|apple-icon.png|.*\\.(?:png|jpg|svg|webp|mp4|txt|xml)$).*)'],
};

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

interface NavItemProps {
  href: string;
  label: string;
  active: boolean;
}

function NavLink({ href, label, active }: NavItemProps) {
  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={[
          'flex h-12 min-w-0 flex-col items-center justify-center gap-0.5',
          'font-mono text-[10px] uppercase tracking-[0.08em] transition-colors',
          active ? 'text-secondary' : 'text-on-surface-muted hover:text-on-surface',
        ].join(' ')}
      >
        {label}
      </Link>
    </li>
  );
}

/**
 * BottomNav — global Blueprint navigation shell (mobile-first, bottom-anchored
 * at every viewport size). Replaces the legacy two-row Navbar per design D5.
 *
 * Items (mono uppercase): HOME /, SEARCH (inert — restyled only, no search
 * triggered), ＋ (create, labelled "Sell Now"), CHAT /messages, ME /profile.
 * ME routes to /login when signed out so the auth entry is preserved; a
 * "Sign out" action is shown when signed in so logout stays reachable.
 *
 * Fixed to the bottom with iOS safe-area padding.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  const isHome = pathname === '/';
  // Active only for the top-level route so child pages (e.g. a conversation
  // thread under /messages) still light their section.
  const isMessages = pathname === '/messages';

  return (
    <nav
      aria-label="Blueprint bottom navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-outline bg-surface-dim/95 backdrop-blur bp-grid"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch">
        <NavLink href="/" label="HOME" active={isHome} />
        <li className="flex-1">
          <button
            type="button"
            aria-disabled="true"
            aria-label="SEARCH"
            className="flex h-12 w-full min-w-0 flex-col items-center justify-center gap-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-on-surface-muted opacity-70"
            title="Próximamente"
          >
            SEARCH
          </button>
        </li>
        <li className="flex flex-1 items-center justify-center">
          <Link
            href="/create"
            aria-label="Sell Now"
            className="flex h-11 w-11 items-center justify-center rounded-sm border border-secondary bg-surface-2 font-mono text-lg text-secondary shadow-[0_0_0_4px_var(--t-surface-dim)] transition-colors active:bg-secondary/20"
          >
            <span aria-hidden="true">＋</span>
          </Link>
        </li>
        <NavLink href="/messages" label="CHAT" active={isMessages} />
        <NavLink
          href={isAuthenticated ? '/profile' : '/login'}
          label="ME"
          active={pathname === '/profile'}
        />
        {isAuthenticated ? (
          <li className="flex items-center">
            <button
              type="button"
              onClick={logout}
              className="mr-1 px-2 py-2 font-mono text-[9px] uppercase tracking-widest text-on-surface-muted hover:text-error transition-colors"
            >
              Sign out
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

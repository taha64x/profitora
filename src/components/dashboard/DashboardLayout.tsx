'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
      <path d={d}/>
    </svg>
  )
}

function NavLink({ href, icon, label, active, special, collapsed }: {
  href: string; icon: string; label: string
  active: boolean; special?: boolean; collapsed: boolean
}) {
  const base = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all'
  const style = special
    ? 'bg-au-gold/15 text-au-gold border border-au-gold/25 hover:bg-au-gold/25'
    : active
    ? 'bg-white/12 text-white'
    : 'text-white/50 hover:text-white hover:bg-white/8'

  if (collapsed) {
    return (
      <Link href={href} title={label}
        className={`flex items-center justify-center w-10 h-10 rounded-lg mx-auto transition-all ${
          special ? 'bg-au-gold/15 text-au-gold' : active ? 'bg-white/12 text-white' : 'text-white/40 hover:text-white hover:bg-white/8'
        }`}
      >
        <Icon d={icon}/>
      </Link>
    )
  }
  return (
    <Link href={href} className={`${base} ${style}`}>
      <Icon d={icon}/>
      <span className="truncate">{label}</span>
    </Link>
  )
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 border-t border-white/8"/>
  return (
    <div className="mt-4 mb-1 px-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">{label}</span>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const active = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/8 flex items-center justify-between">
          {(!collapsed || mobile) && (
            <Link href="/" className="flex items-center gap-2" onClick={() => mobile && setMobileOpen(false)}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M8 2L14 13H2L8 2Z" fill="#06091A"/></svg>
              </div>
              <span className="font-bold text-white tracking-tight">Profitora</span>
            </Link>
          )}
          {collapsed && !mobile && (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center mx-auto">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M8 2L14 13H2L8 2Z" fill="#06091A"/></svg>
            </div>
          )}
          {!mobile && (
            <button onClick={() => setCollapsed((c) => !c)} className="text-white/30 hover:text-white/60 transition-colors ml-auto">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                {collapsed
                  ? <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  : <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
                }
              </svg>
            </button>
          )}
          {mobile && (
            <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white ml-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          <NavLink href="/dashboard" icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            label="Übersicht" active={active('/dashboard', true)} collapsed={collapsed && !mobile}/>
          <SectionLabel label="Meine Zahlen" collapsed={collapsed && !mobile}/>
          <NavLink href="/dashboard/revenues" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            label="Einnahmen" active={active('/dashboard/revenues')} collapsed={collapsed && !mobile}/>
          <NavLink href="/dashboard/costs" icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            label="Ausgaben" active={active('/dashboard/costs')} collapsed={collapsed && !mobile}/>
          <NavLink href="/dashboard/finance" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            label="Finanzübersicht" active={active('/dashboard/finance')} collapsed={collapsed && !mobile}/>
          <SectionLabel label="Mein Weg" collapsed={collapsed && !mobile}/>
          <NavLink href="/dashboard/mein-weg" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            label="Fortschritt" active={active('/dashboard/mein-weg', true)} collapsed={collapsed && !mobile}/>
          <NavLink href="/dashboard/mein-weg/ziele" icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            label="Ziele setzen" active={active('/dashboard/mein-weg/ziele')} collapsed={collapsed && !mobile}/>
          <SectionLabel label="KI-Analyse" collapsed={collapsed && !mobile}/>
          <NavLink href="/dashboard/new-analysis" icon="M12 4v16m8-8H4"
            label="Neue Analyse" active={active('/dashboard/new-analysis')} special collapsed={collapsed && !mobile}/>
          <NavLink href="/dashboard/analyses" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            label="Meine Analysen" active={active('/dashboard/analyses')} collapsed={collapsed && !mobile}/>
          <NavLink href="/dashboard/files" icon="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            label="Dateien" active={active('/dashboard/files')} collapsed={collapsed && !mobile}/>
        </nav>

        <div className="px-3 py-3 border-t border-white/8 space-y-0.5">
          {[
            { href: '/dashboard/subscription', label: 'Abo & Zahlung',   icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
            { href: '/dashboard/profile',      label: 'Profil',          icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { href: '/dashboard/settings',     label: 'Einstellungen',   icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
            { href: '/dashboard/help',         label: 'Hilfe',           icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label}
              active={active(item.href)} collapsed={collapsed && !mobile}/>
          ))}
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/35 hover:text-white/60 hover:bg-white/5 transition-all ${collapsed && !mobile ? 'justify-center' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              {(!collapsed || mobile) && <span>Abmelden</span>}
            </button>
          </form>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-[#0D1630] text-white flex-col fixed inset-y-0 left-0 transition-all duration-200 z-30 hidden lg:flex`}>
        <SidebarContent/>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#0D1630] text-white flex flex-col z-50 lg:hidden transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent mobile/>
      </aside>

      {/* Content */}
      <div className={`flex-1 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'} transition-all duration-200 min-h-screen flex flex-col`}>
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Menü öffnen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-au-gold to-au-gold-light flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><path d="M8 2L14 13H2L8 2Z" fill="#06091A"/></svg>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">Profitora</span>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

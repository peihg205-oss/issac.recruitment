'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AdminSidebar } from '@/components/shared/admin-sidebar'
import { AdminProfileBadge } from '@/components/admin/admin-profile-badge'
import { Home, Menu } from 'lucide-react'
import type { AdminRoleType } from '@/lib/permissions'

interface AdminLayoutClientProps {
  children: React.ReactNode
  profile: any
  activeRole: AdminRoleType
  acc: { name: string; title: string; avatarInitial: string }
}

export function AdminLayoutClient({ children, profile, activeRole, acc }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminSidebar
        user={profile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 z-10 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            {/* Hamburger — only on mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-2xs shrink-0">
              <Image
                src="/issac-logo.png"
                alt="iSSAC Logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 leading-tight truncate">
                  <span className="hidden sm:inline">Hệ thống Quản trị Tuyển quân Gen 3</span>
                  <span className="sm:hidden text-[11px]">Admin Portal</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden md:block truncate">
                CLB Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN (iSSAC)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/"
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 border border-slate-200/80 transition-all shrink-0"
              title="Về Trang chủ"
            >
              <Home className="w-4.5 h-4.5" />
            </Link>

            <AdminProfileBadge
              role={activeRole}
              initialName={acc.name}
              initialTitle={acc.title}
              initialAvatarInitial={acc.avatarInitial}
            />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

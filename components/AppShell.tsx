'use client'

import { useState } from 'react'
import { TopBar } from '@/components/TopBar'
import { SideNav } from '@/components/SideNav'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="relative flex h-screen flex-col">
      <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <SideNav className="hidden md:flex" />
        
        {/* Mobile sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0">
            <SideNav className="border-0" />
          </SheetContent>
        </Sheet>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          {children}
        </main>
      </div>
    </div>
  )
}
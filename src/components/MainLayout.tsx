import React from "react";
import { MainNav } from "./MainNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Notes from "./Notes";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNotes?: boolean;
}

export function MainLayout({ children, title, showNotes = false }: MainLayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex min-h-screen bg-background">
      <MainNav />
      
      <div className="flex flex-col flex-1 md:ml-64 w-0 min-w-0">
        {title && (
          <header className="sticky top-0 z-30 bg-background border-b px-4 md:px-6 py-3 md:py-4 backdrop-blur-sm bg-background/90">
            <h1 className="text-xl md:text-2xl font-semibold">{title}</h1>
          </header>
        )}
        
        <main className="flex-1 p-3 md:p-6 animate-fade-in flex flex-col gap-8 overflow-x-hidden">
          {children}
          
          {showNotes && (
            <div className="mt-8">
              <Notes />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

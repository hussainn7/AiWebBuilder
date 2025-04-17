
import React from "react";
import { MainNav } from "./MainNav";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <MainNav />
      
      <div className="flex flex-col flex-1 md:ml-64">
        {title && (
          <header className="sticky top-0 z-30 bg-background border-b px-6 py-4 backdrop-blur-sm bg-background/90">
            <h1 className="text-2xl font-semibold">{title}</h1>
          </header>
        )}
        
        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

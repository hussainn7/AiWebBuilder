import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Briefcase, 
  Calendar, 
  BarChart3, 
  Settings,
  ShieldCheck,
  Menu, 
  X,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { NotificationCenter } from "@/components/ui/notifications";

interface NavItemProps {
  icon: React.ElementType;
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, href, label, isActive, onClick }: NavItemProps) => {
  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
          isActive 
            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </button>
    );
  }
  
  return (
    <Link 
      to={href} 
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = window.location.pathname;
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleLogout = () => {
    logout();
    toast.success("You have been signed out successfully");
    navigate("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, href: "/dashboard", label: "Dashboard" },
    { icon: CheckSquare, href: "/tasks", label: "Tasks" },
    { icon: Users, href: "/clients", label: "Clients" },
    { icon: Briefcase, href: "/projects", label: "Projects" },
    { icon: Calendar, href: "/calendar", label: "Calendar" },
    { icon: BarChart3, href: "/analytics", label: "Analytics" },
    { icon: Settings, href: "/settings", label: "Settings" },
    ...(user?.role === 'admin' ? [
      { icon: ShieldCheck, href: "/admin", label: "Admin" }
    ] : []),
  ];

  return (
    <>
      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu} 
        className="md:hidden fixed top-4 right-4 z-50 text-primary"
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Notification center for mobile */}
      <div className="md:hidden fixed top-4 right-16 z-50">
        <NotificationCenter />
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden md:flex flex-col h-screen w-64 bg-sidebar fixed left-0 top-0 border-r">
        <div className="p-4">
          <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6" />
            <span>Task Pulse SMM</span>
          </h1>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              href={item.href}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </nav>
        
        <div className="px-2 py-4 border-t border-sidebar-accent/50">
          <div className="flex items-center justify-end mb-3 px-3">
            <NavItem
              icon={LogOut}
              href=""
              label="Sign Out"
              onClick={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-64 bg-sidebar p-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
                <CheckSquare className="h-6 w-6" />
                <span>Task Pulse SMM</span>
              </h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMenu}
                className="text-sidebar-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  href={item.href}
                  label={item.label}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>
            
            <div className="mt-6 pt-4 border-t border-sidebar-accent/50">
              <div className="flex items-center justify-between mb-3 px-3">
                <NavItem
                  icon={LogOut}
                  href=""
                  label="Sign Out"
                  onClick={handleLogout}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

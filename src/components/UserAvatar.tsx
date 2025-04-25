import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const UserAvatar = ({ user, className, size = "md" }: UserAvatarProps) => {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base"
  };

  // Generate initials from user name
  const getInitials = () => {
    if (!user) return "?";
    
    // If user has firstName and lastName fields (from server data)
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    
    // If user has name field (from client-side processing)
    if (user.name) {
      const parts = user.name.trim().split(" ");
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    // Fallback to email if available
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return "?";
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    if (!user) return null;
    
    // Use provided avatar if available
    if (user.avatar) return user.avatar;
    
    // Use profilePicture if available (server format)
    if (user.profilePicture) return user.profilePicture;
    
    // Generate avatar URL using UI Avatars service
    const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    }
    
    return null;
  };

  const initials = getInitials();
  const avatarUrl = getAvatarUrl();

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name || `${user.firstName || ''} ${user.lastName || ''}`} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;

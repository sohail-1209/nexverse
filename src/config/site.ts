
import { Home, BookOpenText, Bookmark, MessageSquare, PlusCircle, Users, Settings, User, LibrarySquare, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
};

export type SiteConfig = {
  name: string;
  description: string;
  url: string; // Replace with your actual URL when deploying
  ogImage: string; // Replace with your actual OG image URL
  mainNav: NavItem[];
  authenticatedNav: NavItem[];
  adminNav: NavItem[];
  profileNav?: NavItem[]; // For user dropdown or profile page sections
};

export const siteConfig: SiteConfig = {
  name: "NExVERSE",
  description: "Organize, share, and discover exam answers with NExVERSE, powered by AI.",
  url: "http://localhost:3000", // Update this to your production URL
  ogImage: "http://localhost:3000/og.png", // Update this
  mainNav: [
    {
      title: "Home",
      href: "/",
      icon: Home,
    },
  ],
  authenticatedNav: [
     {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Subjects",
      href: "/subjects",
      icon: BookOpenText,
    },
    {
      title: "Upload Answer",
      href: "/answers/upload",
      icon: PlusCircle,
    },
    {
      title: "My Bookmarks",
      href: "/bookmarks",
      icon: Bookmark,
    },
    {
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    {
      title: "Chat AI",
      href: "/chat",
      icon: MessageSquare,
    },
  ],
  adminNav: [
    {
      title: "Moderation",
      href: "/admin/moderation",
      icon: Users,
      description: "Manage content and users."
    },
    {
      title: "Manage Subjects",
      href: "/admin/subjects",
      icon: LibrarySquare,
      description: "Add or edit subjects."
    }
  ],
  profileNav: [ 
    {
      title: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    }
  ]
};

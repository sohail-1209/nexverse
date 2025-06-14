'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, BookOpen, Bookmark, MessageSquareIcon } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  if (!user) {
    // This should ideally be handled by the AuthGuard in layout,
    // but as a fallback or if this page is somehow accessed without layout.
    return <p>Loading user data or redirecting...</p>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Welcome to NExVERSE, {user.displayName || user.email}!</CardTitle>
          <CardDescription>Your central hub for managing and discovering exam answers.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Explore subjects, upload your own answers, chat with our AI assistant, or manage your bookmarks.
            {isAdmin && " As an admin, you can also moderate content."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardActionCard
          title="Explore Subjects"
          description="Browse answers categorized by subject and type."
          href="/subjects"
          icon={<BookOpen className="h-8 w-8 text-primary" />}
          actionText="View Subjects"
        />
        <DashboardActionCard
          title="Upload Answer"
          description="Contribute your knowledge by uploading new answers."
          href="/answers/upload"
          icon={<PlusCircle className="h-8 w-8 text-primary" />}
          actionText="Upload Now"
        />
        <DashboardActionCard
          title="My Bookmarks"
          description="Access your saved answers quickly and easily."
          href="/bookmarks"
          icon={<Bookmark className="h-8 w-8 text-primary" />}
          actionText="View Bookmarks"
        />
         <DashboardActionCard
          title="AI Chat Assistant"
          description="Ask questions or get help improving answers."
          href="/chat"
          icon={<MessageSquareIcon className="h-8 w-8 text-primary" />}
          actionText="Start Chatting"
        />
      </div>

      {isAdmin && (
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Admin Panel</CardTitle>
            <CardDescription>Manage application content and users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/moderation">Go to Moderation</Link>
            </Button>
            {/* More admin links can be added here */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface DashboardActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  actionText: string;
}

function DashboardActionCard({ title, description, href, icon, actionText }: DashboardActionCardProps) {
  return (
    <Card className="hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="rounded-full bg-primary/10 p-3">
            {icon}
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href={href}>{actionText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

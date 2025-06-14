
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookmarkX, Eye, ThumbsUp, Trash2, BadgeCheck } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// TODO: Replace with actual bookmarked answer data fetched from Firestore for the current user
interface BookmarkedAnswer {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string; // e.g., "Physics"
  category: string;
  type: string; // e.g., "5-mark"
  isVerified: boolean;
  snippet?: string; // Short preview of the answer
}

const mockBookmarkedAnswers: BookmarkedAnswer[] = [
  { id: 'phys001', title: 'Newton\'s First Law Explained', subjectId: 'physics', subjectName: 'Physics', category: 'Conceptual', type: '5-mark', isVerified: true, snippet: "Newton's First Law of Motion, also known as the law of inertia, states that an object at rest will stay at rest..." },
  { id: 'chem001', title: 'Balancing Redox Reactions', subjectId: 'chemistry', subjectName: 'Chemistry', category: 'Problem-Solving', type: '10-mark', isVerified: true, snippet: "Redox reactions involve the transfer of electrons. Balancing them requires..." },
  { id: 'math001', title: 'Integration by Parts Example', subjectId: 'mathematics', subjectName: 'Mathematics', category: 'Example', type: '5-mark', isVerified: false, snippet: "Integration by parts is a technique based on the product rule for differentiation..." },
];

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // TODO: Fetch user's bookmarked answers from Firestore
      // For now, use mock data
      setBookmarks(mockBookmarkedAnswers);
    }
    setIsLoading(false);
  }, [user]);

  const handleRemoveBookmark = (answerId: string, answerTitle: string) => {
    // TODO: Implement logic to remove bookmark from Firestore
    setBookmarks(prev => prev.filter(b => b.id !== answerId));
    toast({ title: 'Bookmark Removed', description: `"${answerTitle}" removed from your bookmarks.` });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!user) {
    // This should ideally be caught by AuthGuard, but as a fallback
    return <p className="text-center text-muted-foreground">Please log in to see your bookmarks.</p>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">My Bookmarks</CardTitle>
          <CardDescription>All your saved answers in one place for quick access.</CardDescription>
        </CardHeader>
      </Card>

      {bookmarks.length > 0 ? (
        <div className="space-y-6">
          {bookmarks.map((answer) => (
            <Card key={answer.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline text-xl mb-1">{answer.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                      <span>{answer.subjectName}</span>
                      <span className="text-xs">&bull;</span>
                      <span>{answer.category}</span>
                      <span className="text-xs">&bull;</span>
                      <span>{answer.type}</span>
                      {answer.isVerified && <Badge variant="default" className="bg-accent text-accent-foreground ml-2 flex items-center gap-1"><BadgeCheck className="h-4 w-4" />Verified</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveBookmark(answer.id, answer.title)}>
                    <BookmarkX className="h-5 w-5 text-destructive" />
                    <span className="sr-only">Remove Bookmark</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {answer.snippet && <p className="text-muted-foreground mb-4 line-clamp-2">{answer.snippet}</p>}
                <Button asChild size="sm">
                  <Link href={`/answers/${answer.id}?subject=${answer.subjectId}`}>View Full Answer</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <BookmarkX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold">No Bookmarks Yet</p>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t bookmarked any answers. Start exploring and save answers for later!
            </p>
            <Button asChild>
              <Link href="/subjects">Explore Subjects</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

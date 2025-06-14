
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookmarkX, Eye, ThumbsUp, Trash2, BadgeCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { db, collection, query, where, getDocs, deleteDoc, doc, orderBy as fbOrderBy } from '@/lib/firebase'; // Added Firestore imports

interface BookmarkedAnswer {
  id: string; // This will be the answerId (document ID from the bookmarks subcollection)
  title: string;
  subjectId: string;
  subjectName?: string;
  category: string;
  type: string;
  isVerified: boolean;
  // snippet?: string; // We can generate this or fetch full answer later if needed
}

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const bookmarksCollectionRef = collection(db, `users/${user.uid}/bookmarks`);
        const q = query(bookmarksCollectionRef, fbOrderBy('bookmarkedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedBookmarks: BookmarkedAnswer[] = [];
        querySnapshot.forEach((doc) => {
          // The doc.id here is the answerId
          fetchedBookmarks.push({ id: doc.id, ...doc.data() } as BookmarkedAnswer);
        });
        setBookmarks(fetchedBookmarks);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
        toast({ title: "Error", description: "Could not fetch your bookmarks.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  const handleRemoveBookmark = async (answerId: string, answerTitle: string) => {
    if (!user) return;
    try {
      const bookmarkDocRef = doc(db, `users/${user.uid}/bookmarks`, answerId);
      await deleteDoc(bookmarkDocRef);
      setBookmarks(prev => prev.filter(b => b.id !== answerId));
      toast({ title: 'Bookmark Removed', description: `"${answerTitle}" removed from your bookmarks.` });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast({ title: "Error", description: "Could not remove bookmark.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Login Required</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Please log in to see your bookmarks.</p>
                <Button asChild>
                    <Link href="/auth/login">Log In</Link>
                </Button>
            </CardContent>
        </Card>
    );
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
                     <Link href={`/answers/${answer.id}?subject=${answer.subjectId}`}>
                        <CardTitle className="font-headline text-xl mb-1 hover:text-primary transition-colors">{answer.title}</CardTitle>
                     </Link>
                    <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                      <span>{answer.subjectName || answer.subjectId.replace('_', ' ')}</span>
                      <span className="text-xs">&bull;</span>
                      <span>{answer.category?.replace('_', ' ')}</span>
                      <span className="text-xs">&bull;</span>
                      <span>{answer.type?.replace('_', ' ')}</span>
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
                {/* Snippet could be added here if stored, or fetched if necessary */}
                {/* <p className="text-muted-foreground mb-4 line-clamp-2">{answer.snippet}</p> */}
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



'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bookmark, Edit, Trash2, UserCircle, CalendarDays, CheckCircle, Brain, MessageSquare, ThumbsUp, ThumbsDown, Share2, FileText, Download } from 'lucide-react'; // Added FileText, Download
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { improveAnswer, ImproveAnswerInput, ImproveAnswerOutput } from '@/ai/flows/improve-answer';
import { summarizeAnswer, SummarizeAnswerInput, SummarizeAnswerOutput } from '@/ai/flows/generate-answer-summary';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { db, doc, getDoc, deleteDoc, updateDoc, setDoc, serverTimestamp, storage, ref, deleteObject } from '@/lib/firebase'; // Added Firestore and Storage functions

interface Answer {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  category: string;
  type: string;
  content: string;
  tags: string[];
  userId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: any; // Firestore Timestamp
  isVerified: boolean;
  views?: number;
  likes?: number;
  fileURL?: string;
  fileName?: string; // For deleting from storage
}

export default function AnswerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const answerId = params.answerId as string;
  const { user, isAdmin } = useAuth();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchAnswer = async () => {
      if (!answerId) return;
      setIsLoading(true);
      try {
        const answerDocRef = doc(db, 'answers', answerId);
        const answerDocSnap = await getDoc(answerDocRef);

        if (answerDocSnap.exists()) {
          const fetchedAnswer = { id: answerDocSnap.id, ...answerDocSnap.data() } as Answer;
          // Increment views (basic implementation, consider debouncing or server-side increment for production)
          if(user && fetchedAnswer.userId !== user.uid) { // Don't count owner's views this simply
             await updateDoc(answerDocRef, { views: (fetchedAnswer.views || 0) + 1 });
             fetchedAnswer.views = (fetchedAnswer.views || 0) + 1;
          }
          setAnswer(fetchedAnswer);

          // Fetch bookmark status if user is logged in
          if (user) {
            const bookmarkDocRef = doc(db, `users/${user.uid}/bookmarks`, answerId);
            const bookmarkDocSnap = await getDoc(bookmarkDocRef);
            setIsBookmarked(bookmarkDocSnap.exists());
          }
        } else {
          setAnswer(null);
          toast({ title: "Not Found", description: "This answer does not exist.", variant: "destructive"});
        }
      } catch (error) {
        console.error("Error fetching answer:", error);
        toast({ title: "Error", description: "Could not fetch the answer.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnswer();
  }, [answerId, user]);

  const handleBookmark = async () => {
    if (!user || !answer) {
      toast({ title: "Login Required", description: "Please log in to bookmark answers.", variant: "destructive" });
      return;
    }
    const bookmarkDocRef = doc(db, `users/${user.uid}/bookmarks`, answer.id);
    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkDocRef);
        toast({ title: 'Bookmark Removed', description: `Answer "${answer.title}" removed from your bookmarks.` });
      } else {
        await setDoc(bookmarkDocRef, { 
          answerId: answer.id,
          title: answer.title, // Denormalize for easier listing
          subjectId: answer.subjectId,
          subjectName: answer.subjectName,
          category: answer.category,
          type: answer.type,
          isVerified: answer.isVerified,
          bookmarkedAt: serverTimestamp() 
        });
        toast({ title: 'Bookmarked!', description: `Answer "${answer.title}" added to your bookmarks.` });
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Error bookmarking answer:", error);
      toast({ title: "Error", description: "Could not update bookmark. Please try again.", variant: "destructive"});
    }
  };

  const handleDelete = async () => {
    if (!user || !answer) return;
    if (user.uid !== answer.userId && !isAdmin) {
      toast({ title: "Permission Denied", description: "You cannot delete this answer.", variant: "destructive"});
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'answers', answer.id));

      // Delete file from Storage if it exists
      if (answer.fileURL && answer.fileName) {
        const fileRef = ref(storage, `answers/${answer.userId}/${answer.fileName}`);
        await deleteObject(fileRef);
      }
      
      // TODO: Optionally, remove this answer from all users' bookmarks (more complex, consider a Cloud Function)

      toast({ title: "Answer Deleted", description: "The answer has been successfully deleted." });
      router.push(answer.subjectId ? `/subjects/${answer.subjectId}` : '/subjects');
    } catch (error) {
      console.error("Error deleting answer:", error);
      toast({ title: "Deletion Failed", description: "Could not delete the answer.", variant: "destructive"});
    }
  };

  const handleImproveWithAI = async () => {
    if (!answer) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const input: ImproveAnswerInput = { question: answer.title, answer: answer.content };
      const result: ImproveAnswerOutput = await improveAnswer(input);
      setAiSuggestion(result.improvedAnswer);
    } catch (error) {
      console.error("Error improving answer with AI:", error);
      setAiSuggestion("Failed to get AI suggestion. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSummarizeWithAI = async () => {
    if (!answer) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const input: SummarizeAnswerInput = { answer: answer.content };
      const result: SummarizeAnswerOutput = await summarizeAnswer(input);
      setAiSuggestion(result.summary);
    } catch (error) {
      console.error("Error summarizing answer with AI:", error);
      setAiSuggestion("Failed to get AI summary. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!answer) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4">Answer Not Found</h2>
        <p className="text-muted-foreground mb-4">The answer you are looking for does not exist or may have been removed.</p>
        <Button asChild>
          <Link href="/subjects">Back to Subjects</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user && user.uid === answer.userId;
  const displayDate = answer.createdAt?.toDate ? answer.createdAt.toDate().toLocaleDateString() : 'N/A';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={answer.subjectId ? `/subjects/${answer.subjectId}` : '/subjects'}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Subject</span>
          </Link>
        </Button>
        <h1 className="font-headline text-3xl md:text-4xl ">{answer.title}</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={answer.authorAvatar} alt={answer.authorName} />
                <AvatarFallback>{answer.authorName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{answer.authorName}</p>
                <p className="text-xs text-muted-foreground">
                  Published on {displayDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              {answer.isVerified && <Badge variant="default" className="bg-accent text-accent-foreground flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Verified</Badge>}
              <Badge variant="secondary">{answer.category?.replace('_', ' ')}</Badge>
              <Badge variant="outline">{answer.type?.replace('_', ' ')}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none mb-6" dangerouslySetInnerHTML={{ __html: answer.content.replace(/\n/g, '<br />') }} />
          
          {answer.fileURL && (
            <div className="mb-6 p-4 border rounded-md bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">Attached File</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={answer.fileURL} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download
                  </a>
                </Button>
              </div>
            </div>
          )}

          {answer.tags && answer.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {answer.tags.map(tag => <Badge key={tag} variant="outline"># {tag}</Badge>)}
            </div>
          )}

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 text-muted-foreground">
              {/* TODO: Implement like/dislike functionality */}
              <Button variant="ghost" size="sm" disabled><ThumbsUp className="mr-2 h-4 w-4" /> ({answer.likes || 0})</Button>
              <Button variant="ghost" size="sm" disabled><ThumbsDown className="mr-2 h-4 w-4" /> (0)</Button>
              <Button variant="ghost" size="sm" disabled><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            </div>
            <div className="flex gap-2">
              {user && (
                <Button variant={isBookmarked ? "default" : "outline"} onClick={handleBookmark}>
                  <Bookmark className="mr-2 h-4 w-4" /> {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
              )}
              {(isOwner || isAdmin) && (
                <>
                  <Button variant="outline" size="icon" disabled title="Edit feature coming soon"> {/* TODO: Create edit page */}
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this answer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><Brain className="h-6 w-6 text-primary" /> AI Assistance</CardTitle>
          <CardDescription>Use AI to improve or summarize this answer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleImproveWithAI} disabled={aiLoading}>
              {aiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Improve with AI
            </Button>
            <Button onClick={handleSummarizeWithAI} variant="outline" disabled={aiLoading}>
              {aiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Summarize with AI
            </Button>
          </div>
          {aiLoading && <p className="text-sm text-muted-foreground">AI is thinking...</p>}
          {aiSuggestion && (
            <div className="p-4 border rounded-md bg-muted/50">
              <h4 className="font-semibold mb-2">AI Suggestion:</h4>
              <p className="text-sm whitespace-pre-wrap">{aiSuggestion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TODO: Implement Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Add a comment... (Feature coming soon)" disabled />
          <Button className="mt-2" disabled>Post Comment</Button>
          <p className="text-sm text-muted-foreground mt-4">Comments section is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}


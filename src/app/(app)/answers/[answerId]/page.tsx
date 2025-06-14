
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bookmark, Edit, Trash2, UserCircle, CalendarDays, CheckCircle, Brain, MessageSquare, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
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

// TODO: Replace with actual answer data fetched from Firestore using answerId
// TODO: Fetch subject name based on subjectId if available in query params or answer data
interface Answer {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string; // Add this if you can fetch it
  category: string;
  type: string; // e.g., 5-mark
  content: string; // Markdown content
  tags: string[];
  userId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string; // Should be a timestamp or parsable date string
  isVerified: boolean;
  views?: number;
  likes?: number;
}

const mockAnswerData: Answer = {
  id: 'phys001',
  title: 'Newton\'s First Law Explained in Detail',
  subjectId: 'physics',
  subjectName: 'Physics',
  category: 'Conceptual',
  type: '5-mark',
  content: `Newton's First Law of Motion, also known as the law of inertia, states that an object at rest will stay at rest, and an object in motion will stay in motion with the same speed and in the same direction unless acted upon by an unbalanced force.

**Key Concepts:**
*   **Inertia:** The tendency of an object to resist changes in its state of motion.
*   **Unbalanced Force:** A net force that changes an object's motion. If forces are balanced, the object's motion doesn't change.

**Examples:**
1.  A book resting on a table will remain at rest unless someone pushes or pulls it.
2.  A satellite orbiting Earth will continue in its orbit at a constant speed unless acted upon by forces like atmospheric drag or gravitational pull from other celestial bodies.

This law is fundamental to understanding how forces affect motion.`,
  tags: ['mechanics', 'laws of motion', 'inertia', 'classical physics'],
  userId: 'user123', // Mock user ID
  authorName: 'John Doe',
  authorAvatar: 'https://placehold.co/100x100.png',
  createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  isVerified: true,
  views: 155,
  likes: 25,
};


export default function AnswerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const answerId = params.answerId as string;
  const { user, isAdmin } = useAuth();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false); // TODO: Fetch bookmark status
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch answer data from Firestore using answerId
    // For now, use mock data
    if (answerId === mockAnswerData.id) {
      const subjectQueryParam = searchParams.get('subject');
      setAnswer({...mockAnswerData, subjectId: subjectQueryParam || mockAnswerData.subjectId });
    } else {
      // Handle case where answer is not found, maybe redirect or show error
      setAnswer(null);
    }
    setIsLoading(false);
    // TODO: Fetch user's bookmark status for this answer
  }, [answerId, searchParams]);

  const handleBookmark = () => {
    // TODO: Implement bookmarking logic (add/remove from user's bookmarks in Firestore)
    setIsBookmarked(!isBookmarked);
    toast({ title: !isBookmarked ? 'Bookmarked!' : 'Bookmark Removed', description: `Answer "${answer?.title}" has been ${!isBookmarked ? 'added to' : 'removed from'} your bookmarks.` });
  };

  const handleDelete = async () => {
    // TODO: Implement delete logic (remove from Firestore, check permissions)
    console.log("Delete answer:", answerId);
    toast({ title: "Answer Deleted", description: "The answer has been successfully deleted." });
    // router.push(`/subjects/${answer?.subjectId}`); // Or wherever appropriate
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
                  Published on {new Date(answer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              {answer.isVerified && <Badge variant="default" className="bg-accent text-accent-foreground flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Verified</Badge>}
              <Badge variant="secondary">{answer.category}</Badge>
              <Badge variant="outline">{answer.type}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Using prose for basic markdown styling. Needs Tailwind Typography plugin for full effect */}
          <div className="prose dark:prose-invert max-w-none mb-6" dangerouslySetInnerHTML={{ __html: answer.content.replace(/\n/g, '<br />') }} />
          
          <div className="flex flex-wrap gap-2 mb-6">
            {answer.tags.map(tag => <Badge key={tag} variant="outline"># {tag}</Badge>)}
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 text-muted-foreground">
              {/* TODO: Implement like/dislike functionality */}
              <Button variant="ghost" size="sm"><ThumbsUp className="mr-2 h-4 w-4" /> ({answer.likes || 0})</Button>
              <Button variant="ghost" size="sm"><ThumbsDown className="mr-2 h-4 w-4" /> (0)</Button>
              <Button variant="ghost" size="sm"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            </div>
            <div className="flex gap-2">
              <Button variant={isBookmarked ? "default" : "outline"} onClick={handleBookmark}>
                <Bookmark className="mr-2 h-4 w-4" /> {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              {(isOwner || isAdmin) && (
                <>
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/answers/edit/${answer.id}`}> {/* TODO: Create edit page */}
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
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

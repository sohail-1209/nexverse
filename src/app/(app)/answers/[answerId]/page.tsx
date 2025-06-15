
'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bookmark, Edit, Trash2, UserCircle, CalendarDays, CheckCircle, Brain, MessageSquare, ThumbsUp, ThumbsDown, Share2, FileText, Download, Send } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { improveAnswer, ImproveAnswerInput, ImproveAnswerOutput } from '@/ai/flows/improve-answer';
import { summarizeAnswer, SummarizeAnswerInput, SummarizeAnswerOutput } from '@/ai/flows/generate-answer-summary';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { db, doc, getDoc, deleteDoc, updateDoc, setDoc, serverTimestamp, storage, ref, deleteObject, collection, addDoc, query, orderBy, onSnapshot, Timestamp, arrayUnion, arrayRemove, increment, writeBatch } from '@/lib/firebase';

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
  likeCount?: number;
  dislikeCount?: number;
  likedBy?: string[];
  dislikedBy?: string[];
  fileURL?: string;
  fileName?: string;
}

interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: Timestamp; // Firestore Timestamp for comments
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

  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const [userLikeStatus, setUserLikeStatus] = useState<'liked' | 'disliked' | null>(null);
  const [isLikingDisliking, setIsLikingDisliking] = useState(false);
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  useEffect(() => {
    const fetchAnswer = async () => {
      if (!answerId) return;
      setIsLoading(true);
      try {
        const answerDocRef = doc(db, 'answers', answerId);
        const answerDocSnap = await getDoc(answerDocRef);

        if (answerDocSnap.exists()) {
          const fetchedAnswer = { 
            id: answerDocSnap.id, 
            ...answerDocSnap.data(),
            likeCount: answerDocSnap.data().likeCount || 0,
            dislikeCount: answerDocSnap.data().dislikeCount || 0,
            likedBy: answerDocSnap.data().likedBy || [],
            dislikedBy: answerDocSnap.data().dislikedBy || [],
          } as Answer;
          
          if(user && fetchedAnswer.userId !== user.uid) {
             await updateDoc(answerDocRef, { views: increment(1) });
             fetchedAnswer.views = (fetchedAnswer.views || 0) + 1;
          }
          setAnswer(fetchedAnswer);

          if (user) {
            const bookmarkDocRef = doc(db, `users/${user.uid}/bookmarks`, answerId);
            const bookmarkDocSnap = await getDoc(bookmarkDocRef);
            setIsBookmarked(bookmarkDocSnap.exists());
            setUserLikeStatus(fetchedAnswer.likedBy?.includes(user.uid) ? 'liked' : fetchedAnswer.dislikedBy?.includes(user.uid) ? 'disliked' : null);
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

  useEffect(() => {
    if (!answerId) return;
    setIsCommentsLoading(true);
    const commentsQuery = query(collection(db, `answers/${answerId}/comments`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const fetchedComments: Comment[] = [];
      snapshot.forEach((doc) => {
        fetchedComments.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(fetchedComments);
      setIsCommentsLoading(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      toast({ title: "Error", description: "Could not load comments.", variant: "destructive"});
      setIsCommentsLoading(false);
    });

    return () => unsubscribe();
  }, [answerId]);


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
          title: answer.title,
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
      await deleteDoc(doc(db, 'answers', answer.id));
      if (answer.fileURL && answer.fileName) {
        const fileRef = ref(storage, `answers/${answer.userId}/${answer.fileName}`);
        await deleteObject(fileRef);
      }
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

   const handleShare = async () => {
    if (!answer) return;
    const shareData = {
      title: answer.title,
      text: `Check out this answer on NExVERSE: ${answer.title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: 'Shared!', description: 'Answer link shared successfully.' });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: 'Link Copied!', description: 'Answer link copied to clipboard as Web Share is not available.' });
      }
    } catch (err: any) {
      console.warn("Share failed:", err.name, err.message);
      if (err.name === 'NotAllowedError' || err.message.toLowerCase().includes('permission denied')) {
        toast({
          title: 'Sharing Canceled or Denied',
          description: 'It seems sharing was canceled or permission was denied by the browser. Link copied to clipboard instead!',
          variant: 'default', // Changed from destructive for permission denied as it's a common user action
        });
      } else {
        toast({
          title: 'Sharing Failed',
          description: 'Could not share. Link copied to clipboard instead.',
          variant: 'destructive',
        });
      }
      // Fallback to clipboard copy
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch (copyErr) {
        console.error('Fallback clipboard copy failed:', copyErr);
        toast({ title: 'Error', description: 'Could not copy link to clipboard.', variant: 'destructive'});
      }
    }
  };

  const handleLikeDislike = async (action: 'like' | 'dislike') => {
    if (!user || !answer || isLikingDisliking) return;
    setIsLikingDisliking(true);

    const answerDocRef = doc(db, 'answers', answer.id);
    const batch = writeBatch(db);
    let newLikeStatus: 'liked' | 'disliked' | null = userLikeStatus;
    let newLikeCount = answer.likeCount || 0;
    let newDislikeCount = answer.dislikeCount || 0;

    if (action === 'like') {
      if (userLikeStatus === 'liked') { // Unlike
        batch.update(answerDocRef, {
          likeCount: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
        newLikeCount--;
        newLikeStatus = null;
      } else { // Like
        batch.update(answerDocRef, {
          likeCount: increment(1),
          likedBy: arrayUnion(user.uid)
        });
        newLikeCount++;
        newLikeStatus = 'liked';
        if (userLikeStatus === 'disliked') { // Was disliked, remove dislike
          batch.update(answerDocRef, {
            dislikeCount: increment(-1),
            dislikedBy: arrayRemove(user.uid)
          });
          newDislikeCount--;
        }
      }
    } else if (action === 'dislike') {
      if (userLikeStatus === 'disliked') { // Undislike
        batch.update(answerDocRef, {
          dislikeCount: increment(-1),
          dislikedBy: arrayRemove(user.uid)
        });
        newDislikeCount--;
        newLikeStatus = null;
      } else { // Dislike
        batch.update(answerDocRef, {
          dislikeCount: increment(1),
          dislikedBy: arrayUnion(user.uid)
        });
        newDislikeCount++;
        newLikeStatus = 'disliked';
        if (userLikeStatus === 'liked') { // Was liked, remove like
          batch.update(answerDocRef, {
            likeCount: increment(-1),
            likedBy: arrayRemove(user.uid)
          });
          newLikeCount--;
        }
      }
    }

    try {
      await batch.commit();
      setUserLikeStatus(newLikeStatus);
      // Update local answer state for immediate UI feedback
      setAnswer(prev => prev ? {
        ...prev,
        likeCount: newLikeCount,
        dislikeCount: newDislikeCount,
        likedBy: newLikeStatus === 'liked' ? [...(prev.likedBy || []), user.uid].filter((v,i,a)=>a.indexOf(v)===i) : (prev.likedBy || []).filter(uid => uid !== user.uid),
        dislikedBy: newLikeStatus === 'disliked' ? [...(prev.dislikedBy || []), user.uid].filter((v,i,a)=>a.indexOf(v)===i) : (prev.dislikedBy || []).filter(uid => uid !== user.uid),
      } : null);
      toast({ title: 'Vote Recorded', description: `You ${action}d this answer.` });
    } catch (error) {
      console.error("Error liking/disliking answer:", error);
      toast({ title: "Error", description: "Could not record your vote.", variant: "destructive"});
    } finally {
      setIsLikingDisliking(false);
    }
  };

  const handlePostComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !answer || !newCommentText.trim()) {
      if (!newCommentText.trim()) toast({ title: "Empty Comment", description: "Cannot post an empty comment.", variant: "destructive" });
      else toast({ title: "Login Required", description: "Please log in to comment.", variant: "destructive" });
      return;
    }
     setIsPostingComment(true);

    // Fetch user profile to ensure displayName is current and exists, as per rules
    const userDocRef = doc(db, 'users', user.uid);
    try {
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists() || !userDocSnap.data()?.displayName || userDocSnap.data()?.displayName.trim() === "") {
            toast({
                title: 'Profile Incomplete',
                description: 'Please set your Display Name in your profile before posting comments.',
                variant: 'destructive',
                action: <Button onClick={() => router.push('/profile')} variant="outline">Go to Profile</Button>
            });
            setIsPostingComment(false);
            return;
        }
        const authorDisplayName = userDocSnap.data()?.displayName;


      const commentsCollectionRef = collection(db, `answers/${answer.id}/comments`);
      await addDoc(commentsCollectionRef, {
        userId: user.uid,
        authorName: authorDisplayName, // Use displayName from fetched user doc
        authorAvatar: user.photoURL || null,
        text: newCommentText.trim(),
        createdAt: serverTimestamp(),
      });
      setNewCommentText('');
      toast({ title: 'Comment Posted!' });
    } catch (error: any) {
      console.error("Error posting comment:", error);
      if (error.message?.includes("Missing or insufficient permissions")) {
         toast({ title: "Comment Error", description: "Could not post comment. Please ensure your profile has a Display Name.", variant: "destructive"});
      } else {
         toast({ title: "Comment Error", description: "Could not post your comment. Please try again.", variant: "destructive"});
      }
    } finally {
      setIsPostingComment(false);
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
                <AvatarFallback>{getInitials(answer.authorName)}</AvatarFallback>
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
                  <span className="font-medium truncate max-w-xs">
                    Attached File: {answer.fileName || 'View Attachment'}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={answer.fileURL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download={answer.fileName}
                    onClick={() => {
                      toast({
                        title: "Download Started",
                        description: `"${answer.fileName || 'The attached file'}" is being downloaded.`,
                      });
                    }}
                  >
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
            <div className="flex gap-1 sm:gap-2 text-muted-foreground">
              <Button 
                variant={userLikeStatus === 'liked' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => handleLikeDislike('like')}
                disabled={!user || isLikingDisliking}
              >
                <ThumbsUp className="mr-2 h-4 w-4" /> ({answer.likeCount || 0})
              </Button>
              <Button 
                variant={userLikeStatus === 'disliked' ? 'destructive' : 'ghost'} 
                size="sm" 
                onClick={() => handleLikeDislike('dislike')}
                disabled={!user || isLikingDisliking}
              >
                <ThumbsDown className="mr-2 h-4 w-4" /> ({answer.dislikeCount || 0})
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </div>
            <div className="flex gap-2">
              {user && (
                <Button variant={isBookmarked ? "default" : "outline"} onClick={handleBookmark}>
                  <Bookmark className="mr-2 h-4 w-4" /> {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
              )}
              {(isOwner || isAdmin) && (
                <>
                  <Button variant="outline" size="icon" disabled title="Edit feature coming soon">
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

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Discussion ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <form onSubmit={handlePostComment} className="flex gap-2 mb-6">
              <Avatar className="h-10 w-10 mt-1">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <Textarea 
                placeholder="Add your comment..." 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={2}
                className="flex-grow"
                disabled={isPostingComment}
              />
              <Button type="submit" disabled={isPostingComment || !newCommentText.trim()}>
                {isPostingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Post</span>
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              <Button variant="link" asChild className="p-0 h-auto"><Link href="/auth/login">Log in</Link></Button> to post a comment.
            </p>
          )}

          {isCommentsLoading ? (
             <div className="flex justify-center items-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                    <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{comment.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                     {/* TODO: Add edit/delete for comment owner or admin */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Be the first to comment on this answer!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


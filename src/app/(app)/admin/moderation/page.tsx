
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, ShieldAlert, Trash2, Eye, Filter, Users, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db, collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy as fbOrderBy, ref, deleteObject, storage } from '@/lib/firebase'; // Added Firestore & Storage imports

interface ModerationAnswer {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  authorName: string;
  userId: string; // For file path if needed
  fileName?: string; // For deleting from storage
  submittedAt: any; // Firestore Timestamp
  isVerified: boolean;
  contentSnippet?: string; // Can be generated or taken from content
}

export default function AdminModerationPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [answers, setAnswers] = useState<ModerationAnswer[]>([]);
  const [allAnswers, setAllAnswers] = useState<ModerationAnswer[]>([]); // To store all fetched answers before filtering
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('unverified');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAnswersForModeration = async () => {
      if (!isAdmin) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const answersCollection = collection(db, 'answers');
        const q = query(answersCollection, fbOrderBy('createdAt', 'desc')); // Fetch all, order by newest
        const querySnapshot = await getDocs(q);
        const fetchedAnswers: ModerationAnswer[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedAnswers.push({
            id: docSnap.id,
            title: data.title,
            subjectId: data.subjectId,
            subjectName: data.subjectName,
            authorName: data.authorName,
            userId: data.userId,
            fileName: data.fileName,
            submittedAt: data.createdAt,
            isVerified: data.isVerified,
            contentSnippet: data.content?.substring(0,100) + "..." || "",
          });
        });
        setAllAnswers(fetchedAnswers); // Store all answers
        // Apply initial filter
        filterAndSetAnswers(fetchedAnswers, filterStatus, searchTerm);
      } catch (error) {
        console.error("Error fetching answers for moderation:", error);
        toast({ title: "Error", description: "Could not fetch answers.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAdmin) {
      fetchAnswersForModeration();
    } else if (!authLoading && !isAdmin) {
      setIsLoading(false);
    }
  }, [isAdmin, authLoading]); // Initial fetch depends on admin status

  const filterAndSetAnswers = (sourceAnswers: ModerationAnswer[], status: string, term: string) => {
    let filtered = sourceAnswers;
    if (status === 'verified') {
      filtered = filtered.filter(a => a.isVerified);
    } else if (status === 'unverified') {
      filtered = filtered.filter(a => !a.isVerified);
    }

    if (term) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(term.toLowerCase()) || 
        a.authorName.toLowerCase().includes(term.toLowerCase())
      );
    }
    setAnswers(filtered);
  };
  
  // Effect for re-filtering when filterStatus or searchTerm changes
  useEffect(() => {
    if (!isLoading) { // Avoid filtering during initial load
        filterAndSetAnswers(allAnswers, filterStatus, searchTerm);
    }
  }, [filterStatus, searchTerm, allAnswers, isLoading]);


  const handleVerifyAnswer = async (answerId: string, currentStatus: boolean) => {
    try {
      const answerDocRef = doc(db, 'answers', answerId);
      await updateDoc(answerDocRef, { isVerified: !currentStatus });
      // Update local state for immediate UI feedback
      const updatedAnswers = allAnswers.map(a => a.id === answerId ? { ...a, isVerified: !currentStatus } : a);
      setAllAnswers(updatedAnswers);
      // Re-apply filters to the displayed list
      filterAndSetAnswers(updatedAnswers, filterStatus, searchTerm);
      toast({ title: 'Status Updated', description: `Answer has been ${!currentStatus ? 'verified' : 'unverified'}.` });
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast({ title: "Update Failed", description: "Could not update verification status.", variant: "destructive" });
    }
  };

  const handleDeleteAnswer = async (answerToDelete: ModerationAnswer) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'answers', answerToDelete.id));

      // Delete file from Storage if it exists
      if (answerToDelete.fileName && answerToDelete.userId) { // Ensure userId is available for path
        const fileRef = ref(storage, `answers/${answerToDelete.userId}/${answerToDelete.fileName}`);
        await deleteObject(fileRef).catch(err => console.warn("Could not delete file from storage or file didn't exist:", err)); // Non-critical if file doesn't exist
      }

      const updatedAnswers = allAnswers.filter(a => a.id !== answerToDelete.id);
      setAllAnswers(updatedAnswers);
      filterAndSetAnswers(updatedAnswers, filterStatus, searchTerm);
      toast({ title: 'Answer Deleted', description: 'The answer has been removed.' });
    } catch (error) {
      console.error("Error deleting answer:", error);
      toast({ title: "Deletion Failed", description: "Could not delete the answer.", variant: "destructive" });
    }
  };


  if (authLoading || isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <Card className="shadow-lg text-center">
        <CardHeader>
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <CardTitle className="font-headline text-3xl text-destructive">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>You do not have permission to access this page.</CardDescription>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center gap-3">
                 <Users className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-3xl">Content Moderation</CardTitle>
            </div>
          <CardDescription>Review, verify, and manage submitted answers.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search answers by title or author..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Answers</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
            </Select>
            {/* Apply button is implicit with state changes now */}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {answers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {answers.map((answer) => (
                  <TableRow key={answer.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                        <Link href={`/answers/${answer.id}?subject=${answer.subjectId}`} className="hover:underline" title={answer.title}>
                            {answer.title}
                        </Link>
                    </TableCell>
                    <TableCell>{answer.authorName}</TableCell>
                    <TableCell>{answer.subjectName || answer.subjectId.replace('_', ' ')}</TableCell>
                    <TableCell>{answer.submittedAt?.toDate ? answer.submittedAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={answer.isVerified ? 'default' : 'destructive'} className={answer.isVerified ? 'bg-accent text-accent-foreground' : ''}>
                        {answer.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/answers/${answer.id}?subject=${answer.subjectId}`} title="View Answer">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant={answer.isVerified ? "secondary" : "default"}
                        size="icon"
                        onClick={() => handleVerifyAnswer(answer.id, answer.isVerified)}
                        title={answer.isVerified ? "Mark as Unverified" : "Mark as Verified"}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" title="Delete Answer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the answer titled &quot;{answer.title}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAnswer(answer)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No answers match the current filter criteria.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


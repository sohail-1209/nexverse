
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, ShieldAlert, Trash2, Eye, Filter, Users, Search } from 'lucide-react';
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
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// TODO: Replace with actual answer data fetched from Firestore, filterable by verification status
interface ModerationAnswer {
  id: string;
  title: string;
  subjectName: string;
  authorName: string;
  submittedAt: string; // ISO Date string
  isVerified: boolean;
  contentSnippet: string;
}

const mockModerationAnswers: ModerationAnswer[] = [
  { id: 'phys002', title: 'Derivation of E=mc²', subjectName: 'Physics', authorName: 'Jane Smith', submittedAt: new Date(Date.now() - 86400000).toISOString(), isVerified: false, contentSnippet: 'The theory of special relativity establishes the equivalence of mass and energy...' },
  { id: 'bio001', title: 'Process of Photosynthesis', subjectName: 'Biology', authorName: 'Alice Wonderland', submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(), isVerified: false, contentSnippet: 'Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy...' },
  { id: 'math002', title: 'Proof of Pythagorean Theorem', subjectName: 'Mathematics', authorName: 'Bob Builder', submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(), isVerified: true, contentSnippet: 'The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse...' },
];

export default function AdminModerationPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [answers, setAnswers] = useState<ModerationAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('unverified');

  useEffect(() => {
    if (!authLoading && isAdmin) {
      // TODO: Fetch answers from Firestore, applying filters server-side if possible
      // For now, filter mock data
      let filteredData = mockModerationAnswers;
      if (filterStatus === 'verified') {
        filteredData = mockModerationAnswers.filter(a => a.isVerified);
      } else if (filterStatus === 'unverified') {
        filteredData = mockModerationAnswers.filter(a => !a.isVerified);
      }
      setAnswers(filteredData);
      setIsLoading(false);
    } else if (!authLoading && !isAdmin) {
        setIsLoading(false); // Stop loading if not admin
    }
  }, [isAdmin, filterStatus, authLoading]);

  const handleVerifyAnswer = (answerId: string, currentStatus: boolean) => {
    // TODO: Update answer verification status in Firestore
    setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, isVerified: !currentStatus } : a));
    toast({ title: 'Status Updated', description: `Answer has been ${!currentStatus ? 'verified' : 'unverified'}.` });
  };

  const handleDeleteAnswer = (answerId: string) => {
    // TODO: Delete answer from Firestore
    setAnswers(prev => prev.filter(a => a.id !== answerId));
    toast({ title: 'Answer Deleted', description: 'The answer has been removed.' });
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
              <Input placeholder="Search answers by title or author..." className="pl-10" />
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
            <Button className="w-full md:w-auto"><Filter className="mr-2 h-4 w-4" />Apply</Button>
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
                        <Link href={`/answers/${answer.id}`} className="hover:underline" title={answer.title}>
                            {answer.title}
                        </Link>
                    </TableCell>
                    <TableCell>{answer.authorName}</TableCell>
                    <TableCell>{answer.subjectName}</TableCell>
                    <TableCell>{new Date(answer.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={answer.isVerified ? 'default' : 'destructive'} className={answer.isVerified ? 'bg-accent text-accent-foreground' : ''}>
                        {answer.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/answers/${answer.id}`} title="View Answer">
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
                            <AlertDialogAction onClick={() => handleDeleteAnswer(answer.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
              No answers match the current filter.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

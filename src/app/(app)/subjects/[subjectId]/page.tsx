
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bookmark, Eye, Filter, Loader2, MessageSquare, Search, Tag, ThumbsUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { db, collection, query, where, getDocs, orderBy as fbOrderBy, doc, getDoc } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface Answer {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string; // This will be from the answer document itself
  category: string;
  type: string;
  content: string; 
  tags: string[];
  userId: string;
  authorName: string;
  createdAt: any; 
  isVerified: boolean;
  views?: number;
  likes?: number;
  fileURL?: string;
}

interface Subject {
  id: string;
  name: string;
  description: string;
}

export default function SubjectAnswersPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubject, setIsLoadingSubject] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      if (!subjectId) return;
      setIsLoadingSubject(true);
      try {
        const subjectDocRef = doc(db, 'subjects', subjectId);
        const subjectDocSnap = await getDoc(subjectDocRef);
        if (subjectDocSnap.exists()) {
          setSubject({ id: subjectDocSnap.id, ...subjectDocSnap.data() } as Subject);
        } else {
          toast({ title: "Subject Not Found", description: "The requested subject does not exist.", variant: "destructive" });
          setSubject(null);
        }
      } catch (error) {
        console.error("Error fetching subject details:", error);
        toast({ title: "Error", description: "Could not fetch subject details.", variant: "destructive" });
      } finally {
        setIsLoadingSubject(false);
      }
    };
    fetchSubjectDetails();
  }, [subjectId]);

  useEffect(() => {
    const fetchAnswers = async () => {
      if (!subjectId) return;
      setIsLoading(true);
      try {
        const answersCollection = collection(db, 'answers');
        let qConstraints = [where('subjectId', '==', subjectId), fbOrderBy('createdAt', 'desc')];
        
        // Dynamic query based on filters - example for type and category
        // Note: Firestore requires composite indexes for queries with multiple range/inequality filters or mixed equality and orderBy on different fields.
        // For simplicity, we filter locally after fetching by subjectId. For larger datasets, server-side filtering and proper indexes are crucial.
        
        const q = query(answersCollection, ...qConstraints);
        const querySnapshot = await getDocs(q);
        const fetchedAnswers: Answer[] = [];
        querySnapshot.forEach((doc) => {
          fetchedAnswers.push({ id: doc.id, ...doc.data() } as Answer);
        });

        let filteredData = fetchedAnswers;
        if (searchTerm) {
          filteredData = filteredData.filter(ans => 
            ans.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ans.content.toLowerCase().includes(searchTerm.toLowerCase()) // Search in content too
          );
        }
        if (filterType !== 'all') {
          filteredData = filteredData.filter(ans => ans.type === filterType);
        }
        if (filterCategory !== 'all') {
          filteredData = filteredData.filter(ans => ans.category === filterCategory);
        }
        
        setAnswers(filteredData);
      } catch (error) {
        console.error("Error fetching answers: ", error);
        toast({ title: "Error", description: "Could not fetch answers for this subject.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoadingSubject) { // Fetch answers only after subject details (or attempt)
        fetchAnswers();
    }
  }, [subjectId, searchTerm, filterType, filterCategory, isLoadingSubject]);
  

  if (isLoading || isLoadingSubject) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  const subjectDisplayName = subject ? subject.name : "Subject";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/subjects">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Subjects</span>
          </Link>
        </Button>
        <h1 className="font-headline text-3xl">Answers for {subjectDisplayName}</h1>
      </div>

      {!subject && !isLoadingSubject && (
        <Card>
            <CardContent className="pt-6 text-center text-destructive">
                This subject could not be found. It might have been removed or the link is incorrect.
            </CardContent>
        </Card>
      )}

      {subject && (
        <>
            <Card className="shadow-md">
                <CardHeader>
                <CardTitle>Filter & Search Answers in {subjectDisplayName}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="relative col-span-1 md:col-span-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                    placeholder={`Search in ${subjectDisplayName}...`} 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                    <SelectValue placeholder="Filter by Type (Marks)" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="2-mark">2-Mark</SelectItem>
                    <SelectItem value="5-mark">5-Mark</SelectItem>
                    <SelectItem value="10-mark">10-Mark</SelectItem>
                    <SelectItem value="15-mark">15-Mark</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                    <SelectValue placeholder="Filter by Category" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="conceptual">Conceptual</SelectItem>
                    <SelectItem value="problem-solving">Problem-Solving</SelectItem>
                    <SelectItem value="derivation">Derivation</SelectItem>
                    <SelectItem value="diagram">Diagram</SelectItem>
                    <SelectItem value="short_note">Short Note</SelectItem>
                    <SelectItem value="comparison">Comparison</SelectItem>
                    </SelectContent>
                </Select>
                </CardContent>
            </Card>

            {answers.length > 0 ? (
                <div className="space-y-6">
                {answers.map((answer) => (
                    <Card key={answer.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                        <Link href={`/answers/${answer.id}?subject=${subjectId}`} className="block">
                            <CardTitle className="font-headline text-xl mb-1 hover:text-primary transition-colors">{answer.title}</CardTitle>
                        </Link>
                        </div>
                        <div className="flex gap-2 items-center text-sm text-muted-foreground">
                        <span>Category: {answer.category.replace('_', ' ')}</span>
                        <span>|</span>
                        <span>Type: {answer.type.replace('_', ' ')}</span>
                        {answer.isVerified && <Badge variant="default" className="bg-accent text-accent-foreground">Verified</Badge>}
                        </div>
                        {answer.tags && answer.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {answer.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                        {answer.content.substring(0, 200)}{answer.content.length > 200 ? '...' : ''}
                        </p>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {answer.views || 0} views</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {answer.likes || 0} likes</span>
                        </div>
                        <Button asChild size="sm">
                            <Link href={`/answers/${answer.id}?subject=${subjectId}`}>View Answer</Link>
                        </Button>
                        </div>
                    </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <Card>
                <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground py-8">
                    No answers found for {subjectDisplayName} with the current filters.
                    <br />
                    {(!searchTerm && filterType === 'all' && filterCategory === 'all') && (
                        <Button variant="link" asChild className="mt-2">
                        <Link href={`/answers/upload?subject=${subjectId}`}>Be the first to upload one!</Link>
                        </Button>
                    )}
                    </p>
                </CardContent>
                </Card>
            )}
        </>
      )}
    </div>
  );
}

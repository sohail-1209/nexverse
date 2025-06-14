
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
import { db, collection, query, where, getDocs, orderBy as fbOrderBy } from '@/lib/firebase'; // Added Firestore imports

interface Answer {
  id: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  category: string;
  type: string;
  content: string; // Markdown content
  tags: string[];
  userId: string;
  authorName: string;
  createdAt: any; // Firestore Timestamp or string
  isVerified: boolean;
  views?: number;
  likes?: number;
  fileURL?: string;
}

// Helper function to get subject name (in a real app, you might fetch this or have it from a global state/context)
const getSubjectName = (subjectId: string) => {
  const name = subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
  if (subjectId === 'physics') return 'Physics';
  if (subjectId === 'chemistry') return 'Chemistry';
  if (subjectId === 'mathematics') return 'Mathematics';
  if (subjectId === 'biology') return 'Biology';
  if (subjectId === 'computer_science') return 'Computer Science';
  if (subjectId === 'history') return 'History';
  return name.replace('_', ' ');
}


export default function SubjectAnswersPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const subjectName = getSubjectName(subjectId);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const fetchAnswers = async () => {
      if (!subjectId) return;
      setIsLoading(true);
      try {
        const answersCollection = collection(db, 'answers');
        // Basic query: filter by subjectId and order by creation date
        let q = query(answersCollection, where('subjectId', '==', subjectId), fbOrderBy('createdAt', 'desc'));
        
        // Apply text search locally for simplicity, or implement server-side search (e.g., Algolia)
        // Apply filters locally for simplicity, complex filtering better server-side

        const querySnapshot = await getDocs(q);
        const fetchedAnswers: Answer[] = [];
        querySnapshot.forEach((doc) => {
          fetchedAnswers.push({ id: doc.id, ...doc.data() } as Answer);
        });

        // Client-side filtering (simple example)
        let filteredData = fetchedAnswers;
        if (searchTerm) {
          filteredData = filteredData.filter(ans => ans.title.toLowerCase().includes(searchTerm.toLowerCase()));
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
        // Handle error display if needed
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnswers();
  }, [subjectId, searchTerm, filterType, filterCategory]);
  
  // TODO: Implement actual bookmarking functionality if needed on this page directly

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/subjects">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Subjects</span>
          </Link>
        </Button>
        <h1 className="font-headline text-3xl">Answers for {subjectName}</h1>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filter & Search Answers</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="relative col-span-1 md:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={`Search in ${subjectName}...`} 
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
           {/* Apply button can trigger re-fetch if filters are server-side, here it's client-side so updates on change */}
           {/* <Button className="md:col-start-3">
             <Filter className="mr-2 h-4 w-4" /> Apply Filters
           </Button> */}
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
                  {/* Bookmark button can be added here if direct bookmarking from this page is desired */}
                  {/* <Button variant="ghost" size="icon"> 
                    <Bookmark className="h-5 w-5 text-primary" />
                    <span className="sr-only">Bookmark</span>
                  </Button> */}
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
              No answers found for {subjectName} with the current filters.
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
    </div>
  );
}


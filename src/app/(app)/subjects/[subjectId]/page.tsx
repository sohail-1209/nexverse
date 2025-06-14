
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bookmark, Eye, Filter, MessageSquare, Search, Tag, ThumbsUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

// TODO: Replace with actual answer data fetched from Firestore based on subjectId
const mockAnswers = {
  physics: [
    { id: 'phys001', title: 'Newton\'s First Law Explained', category: 'Conceptual', type: '5-mark', tags: ['mechanics', 'laws'], views: 120, likes: 15, isVerified: true },
    { id: 'phys002', title: 'Derivation of E=mc²', category: 'Derivation', type: '10-mark', tags: ['relativity', 'energy'], views: 250, likes: 30, isVerified: false },
  ],
  chemistry: [
    { id: 'chem001', title: 'Balancing Redox Reactions', category: 'Problem-Solving', type: '10-mark', tags: ['redox', 'equations'], views: 180, likes: 22, isVerified: true },
  ],
  mathematics: [
     { id: 'math001', title: 'Integration by Parts Example', category: 'Example', type: '5-mark', tags: ['calculus', 'integration'], views: 300, likes: 45, isVerified: true },
  ],
  biology: [
    { id: 'bio001', title: 'Process of Photosynthesis', category: 'Explanation', type: '10-mark', tags: ['plants', 'metabolism'], views: 220, likes: 28, isVerified: false },
  ]
};

// Helper function to get subject name (in a real app, you'd fetch this)
const getSubjectName = (subjectId: string) => {
  const name = subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
  if (subjectId === 'physics') return 'Physics';
  if (subjectId === 'chemistry') return 'Chemistry';
  if (subjectId === 'mathematics') return 'Mathematics';
  if (subjectId === 'biology') return 'Biology';
  return name;
}


export default function SubjectAnswersPage() {
  const params = useParams();
  const subjectId = params.subjectId as keyof typeof mockAnswers | string; // Type assertion for mock data access
  const subjectName = getSubjectName(subjectId as string);

  // Ensure subjectId is a valid key for mockAnswers or handle gracefully
  const answers = (mockAnswers[subjectId as keyof typeof mockAnswers] || []).filter(answer => answer);


  // TODO: Implement actual filtering logic
  // TODO: Implement bookmarking functionality

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
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder={`Search in ${subjectName}...`} className="pl-10" />
          </div>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Type (Marks)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="2-mark">2-Mark</SelectItem>
              <SelectItem value="5-mark">5-Mark</SelectItem>
              <SelectItem value="10-mark">10-Mark</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="conceptual">Conceptual</SelectItem>
              <SelectItem value="derivation">Derivation</SelectItem>
              <SelectItem value="problem-solving">Problem-Solving</SelectItem>
               <SelectItem value="example">Example</SelectItem>
               <SelectItem value="explanation">Explanation</SelectItem>
            </SelectContent>
          </Select>
           <Button className="md:col-start-3">
             <Filter className="mr-2 h-4 w-4" /> Apply Filters
           </Button>
        </CardContent>
      </Card>

      {answers.length > 0 ? (
        <div className="space-y-6">
          {answers.map((answer) => (
            <Card key={answer.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-xl mb-1">{answer.title}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => alert('Bookmark clicked!')}> {/* // TODO: Implement bookmark */}
                    <Bookmark className="h-5 w-5 text-primary" />
                    <span className="sr-only">Bookmark</span>
                  </Button>
                </div>
                <div className="flex gap-2 items-center text-sm text-muted-foreground">
                  <span>Category: {answer.category}</span>
                  <span>|</span>
                  <span>Type: {answer.type}</span>
                  {answer.isVerified && <Badge variant="default" className="bg-accent text-accent-foreground">Verified</Badge>}
                </div>
                <div className="flex gap-1 mt-1">
                  {answer.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {/* // TODO: Add a snippet or summary of the answer here */}
                  Placeholder for answer content snippet. Click to view full answer.
                </p>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {answer.views} views</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {answer.likes} likes</span>
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
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No answers found for {subjectName} with the current filters.
              <br />
              <Button variant="link" asChild className="mt-2">
                <Link href="/answers/upload">Be the first to upload one!</Link>
              </Button>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

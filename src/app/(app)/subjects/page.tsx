
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookMarked, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

// TODO: Replace with actual subject data fetched from Firestore
const mockSubjects = [
  { id: 'physics', name: 'Physics', description: 'Answers related to classical and modern physics.' },
  { id: 'chemistry', name: 'Chemistry', description: 'Explore concepts in organic and inorganic chemistry.' },
  { id: 'mathematics', name: 'Mathematics', description: 'Solutions for algebra, calculus, and more.' },
  { id: 'biology', name: 'Biology', description: 'Dive into the study of life and living organisms.' },
];

export default function SubjectsPage() {
  // TODO: Implement search and filter state and logic
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Explore Subjects</CardTitle>
          <CardDescription>Browse exam answers categorized by subject.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search subjects..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockSubjects.map((subject) => (
          <Card key={subject.id} className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-md">
                  <BookMarked className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-headline text-xl">{subject.name}</CardTitle>
              </div>
              <CardDescription>{subject.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/subjects/${subject.id}`}>View {subject.name} Answers</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {mockSubjects.length === 0 && (
        <p className="text-center text-muted-foreground">No subjects available at the moment. Check back later!</p>
      )}
    </div>
  );
}


'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookMarked, Search, Filter, Loader2, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { db, collection, getDocs, query, orderBy as fbOrderBy } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

interface Subject {
  id: string;
  name: string;
  description: string;
  // Add other fields like 'answerCount' if you plan to denormalize
}

export default function SubjectsPage() {
  const { isAdmin } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const subjectsCollection = collection(db, 'subjects');
        // Order by name for consistent listing, or by createdAt if available
        const q = query(subjectsCollection, fbOrderBy('name', 'asc')); 
        const querySnapshot = await getDocs(q);
        const fetchedSubjects: Subject[] = [];
        querySnapshot.forEach((doc) => {
          fetchedSubjects.push({ id: doc.id, ...doc.data() } as Subject);
        });
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        // Handle error display (e.g., toast message)
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-3xl">Explore Subjects</CardTitle>
              <CardDescription>Browse exam answers categorized by subject.</CardDescription>
            </div>
            {isAdmin && (
              <Button asChild>
                <Link href="/admin/subjects">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Subject
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search subjects by name or description..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* <Button variant="outline" disabled> 
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button> */}
          </div>
        </CardContent>
      </Card>

      {filteredSubjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <BookMarked className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-xl">{subject.name}</CardTitle>
                </div>
                <CardDescription className="line-clamp-3">{subject.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/subjects/${subject.id}`}>View {subject.name} Answers</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground py-8">
              {subjects.length === 0 ? "No subjects available at the moment. Admins can add new subjects." : "No subjects match your search criteria."}
            </p>
            {subjects.length > 0 && searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Loader2, LibrarySquare, ShieldAlert } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const subjectSchema = z.object({
  name: z.string().min(2, { message: 'Subject name must be at least 2 characters.' }).max(100),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }).max(500),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

export default function AdminAddSubjectPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(values: SubjectFormValues) {
    if (!user || !isAdmin) {
      toast({ title: 'Authorization Error', description: 'You are not authorized to perform this action.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const subjectData = {
        name: values.name,
        description: values.description,
        createdAt: serverTimestamp(),
        // You could add a 'slug' or 'id' field here if you want user-friendly URLs
        // and handle uniqueness checks, but Firestore auto-IDs are simpler for now.
      };
      
      const docRef = await addDoc(collection(db, 'subjects'), subjectData);
      
      toast({ title: 'Subject Added!', description: `Subject "${values.name}" has been added successfully.` });
      form.reset(); // Reset form after successful submission
      // Optionally redirect or update a list of subjects if displayed on this page
      // router.push('/admin/subjects'); 
    } catch (error) {
      console.error('Failed to add subject:', error);
      toast({ title: 'Submission Failed', description: 'Could not add the subject. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading) {
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
    <Card className="max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
            <LibrarySquare className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl">Add New Subject</CardTitle>
        </div>
        <CardDescription>Fill in the details below to add a new subject to the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Quantum Physics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of what this subject covers..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full md:w-auto" disabled={isLoading || !user || !isAdmin}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Subject
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

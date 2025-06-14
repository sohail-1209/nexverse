
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
// TODO: import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// TODO: import { db } from '@/lib/firebase';

const answerSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }).max(150),
  subject: z.string().min(1, { message: 'Please select a subject.' }),
  category: z.string().min(1, { message: 'Please select a category.' }),
  type: z.string().min(1, { message: 'Please select an answer type/mark.' }),
  content: z.string().min(50, { message: 'Answer content must be at least 50 characters.' }),
  tags: z.string().optional().describe('Comma-separated tags'),
  // file: typeof window === 'undefined' ? z.any().optional() : z.instanceof(FileList).optional().nullable(), // For file uploads
});

type AnswerFormValues = z.infer<typeof answerSchema>;

// TODO: Fetch subjects from Firestore or use a predefined list
const mockSubjects = [
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'mathematics', name: 'Mathematics' },
  { id: 'biology', name: 'Biology' },
  { id: 'computer_science', name: 'Computer Science' },
  { id: 'history', name: 'History' },
];

const answerCategories = ['Conceptual', 'Problem-Solving', 'Derivation', 'Diagram', 'Short Note', 'Comparison'];
const answerTypes = ['2-mark', '5-mark', '10-mark', '15-mark', 'Other'];

export default function UploadAnswerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AnswerFormValues>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      title: '',
      subject: '',
      category: '',
      type: '',
      content: '',
      tags: '',
    },
  });

  async function onSubmit(values: AnswerFormValues) {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to upload an answer.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      // TODO: Implement Firebase Firestore submission logic
      // const answerData = {
      //   ...values,
      //   tags: values.tags?.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
      //   userId: user.uid,
      //   authorName: user.displayName || user.email,
      //   createdAt: serverTimestamp(),
      //   isVerified: false, // Default to not verified
      //   views: 0,
      //   likes: 0,
      //   // fileURL: if file uploaded, store its URL here
      // };
      // const docRef = await addDoc(collection(db, 'answers'), answerData);
      
      console.log('Form submitted:', values); // Placeholder
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      toast({ title: 'Answer Uploaded!', description: 'Your answer has been submitted successfully.' });
      // router.push(`/answers/${docRef.id}`); // Redirect to the newly created answer
      router.push('/dashboard'); // Or redirect to dashboard or subject page
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload Failed', description: 'Could not submit your answer. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
            <UploadCloud className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl">Upload New Answer</CardTitle>
        </div>
        <CardDescription>Share your knowledge with the NExVERSE community. Fill in the details below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Explain Quantum Entanglement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockSubjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {answerCategories.map(category => (
                          <SelectItem key={category} value={category.toLowerCase().replace(' ', '_')}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type / Marks</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {answerTypes.map(type => (
                          <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide a detailed answer..." rows={10} {...field} />
                  </FormControl>
                  <FormDescription>
                    Please provide a comprehensive answer. You can use markdown for formatting.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* TODO: Add File Upload Field if needed
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attach File (Optional)</FormLabel>
                  <FormControl>
                     <Input type="file" onChange={(e) => field.onChange(e.target.files)} />
                  </FormControl>
                  <FormDescription>Upload diagrams, PDFs, or other relevant files.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            */}

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., mechanics, newton, conceptual" {...field} />
                  </FormControl>
                  <FormDescription>Comma-separated tags to help others find your answer.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Answer
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

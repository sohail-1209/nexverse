
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
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy as fbOrderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];


const answerSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }).max(150),
  subject: z.string().min(1, { message: 'Please select a subject.' }), // This will be subjectId
  category: z.string().min(1, { message: 'Please select a category.' }),
  type: z.string().min(1, { message: 'Please select an answer type/mark.' }),
  content: z.string().min(50, { message: 'Answer content must be at least 50 characters.' }),
  tags: z.string().optional().describe('Comma-separated tags'),
  file: typeof window === 'undefined' 
    ? z.any().optional() 
    : z.instanceof(FileList)
        .optional()
        .nullable()
        .refine(
          (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
          `Max file size is 100MB.`
        )
        .refine(
          (files) => !files || files.length === 0 || ACCEPTED_FILE_TYPES.includes(files[0].type),
          "Only .pdf, .doc, .docx, and .txt files are accepted."
        ),
});

type AnswerFormValues = z.infer<typeof answerSchema>;

interface SubjectOption {
  id: string;
  name: string;
}

const answerCategories = ['Conceptual', 'Problem-Solving', 'Derivation', 'Diagram', 'Short Note', 'Comparison'];
const answerTypes = ['2-mark', '5-mark', '10-mark', '15-mark', 'Other'];

export default function UploadAnswerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsSubjectsLoading(true);
      try {
        const subjectsCollection = collection(db, 'subjects');
        const q = query(subjectsCollection, fbOrderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedSubjects: SubjectOption[] = [];
        querySnapshot.forEach((doc) => {
          fetchedSubjects.push({ id: doc.id, name: doc.data().name as string });
        });
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error("Error fetching subjects for upload form:", error);
        toast({ title: "Error", description: "Could not load subjects. Please try again later.", variant: "destructive"});
      } finally {
        setIsSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const form = useForm<AnswerFormValues>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      title: '',
      subject: '',
      category: '',
      type: '',
      content: '',
      tags: '',
      file: null,
    },
  });

  async function onSubmit(values: AnswerFormValues) {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to upload an answer.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      let fileURL = null;
      let fileName = null;

      if (values.file && values.file.length > 0) {
        const fileToUpload = values.file[0];
        fileName = `${Date.now()}_${fileToUpload.name}`;
        const storageRef = ref(storage, `answers/${user.uid}/${fileName}`);
        await uploadBytes(storageRef, fileToUpload);
        fileURL = await getDownloadURL(storageRef);
      }

      const selectedSubject = subjects.find(s => s.id === values.subject);

      const answerData = {
        title: values.title,
        subjectId: values.subject, // This is the ID from 'subjects' collection
        subjectName: selectedSubject ? selectedSubject.name : 'Unknown Subject', 
        category: values.category,
        type: values.type,
        content: values.content,
        tags: values.tags?.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
        userId: user.uid,
        authorName: user.displayName || user.email,
        authorAvatar: user.photoURL || null,
        createdAt: serverTimestamp(),
        isVerified: false, 
        views: 0,
        likes: 0,
        fileURL: fileURL,
        fileName: fileName,
      };
      
      const docRef = await addDoc(collection(db, 'answers'), answerData);
      
      toast({ title: 'Answer Uploaded!', description: 'Your answer has been submitted successfully.' });
      router.push(`/answers/${docRef.id}?subject=${answerData.subjectId}`); 
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubjectsLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isSubjectsLoading ? "Loading subjects..." : "Select a subject"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isSubjectsLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : subjects.length > 0 ? (
                          subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                          ))
                        ) : (
                           <SelectItem value="no-subjects" disabled>No subjects available. Admin can add them.</SelectItem>
                        )}
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
            
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...rest } }) => ( 
                <FormItem>
                  <FormLabel>Attach File (Optional)</FormLabel>
                  <FormControl>
                     <Input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.txt" 
                        onChange={(e) => onChange(e.target.files)} 
                        {...rest}
                      />
                  </FormControl>
                  <FormDescription>Upload PDFs, Word documents, or text files (max 100MB).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <Button type="submit" className="w-full md:w-auto" disabled={isLoading || !user || isSubjectsLoading || subjects.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Answer
            </Button>
            {subjects.length === 0 && !isSubjectsLoading && (
                <p className="text-sm text-destructive mt-2">Cannot submit answer: No subjects available. Please ask an administrator to add subjects.</p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


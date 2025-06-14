
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, MessageCircle, Send, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100),
  message: z.string().min(20, 'Message must be at least 20 characters').max(1000),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
    setIsLoading(true);
    // TODO: Implement actual email sending logic or form submission to a backend service (e.g., Firebase Functions, Formspark, etc.)
    console.log('Contact form data:', data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    toast({
      title: 'Message Sent!',
      description: 'Thank you for contacting us. We will get back to you shortly.',
    });
    reset(); // Reset form fields
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="font-headline text-4xl">Get In Touch</CardTitle>
          <CardDescription>
            Have questions, feedback, or suggestions? We&apos;d love to hear from you!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name')} placeholder="John Doe" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" {...register('subject')} placeholder="Regarding..." />
              {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>}
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" {...register('message')} placeholder="Your message here..." rows={6} />
              {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="text-center mt-16">
        <h2 className="font-headline text-2xl font-semibold mb-4">Other Ways to Connect</h2>
        <p className="text-muted-foreground mb-2">
          You can also find us on social media (links coming soon!) or join our community forum.
        </p>
        <p className="text-sm text-muted-foreground">
          For urgent issues, please mark your subject line accordingly.
        </p>
        {/* Placeholder for social media icons or other contact info */}
         <div className="flex justify-center gap-4 mt-6">
            <Button variant="outline" disabled>
                <MessageCircle className="mr-2 h-4 w-4"/> Community Forum (Soon)
            </Button>
         </div>
      </section>
    </div>
  );
}

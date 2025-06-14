
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Lightbulb, GraduationCap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="font-headline text-5xl font-bold mb-4">About <span className="text-primary">NExVERSE</span></h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Empowering students with a collaborative platform to share, discover, and master exam knowledge, enhanced by the power of AI.
        </p>
      </section>

      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-headline text-3xl font-semibold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-4">
              NExVERSE was born from a simple idea: to make exam preparation less daunting and more effective. We believe that by pooling knowledge and leveraging smart technology, students can achieve their academic goals with greater confidence.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              Our platform provides a centralized repository for exam answers, meticulously organized by subject, category, and type. Users can contribute their own insights, learn from others, and utilize AI-powered tools to summarize complex topics or improve understanding.
            </p>
            <Button asChild size="lg">
              <Link href="/auth/signup">Join NExVERSE Today</Link>
            </Button>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl">
            <Image
              src="https://placehold.co/600x400.png"
              data-ai-hint="team collaboration"
              alt="Collaborative learning environment"
              layout="fill"
              objectFit="cover"
            />
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-headline text-3xl font-semibold text-center mb-10">What We Offer</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<GraduationCap className="h-10 w-10 text-primary" />}
            title="Comprehensive Answer Repository"
            description="Access a vast collection of exam answers organized by subject, category, and mark allocation, making it easy to find exactly what you need."
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-primary" />}
            title="Community-Driven Content"
            description="Upload your own answers, help others, and build a strong knowledge base together. Your contributions make NExVERSE better for everyone."
          />
          <FeatureCard
            icon={<Lightbulb className="h-10 w-10 text-primary" />}
            title="AI-Powered Learning Tools"
            description="Leverage generative AI to get summaries of long answers, suggestions for improvement, and engage in intelligent chat to clarify doubts."
          />
        </div>
      </section>
      
      <section className="text-center py-12 bg-secondary/30 rounded-lg">
        <h2 className="font-headline text-3xl font-semibold mb-4">Ready to Transform Your Studies?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          NExVERSE is more than just an app; it&apos;s a community dedicated to academic success.
        </p>
        <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/dashboard">Explore Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">Get In Touch</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="items-center p-0 mb-4">
        <div className="p-4 bg-primary/10 rounded-full mb-3">
          {icon}
        </div>
        <CardTitle className="font-headline text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}


import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4 text-left">
              <div className="space-y-2">
                <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Welcome to <span className="text-primary">NExVERSE</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Your ultimate companion for exam preparation. Organize, share, and discover answers efficiently.
                  Powered by AI to help you learn smarter.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="shadow-lg hover:shadow-primary/50 transition-shadow">
                  <Link href="/dashboard">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow-lg hover:shadow-accent/50 transition-shadow">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </div>
            <Image
              src="https://placehold.co/500x500.png"
              data-ai-hint="abstract circle"
              width="500"
              height="500"
              alt="Circular Placeholder Image"
              className="mx-auto aspect-square overflow-hidden rounded-full object-cover sm:w-full lg:order-last shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Why Choose NExVERSE?</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                NExVERSE offers a comprehensive suite of tools to streamline your exam preparation process.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-primary" />}
              title="AI-Powered Assistance"
              description="Get summaries and improvements for answers with our integrated GenAI."
            />
            <FeatureCard
              icon={<CheckCircle className="h-8 w-8 text-primary" />}
              title="Organized Repository"
              description="Find answers easily, sorted by subject, category, and marks."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-primary" />}
              title="Personalized Experience"
              description="Save bookmarks, manage your uploads, and track your progress."
            />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Ready to Ace Your Exams?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join NExVERSE today and transform your study habits. Sign up for free!
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2">
             <Button asChild size="lg" className="w-full shadow-lg hover:shadow-primary/50 transition-shadow">
                <Link href="/auth/signup">Create Your Account</Link>
              </Button>
            <p className="text-xs text-muted-foreground">
              Already have an account? <Link href="/auth/login" className="underline underline-offset-2 text-primary hover:text-primary/80">Log In</Link>
            </p>
          </div>
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
    <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        {icon}
      </div>
      <h3 className="font-headline text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

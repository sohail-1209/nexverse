
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="font-headline text-4xl">Privacy Policy</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none space-y-6">
          <p>
            Welcome to NExVERSE (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>

          <section>
            <h2 className="font-headline text-2xl font-semibold">1. Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the NExVERSE, express an interest in obtaining information about us or our products and services, when you participate in activities on the NExVERSE or otherwise when you contact us.
            </p>
            <p>
              The personal information that we collect depends on the context of your interactions with us and the NExVERSE, the choices you make and the products and features you use. The personal information we collect may include the following:
            </p>
            <ul>
              <li><strong>Personal Information Provided by You:</strong> We collect names; email addresses; usernames; passwords; contact preferences; and other similar information.</li>
              <li><strong>Content You Upload:</strong> We collect the answers, questions, comments, and other content you upload to the platform.</li>
              <li><strong>Usage Data:</strong> We may automatically collect information when you access and use the NExVERSE, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the NExVERSE.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold">2. How We Use Your Information</h2>
            <p>
              We use personal information collected via our NExVERSE for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
            </p>
             <ul>
              <li>To facilitate account creation and logon process.</li>
              <li>To post testimonials with your consent.</li>
              <li>To manage user accounts.</li>
              <li>To send administrative information to you.</li>
              <li>To protect our Services.</li>
              <li>To respond to user inquiries/offer support to users.</li>
              <li>For other Business Purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our NExVERSE, products, marketing and your experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold">3. Will Your Information Be Shared With Anyone?</h2>
            <p>
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
            </p>
            {/* More detailed sharing information would go here */}
          </section>
          
          <section>
            <h2 className="font-headline text-2xl font-semibold">4. How Long Do We Keep Your Information?</h2>
            <p>
                We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).
            </p>
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold">5. How Do We Keep Your Information Safe?</h2>
            <p>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold">6. Your Privacy Rights</h2>
            <p>
              In some regions (like the EEA, UK, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability. In certain circumstances, you may also have the right to object to the processing of your personal information.
            </p>
            <p>You can review or change the information in your account or terminate your account by logging into your account settings and updating your user account or by contacting us using the contact information provided.</p>
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold">7. Updates To This Notice</h2>
            <p>
              We may update this privacy notice from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date and the updated version will be effective as soon as it is accessible.
            </p>
          </section>

          <section>
            <h2 className="font-headline text-2xl font-semibold">8. How Can You Contact Us About This Notice?</h2>
            <p>
              If you have questions or comments about this notice, you may email us at [Your Contact Email] or by post to:
            </p>
            <p>
              [Your Company Name, if applicable]
              <br />
              [Your Address, if applicable]
            </p>
            <p className="mt-4"><em>(Please replace placeholder contact information above)</em></p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

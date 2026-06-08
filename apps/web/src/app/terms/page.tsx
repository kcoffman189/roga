import Link from "next/link";

export default function Terms() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="mb-8">
          <Link href="/" className="text-sm" style={{color: '#C45E0A'}}>
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2" style={{fontFamily: 'Georgia, serif'}}>
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: June 2, 2026</p>

        <div className="prose prose-lg max-w-none text-gray-700" style={{fontFamily: 'Georgia, serif'}}>

          <p className="leading-relaxed mb-6">
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Cephos service, including the website at cephos.io, the Cephos mobile application, and any related services (collectively, the &quot;Service&quot;), provided by Cephos LLC (&quot;Cephos,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
          </p>
          <p className="leading-relaxed mb-8">
            By creating an account or using the Service, you agree to be bound by these Terms and our Privacy Policy (cephos.io/privacy), which is incorporated here by reference. If you do not agree to these Terms, do not use the Service.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">1. Eligibility</h2>
          <p className="leading-relaxed mb-6">
            You must be at least 16 years of age to use the Service. By creating an account, you represent that you are at least 16 years old. We do not knowingly permit users under 16 to access the Service. If we learn that a user is under 16, we will terminate their account.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">2. Accounts</h2>
          <p className="leading-relaxed mb-4">To access the Service, you must create an account using a valid email address. You are responsible for:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Providing accurate and complete information when creating your account.</li>
            <li>Maintaining the confidentiality of your account credentials.</li>
            <li>All activity that occurs under your account.</li>
            <li>Notifying us immediately at support@cephos.io if you believe your account has been compromised.</li>
          </ul>
          <p className="leading-relaxed mb-6">
            You may not share your account with others or create accounts on behalf of others without authorization. We reserve the right to terminate accounts that violate these Terms.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">3. The Service</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Description</h3>
          <p className="leading-relaxed mb-4">
            Cephos is an AI-powered intellectual exploration tool. The Service allows you to build a personal book library and engage with an AI that surfaces unexpected connections between the books you have read. The AI draws on its existing knowledge of books and on your personal library and conversation history to provide a personalized experience.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 AI Disclosure</h3>
          <p className="leading-relaxed mb-4">
            The Cephos Service is powered by AI technology, specifically the Anthropic Claude API. You are interacting with an AI language model, not a human. The AI generates responses based on patterns in training data and your inputs — it does not have independent judgment, expertise, or real-world knowledge of events after its training cutoff. It may produce responses that are incorrect, incomplete, or that reflect biases present in its training data. It is not a substitute for professional advice of any kind.
          </p>
          <p className="leading-relaxed mb-6">
            Cephos does not warrant the accuracy, completeness, or reliability of any AI-generated content. You are responsible for independently evaluating any information or insights the Service provides.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Service Availability</h3>
          <p className="leading-relaxed mb-6">
            We will make reasonable efforts to maintain Service availability, but the Service is provided on an &quot;as is&quot; basis. We do not guarantee uninterrupted or error-free operation. We may suspend or discontinue the Service or any part of it at any time for maintenance, updates, or other reasons, with reasonable notice where practicable.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">4. Subscription Plans and Payment</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Plans</h3>
          <p className="leading-relaxed mb-4">Cephos offers the following subscription tiers (pricing subject to change with notice):</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Free: Limited access to the Service for evaluation purposes.</li>
            <li>Standard: Full access at $15/month.</li>
            <li>Scholar: Enhanced access at $25/month.</li>
            <li>Curator: Premium access at $40/month.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Billing and Auto-Renewal</h3>
          <p className="leading-relaxed mb-4 font-semibold">
            IMPORTANT NOTICE REGARDING AUTO-RENEWAL: Paid subscriptions automatically renew at the end of each billing period (monthly) at the then-current subscription price, unless you cancel before the renewal date. By subscribing to a paid plan, you authorize us to charge your payment method on a recurring basis.
          </p>
          <p className="leading-relaxed mb-6">
            We will notify you of any price change at least 30 days before the change takes effect. Your continued use of the Service after a price change constitutes acceptance of the new price.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Cancellation</h3>
          <p className="leading-relaxed mb-6">
            You may cancel your subscription at any time through your account settings or by contacting us at support@cephos.io. Cancellation takes effect at the end of your current billing period. You will retain access to paid features until the end of the period for which you have paid.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Refunds</h3>
          <p className="leading-relaxed mb-6">
            We do not generally offer refunds for subscription fees already charged. Exceptions may be made at our discretion in cases of billing errors or extenuating circumstances. Contact support@cephos.io within 14 days of a charge if you believe an error has occurred.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">4.5 Web Payment Processing</h3>
          <p className="leading-relaxed mb-6">
            Web payments are processed by Stripe. By providing payment information, you agree to Stripe&apos;s terms of service and authorize Stripe to charge your payment method on our behalf. We do not store payment card information on our systems.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">4.6 California Auto-Renewal Disclosure</h3>
          <p className="leading-relaxed mb-6">
            For users in California: Your subscription will automatically renew and your payment method will be charged at the applicable rate unless you cancel at least 24 hours before the end of the current billing period. You may cancel at any time as described in Section 4.3. This disclosure is provided pursuant to California Business and Professions Code Section 17601 et seq.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">4.7 In-App Purchases (iOS)</h3>
          <p className="leading-relaxed mb-4">If you purchase a subscription through the Apple App Store, the following additional terms apply:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Payment will be charged to your Apple ID account at confirmation of purchase.</li>
            <li>Subscriptions automatically renew unless auto-renewal is turned off at least 24 hours before the end of the current subscription period.</li>
            <li>Your account will be charged for renewal within 24 hours prior to the end of the current period at the applicable subscription rate.</li>
            <li>You may manage your subscription and turn off auto-renewal at any time through your Apple ID account settings in the App Store.</li>
            <li>If a free trial is offered, any unused portion of the trial period will be forfeited upon purchase of a subscription.</li>
            <li>Refunds for App Store purchases are handled by Apple in accordance with Apple&apos;s refund policy. Cephos does not control and cannot process refunds for App Store purchases.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">5. Your Content and Data</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Your Content</h3>
          <p className="leading-relaxed mb-6">
            You retain ownership of content you provide to the Service, including your book library data and conversation inputs (&quot;Your Content&quot;). By using the Service, you grant Cephos a limited, non-exclusive license to use Your Content solely to provide the Service to you.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Prohibited Content</h3>
          <p className="leading-relaxed mb-4">You agree not to submit to the Service any content that:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
            <li>Infringes any third-party intellectual property, privacy, or other rights.</li>
            <li>Attempts to manipulate, jailbreak, or circumvent the AI&apos;s safety guidelines or intended functionality.</li>
            <li>Is intended to generate illegal content or content that would violate these Terms if acted upon.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Data Handling</h3>
          <p className="leading-relaxed mb-4">We handle your personal information as described in our Privacy Policy. Key points:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Your conversation history is stored long-term to enable the AI to provide personalized and contextually relevant responses.</li>
            <li>Your data is not used to train AI models without your express permission.</li>
            <li>You may request deletion of your conversation history or account data at any time through the Service or by contacting privacy@cephos.io.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">6. Acceptable Use</h2>
          <p className="leading-relaxed mb-4">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Use the Service in any way that violates applicable laws or regulations.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
            <li>Reverse engineer, decompile, or attempt to extract the source code of the Service.</li>
            <li>Use automated tools (bots, scrapers, crawlers) to access the Service without our express written permission.</li>
            <li>Resell, sublicense, or provide access to the Service to third parties without authorization.</li>
            <li>Use the Service in a manner that interferes with or disrupts other users or our infrastructure.</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">7. Intellectual Property</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Cephos&apos;s Intellectual Property</h3>
          <p className="leading-relaxed mb-6">
            The Service, including its software, design, features, and content (excluding Your Content and AI-generated outputs), is owned by Cephos or its licensors and is protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms. No other rights are granted.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">7.2 AI-Generated Content</h3>
          <p className="leading-relaxed mb-6">
            The Service generates content through AI in response to your inputs. The intellectual property status of AI-generated content is subject to evolving law. Cephos does not claim copyright ownership over AI-generated outputs produced through your use of the Service.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">8. Third-Party Services</h2>
          <p className="leading-relaxed mb-6">
            The Service relies on third-party providers including Anthropic (AI processing), Supabase (database and authentication), Vercel (hosting), Fly.io (backend infrastructure), Resend (email delivery), Apple (iOS distribution and in-app purchases), and Stripe (web payment processing). Your use of the Service is also subject to the terms and policies of these providers where applicable. We are not responsible for the practices or content of third-party providers.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">9. Disclaimer of Warranties</h2>
          <p className="leading-relaxed mb-6 uppercase text-sm">
            The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, non-infringement, or accuracy of AI-generated content. Some jurisdictions do not allow exclusion of implied warranties, so some of the above exclusions may not apply to you.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">10. Limitation of Liability</h2>
          <p className="leading-relaxed mb-6 uppercase text-sm">
            To the maximum extent permitted by applicable law, Cephos and its officers, directors, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, arising from your use of the service. Our total cumulative liability to you for any claim will not exceed the greater of: (a) the amounts you have paid to Cephos in the 12 months before the claim arose; or (b) $100 USD.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">11. Indemnification</h2>
          <p className="leading-relaxed mb-6">
            You agree to defend, indemnify, and hold harmless Cephos and its officers, directors, employees, and agents from any claims, damages, losses, and expenses (including reasonable attorneys&apos; fees) arising from: (a) your use of the Service; (b) Your Content; (c) your violation of these Terms; or (d) your violation of any applicable law or third-party rights.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">12. Termination</h2>
          <p className="leading-relaxed mb-6">
            You may terminate your account at any time by deleting your account through the Service settings or by contacting us at support@cephos.io. We may suspend or terminate your access to the Service at any time, with or without cause, including if we reasonably believe you have violated these Terms. Upon termination, your right to use the Service ceases immediately.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">13. Governing Law and Dispute Resolution</h2>
          <p className="leading-relaxed mb-6">
            These Terms are governed by the laws of the State of Colorado, without regard to its conflict of law provisions. You agree that any dispute arising from or relating to these Terms or the Service will be resolved in the state or federal courts located in Jefferson County, Colorado, and you consent to personal jurisdiction in those courts.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">14. Changes to These Terms</h2>
          <p className="leading-relaxed mb-6">
            We may update these Terms from time to time. When we make material changes, we will notify you by email or by posting a notice within the Service at least 14 days before the change takes effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">15. General Provisions</h2>
          <p className="leading-relaxed mb-2"><strong>Entire Agreement:</strong> These Terms and the Privacy Policy constitute the entire agreement between you and Cephos regarding the Service.</p>
          <p className="leading-relaxed mb-2"><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</p>
          <p className="leading-relaxed mb-2"><strong>No Waiver:</strong> Our failure to enforce any provision of these Terms is not a waiver of our right to enforce it in the future.</p>
          <p className="leading-relaxed mb-6"><strong>Assignment:</strong> We may assign these Terms without your consent. You may not assign these Terms without our prior written consent.</p>

          <h2 className="text-2xl font-bold mt-10 mb-4">16. Contact Us</h2>
          <p className="leading-relaxed mb-2">Email: support@cephos.io</p>
          <p className="leading-relaxed mb-2">Website: cephos.io</p>
          <p className="leading-relaxed mb-8">Company: Cephos LLC, 24772 Westridge Rd, Golden, CO 80403, US</p>

          <p className="text-sm text-gray-500 mt-10">Last updated: June 2, 2026</p>
        </div>
      </div>
    </main>
  );
}

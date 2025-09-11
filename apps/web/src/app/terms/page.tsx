import Link from "next/link";

export default function Terms() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="mb-8">
          <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm">
            ← Back to Home
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8" style={{fontFamily: 'Georgia, serif'}}>
          Terms of Service
        </h1>
        
        <div className="prose prose-lg max-w-none" style={{fontFamily: 'Georgia, serif'}}>
          <p className="text-sm text-gray-600 mb-6">Effective Date: 9/11/2025</p>
          
          <p className="text-gray-700 leading-relaxed mb-6">
            Welcome to Roga ("Roga," "we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the Roga website, mobile applications, and related services (collectively, the "Service").
          </p>
          
          <p className="text-gray-700 leading-relaxed mb-6">
            By using the Service, you agree to these Terms. If you do not agree, do not use the Service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Ownership of Content</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>1.1 Roga Content.</strong> All content provided by Roga — including the Question Intelligence ("QI") framework, taxonomies, rubrics, scenarios, feedback, scoring algorithms, and datasets — is owned by Roga and protected under intellectual property laws.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>1.2 User Contributions.</strong> By submitting questions, responses, or other content ("User Content"), you grant Roga a worldwide, royalty-free, perpetual, irrevocable license to use, reproduce, modify, analyze, and commercialize your User Content as part of the Service. You retain ownership of your original User Content.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            <strong>1.3 Aggregated Data.</strong> Roga may aggregate and anonymize User Content and usage data. Aggregated data is owned by Roga and may be used for research, benchmarking, training, and commercial purposes.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Restrictions</h2>
          <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
          <ul className="text-gray-700 leading-relaxed mb-6">
            <li>Copy, distribute, or create derivative works of Roga Content without written consent.</li>
            <li>Use automated systems (including bots or scrapers) to extract or replicate data.</li>
            <li>Reverse-engineer, decompile, or attempt to derive the underlying framework or algorithms.</li>
            <li>Use the Service for unlawful purposes or in violation of these Terms.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Privacy</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Your use of the Service is also governed by our Privacy Policy, which explains how we collect, use, and share information.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Disclaimers</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The Service is provided "as is" and "as available." Roga disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            We do not guarantee that the Service will be error-free, secure, or uninterrupted.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            To the fullest extent permitted by law, Roga and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising out of your use of the Service.
          </p>
          <p className="text-gray-700 leading-relaxed mb-6">
            Our total liability for any claim shall not exceed $100.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Indemnification</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            You agree to indemnify and hold harmless Roga, its officers, employees, and agents, from any claims, damages, or expenses arising from your use of the Service or your violation of these Terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Dispute Resolution</h2>
          <ul className="text-gray-700 leading-relaxed mb-6">
            <li><strong>Governing Law.</strong> These Terms are governed by the laws of the State of Delaware, without regard to conflicts of law.</li>
            <li><strong>Arbitration.</strong> Any dispute shall be resolved by binding arbitration under the rules of the American Arbitration Association.</li>
            <li><strong>Venue.</strong> Proceedings shall take place in Denver, Colorado, unless otherwise agreed.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Termination</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Roga may suspend or terminate your access to the Service at any time for violation of these Terms.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. Changes to Terms</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance.
          </p>
        </div>
      </div>
    </main>
  );
}
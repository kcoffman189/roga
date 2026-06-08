import Link from "next/link";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="mb-8">
          <Link href="/" className="text-sm" style={{color: '#C45E0A'}}>
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2" style={{fontFamily: 'Georgia, serif'}}>
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-10">Effective Date: June 2, 2026</p>

        <div className="prose prose-lg max-w-none text-gray-700" style={{fontFamily: 'Georgia, serif'}}>

          <p className="leading-relaxed mb-6">
            This Privacy Policy describes how Cephos LLC (&quot;Cephos,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, stores, and shares information when you use the Cephos service available at cephos.io and through the Cephos mobile application (collectively, the &quot;Service&quot;). By using the Service, you agree to the collection and use of information as described here.
          </p>
          <p className="leading-relaxed mb-8">
            If you are located in the European Economic Area (EEA), the United Kingdom, or Canada, additional rights and protections apply to you as described in the relevant sections below.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">1. Who We Are</h2>
          <p className="leading-relaxed mb-2">Cephos LLC is the data controller responsible for your personal information.</p>
          <p className="leading-relaxed mb-2">Contact: privacy@cephos.io</p>
          <p className="leading-relaxed mb-2">Website: cephos.io</p>
          <p className="leading-relaxed mb-6">Company: Cephos LLC, 24772 Westridge Rd, Golden, CO 80403, US</p>

          <h2 className="text-2xl font-bold mt-10 mb-4">2. Minimum Age Requirement</h2>
          <p className="leading-relaxed mb-6">
            The Service is intended for users who are at least 16 years of age. We do not knowingly collect personal information from individuals under 16. If we become aware that we have collected personal information from a person under 16 without verification, we will delete that information promptly. If you believe we may have collected information from a minor, please contact us at privacy@cephos.io.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">3. Information We Collect</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Information You Provide Directly</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Account registration information, including your email address and password (managed through Supabase authentication).</li>
            <li>Your personal book library — the titles and authors you add to the Service, along with familiarity and rating information you provide about those books.</li>
            <li>Conversation content — the messages and exchanges you have with the Cephos AI during your sessions. These conversations are retained long-term to enable the Service to provide personalized and contextually relevant responses over time.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Technical data, including your IP address, browser type, device type, operating system, and access logs.</li>
            <li>Authentication session data managed by our authentication provider.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Information We Do Not Collect</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Payment information. Payments made through the App Store are processed directly by Apple and are not stored on our systems. Web payments are processed by Stripe and are not stored on our systems.</li>
            <li>Sensitive personal data such as racial or ethnic origin, political opinions, health data, or biometric data.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">4. How We Use Your Information</h2>
          <p className="leading-relaxed mb-4">We use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>To provide, operate, and maintain the Service, including personalizing your experience based on your library and conversation history.</li>
            <li>To authenticate your identity and manage your account.</li>
            <li>To enable the core Service feature: surfacing unexpected connections between the books in your library using AI analysis.</li>
            <li>To communicate with you about your account, updates to the Service, or changes to this Privacy Policy.</li>
            <li>To comply with legal obligations and enforce our Terms of Service.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">Lawful Basis for Processing (EEA and UK Users)</h3>
          <p className="leading-relaxed mb-4">If you are located in the EEA or UK, we process your personal data under the following lawful bases:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Contract:</strong> Processing necessary to provide the Service you have requested.</li>
            <li><strong>Legitimate interests:</strong> Processing for service improvement, where our interests are not overridden by your rights.</li>
            <li><strong>Legal obligation:</strong> Processing required to comply with applicable law.</li>
            <li><strong>Consent:</strong> Where we rely on consent, you may withdraw it at any time by contacting privacy@cephos.io.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-10 mb-4">5. AI and Third-Party Processing</h2>
          <p className="leading-relaxed mb-4">
            The Service is powered by the Anthropic Claude API. When you interact with the Cephos AI, your conversation content and relevant library data are transmitted to Anthropic for processing to generate responses.
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Anthropic does not use API-submitted data to train its AI models by default under its standard API terms.</li>
            <li>Cephos does not use your conversation content or library data to train AI models. Your retained data is never used for model training without your express permission.</li>
            <li>Anthropic processes data in accordance with its own privacy policy, available at anthropic.com.</li>
          </ul>
          <p className="leading-relaxed mb-6">
            You are interacting with an AI system. Cephos&apos;s responses are generated by an AI language model and are not the product of a human advisor, librarian, or subject matter expert.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">6. Data Sharing and Disclosure</h2>
          <p className="leading-relaxed mb-6">
            We do not sell your personal information. We do not share your personal information with third parties for their own marketing purposes.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Service Providers (Data Processors)</h3>
          <p className="leading-relaxed mb-4">We use the following third-party service providers who process personal data on our behalf:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Anthropic, PBC — AI language model processing (San Francisco, CA, USA)</li>
            <li>Supabase, Inc. — database hosting and user authentication</li>
            <li>Vercel, Inc. — frontend hosting and delivery</li>
            <li>Fly.io — backend infrastructure hosting and API processing</li>
            <li>Cloudflare, Inc. — DNS, SSL, and network infrastructure</li>
            <li>Resend — transactional email delivery</li>
            <li>Apple Inc. — iOS app distribution and in-app purchase processing</li>
            <li>Stripe, Inc. — web subscription payment processing</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Legal Requirements</h3>
          <p className="leading-relaxed mb-6">
            We may disclose your information if required to do so by law or in response to a valid legal request, such as a court order or government inquiry.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Business Transfers</h3>
          <p className="leading-relaxed mb-6">
            If Cephos is involved in a merger, acquisition, or sale of assets, your personal information may be transferred as part of that transaction. We will provide notice before your information is subject to a materially different privacy policy.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">7. Data Retention</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Account information is retained for the lifetime of your account and for a reasonable period after account closure to comply with legal obligations.</li>
            <li>Your book library data is retained for the lifetime of your account.</li>
            <li>Conversation history is retained long-term as a core feature of the Service. You may request deletion at any time.</li>
            <li>Technical log data is retained for a limited period for security and operational purposes.</li>
          </ul>
          <p className="leading-relaxed mb-6">
            When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">8. Your Rights</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Rights for All Users</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Access:</strong> You may request a copy of the personal information we hold about you.</li>
            <li><strong>Deletion:</strong> You may request that we delete your personal information, or delete it directly through the Service interface.</li>
            <li><strong>Correction:</strong> You may request that we correct inaccurate personal information.</li>
            <li><strong>Portability:</strong> You may request a copy of your data in a machine-readable format.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Additional Rights for EEA and UK Users (GDPR / UK GDPR)</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Restriction: You may request that we restrict processing of your data in certain circumstances.</li>
            <li>Objection: You may object to processing based on legitimate interests.</li>
            <li>Right to lodge a complaint with your local data protection authority. In the UK: ico.org.uk.</li>
          </ul>
          <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Rights for California Users (CCPA / CPRA)</h3>
          <p className="leading-relaxed mb-6">
            California residents have the right to know what personal information is collected, to request deletion, to opt out of sale (we do not sell personal information), and to non-discrimination for exercising these rights.
          </p>
          <h3 className="text-xl font-semibold mt-6 mb-3">8.4 Rights for Canadian Users (PIPEDA)</h3>
          <p className="leading-relaxed mb-6">
            Canadian users have the right to access personal information held about them and to challenge its accuracy. We respond to access requests within 30 days.
          </p>
          <p className="leading-relaxed mb-6">
            To exercise any of these rights, contact us at privacy@cephos.io. We will respond within 30 days.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">9. Data Security</h2>
          <p className="leading-relaxed mb-6">
            We implement reasonable administrative, technical, and physical safeguards designed to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include encrypted data transmission (HTTPS/TLS), authentication controls, and access controls. No method of transmission over the internet is completely secure. If you believe your account has been compromised, contact us immediately at privacy@cephos.io.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">10. International Data Transfers</h2>
          <p className="leading-relaxed mb-6">
            Cephos is operated from the United States. If you access the Service from the EEA, UK, Canada, or another jurisdiction with data protection laws, your information may be transferred to and processed in the United States. For transfers from the EEA or UK, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">11. Cookies and Tracking</h2>
          <p className="leading-relaxed mb-6">
            We use session cookies and similar technologies to maintain your authentication state while you use the Service. We do not currently use advertising cookies or cross-site tracking technologies. You can configure your browser to refuse cookies, but doing so may affect your ability to log in and use the Service.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">12. Changes to This Privacy Policy</h2>
          <p className="leading-relaxed mb-6">
            We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by posting a notice within the Service at least 14 days before the change takes effect. Your continued use of the Service after the effective date constitutes your acceptance of the updated terms.
          </p>

          <h2 className="text-2xl font-bold mt-10 mb-4">13. Contact Us</h2>
          <p className="leading-relaxed mb-2">Email: privacy@cephos.io</p>
          <p className="leading-relaxed mb-2">Website: cephos.io</p>
          <p className="leading-relaxed mb-8">Company: Cephos LLC, 24772 Westridge Rd, Golden, CO 80403, US</p>
          <p className="leading-relaxed mb-6">We aim to respond to all inquiries within 5 business days.</p>

          <p className="text-sm text-gray-500 mt-10">Last updated: June 2, 2026</p>
        </div>
      </div>
    </main>
  );
}

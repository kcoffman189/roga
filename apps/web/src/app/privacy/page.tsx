import Link from "next/link";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="mb-8">
          <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm">
            ← Back to Home
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8" style={{fontFamily: 'Georgia, serif'}}>
          Privacy Policy
        </h1>
        
        <div className="prose prose-lg max-w-none" style={{fontFamily: 'Georgia, serif'}}>
          <p className="text-sm text-gray-600 mb-6">Effective Date: 9/11/2025</p>
          
          <p className="text-gray-700 leading-relaxed mb-6">
            Roga (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) values your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our Service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
          <ul className="text-gray-700 leading-relaxed mb-6">
            <li><strong>Account Information:</strong> Name, email, and login credentials.</li>
            <li><strong>User Content:</strong> Questions, responses, and interactions submitted by you.</li>
            <li><strong>Usage Data:</strong> Device information, IP address, browser type, and usage activity.</li>
            <li><strong>Cookies & Tracking:</strong> We use cookies and analytics tools to improve the Service.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Information</h2>
          <ul className="text-gray-700 leading-relaxed mb-6">
            <li>To provide, maintain, and improve the Service.</li>
            <li>To analyze usage patterns and enhance Question Intelligence (QI) frameworks.</li>
            <li>To develop aggregated, anonymized datasets for benchmarking and research.</li>
            <li>For security, legal compliance, and fraud prevention.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. Sharing of Information</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We do not sell your personal information. We may share information:
          </p>
          <ul className="text-gray-700 leading-relaxed mb-6">
            <li>With service providers assisting in operations (hosting, analytics, security).</li>
            <li>As required by law, regulation, or legal process.</li>
            <li>In connection with a merger, acquisition, or sale of assets.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Ownership</h2>
          <ul className="text-gray-700 leading-relaxed mb-6">
            <li>You retain ownership of your original User Content.</li>
            <li>By contributing, you grant Roga rights to use and incorporate User Content into the Service.</li>
            <li>Aggregated/anonymized data is solely owned by Roga.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Security</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            We use reasonable technical and organizational measures to protect data. However, no system is 100% secure.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Your Choices</h2>
          <ul className="text-gray-700 leading-relaxed mb-6">
            <li>You may access or delete your account at any time.</li>
            <li>You may opt out of cookies via browser settings.</li>
            <li>Contact us for data access or deletion requests.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. International Users</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            If you access the Service outside the U.S., you consent to your data being transferred to and processed in the United States.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Children&apos;s Privacy</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            The Service is not directed to children under 13 (or 16 where applicable by law). We do not knowingly collect data from children.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. Changes to Policy</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            We may update this Privacy Policy from time to time. Continued use of the Service after changes take effect constitutes acceptance.
          </p>
        </div>
      </div>
    </main>
  );
}
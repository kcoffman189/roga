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
          <p className="text-gray-700 leading-relaxed">
            {/* Privacy policy content will go here */}
            Your privacy policy content goes here. Please provide the wording you'd like to use.
          </p>
        </div>
      </div>
    </main>
  );
}
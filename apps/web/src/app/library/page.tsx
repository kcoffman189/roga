import BrandMark from "@/components/ui/BrandMark";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function Library() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-teal py-6 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size={40} />
            <span className="text-white text-3xl" style={{ fontFamily: 'Georgia, serif' }}>
              roga
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-5xl heading mb-6 text-center">Roga Library</h1>
        <p className="text-xl copy text-center mb-12">
          Your Question Intelligence resource center
        </p>

        <Card className="p-8 text-center">
          <p className="copy text-lg">
            The Roga Library is coming soon. This will be your hub for QI frameworks, techniques, and learning resources.
          </p>
          <div className="mt-8">
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

import BrandMark from "@/components/ui/BrandMark";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* TEAL SECTION - 80-85% viewport with all content */}
      <section className="min-h-[85vh] relative px-6 py-6" style={{backgroundColor: '#20B2AA'}}>
        {/* Logo in top-left corner with proper spacing and Georgia font */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <BrandMark size={80} />
          <span className="text-white text-3xl" style={{fontFamily: 'Georgia, serif'}}>roga</span>
        </div>
        
        {/* Centered hero content */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="heading text-white text-6xl md:text-7xl lg:text-8xl leading-tight">
            The art of asking
          </h1>
          <p className="text-white text-xl md:text-2xl max-w-3xl mx-auto">
            Sharpen your Question Intelligence with daily challenges and deep practice.
          </p>
          <div className="flex justify-center gap-6 mt-12">
            <Link href="/game">
              <Button className="text-lg px-8 py-4">Start Daily Challenge</Button>
            </Link>
            <Button 
              variant="ghost" 
              className="text-lg px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-teal-600"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* FEATURE CARDS HORIZONTAL ROW */}
        <div className="max-w-6xl mx-auto mt-16">
          <div className="flex flex-row gap-8 justify-center items-stretch">
            <Card className="text-center py-8 flex-1 max-w-sm">
              <div className="text-6xl mb-6" style={{color: '#FF8C00'}}>⏱️</div>
              <h3 className="heading text-2xl mb-4">Daily Challenge</h3>
              <p className="copy text-lg">2-3 minute scenarios with fast feedback</p>
            </Card>

            <Card className="text-center py-8 flex-1 max-w-sm">
              <div className="text-6xl mb-6" style={{color: '#8A2BE2'}}>💬</div>
              <h3 className="heading text-2xl mb-4">Deep Practice</h3>
              <p className="copy text-lg">10-15 minute multi-round roleplay</p>
            </Card>

            <Card className="text-center py-8 flex-1 max-w-sm">
              <div className="text-6xl mb-6" style={{color: '#DC143C'}}>🏆</div>
              <h3 className="heading text-2xl mb-4">Streaks & Badges</h3>
              <p className="copy text-lg">Keep your curiosity going</p>
            </Card>
          </div>
        </div>
      </section>

      {/* MINIMAL WHITE FOOTER SECTION */}
      <footer className="bg-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-lg text-gray-700">
              Roga trains Question Intelligence — the art of asking better questions.
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-600 hover:text-gray-900">Privacy</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Terms</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

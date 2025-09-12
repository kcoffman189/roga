import BrandMark from "@/components/ui/BrandMark";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* TEAL SECTION - 80-85% viewport with all content */}
      <section className="min-h-[84vh] relative px-6 py-6" style={{backgroundColor: '#20B2AA'}}>
        {/* Logo positioned further down and right with massive font size */}
        <div className="absolute top-20 flex items-center gap-4" style={{left: '86px'}}>
          <BrandMark size={80} />
          <span className="text-white" style={{fontFamily: 'Georgia, serif', fontSize: '6rem', color: 'white'}}>roga</span>
        </div>
        
        {/* Centered hero content */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 max-w-4xl mx-auto" style={{transform: 'translateY(35px)'}}>
          <h1 className="text-white text-7xl md:text-8xl lg:text-9xl leading-tight" style={{fontFamily: 'Georgia, serif', color: 'white'}}>
            The art of asking
          </h1>
          <p className="text-white text-xl md:text-2xl max-w-3xl mx-auto" style={{fontFamily: 'Georgia, serif', color: 'white'}}>
            Sharpen your Question Intelligence with daily challenges and deep practice.
          </p>
          <div className="flex justify-center gap-6 mt-12" style={{gap: '20px'}}>
            <Link href="/game">
              <Button className="text-lg px-8 py-4 border-0">Start Daily Challenge</Button>
            </Link>
            <Button 
              variant="ghost" 
              className="text-lg px-8 py-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-teal-600"
            >
              Roga Sessions
            </Button>
          </div>
        </div>

        {/* FEATURE CARDS - 50% NARROWER WITH FOG BACKGROUND */}
        <div className="max-w-4xl mx-auto mt-16" style={{transform: 'translateY(-10px)'}}>
          <div className="flex flex-row justify-center items-stretch" style={{gap: '20px'}}>
            <Card className="text-center py-8 px-4 w-40" style={{minHeight: '215px', width: '160px'}}>
              <div className="h-16 mb-4 flex items-center justify-center">
                <Image src="/brand/stopwatch.svg" alt="Daily Challenge" width={48} height={48} />
              </div>
              <h3 className="heading text-sm mb-3 break-words">Daily Challenge</h3>
              <p className="copy text-xs break-words">2-3 minute scenarios with fast feedback</p>
            </Card>

            <Card className="text-center py-8 px-4 w-40" style={{minHeight: '215px', width: '160px'}}>
              <div className="h-16 mb-4 flex items-center justify-center">
                <Image src="/brand/deep_practice_icon.svg" alt="Deep Practice" width={48} height={48} />
              </div>
              <h3 className="heading text-sm mb-3 break-words">Deep Practice</h3>
              <p className="copy text-xs break-words">10-15 minute multi-round roleplay</p>
            </Card>

            <Card className="text-center py-8 px-4 w-40" style={{minHeight: '215px', width: '160px'}}>
              <div className="h-16 mb-4 flex items-center justify-center">
                <Image src="/brand/trophy_icon.svg" alt="Streaks & Badges" width={48} height={48} />
              </div>
              <h3 className="heading text-sm mb-3 break-words">Streaks & Badges</h3>
              <p className="copy text-xs break-words">Keep your curiosity going</p>
            </Card>
          </div>
        </div>
      </section>

      {/* MINIMAL WHITE FOOTER SECTION */}
      <footer className="bg-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-lg text-gray-700" style={{fontFamily: 'Georgia, serif'}}>
              Roga trains Question Intelligence — the art of asking better questions.
            </p>
          </div>
          <div className="flex text-sm" style={{gap: '10px'}}>
            <Link href="/privacy" style={{color: 'black'}} className="hover:text-gray-700">Privacy</Link>
            <Link href="/terms" style={{color: 'black'}} className="hover:text-gray-700">Terms</Link>
            <a href="#" style={{color: 'black'}} className="hover:text-gray-700">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

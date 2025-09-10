import BrandMark from "@/components/ui/BrandMark";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function Home() {
  return (
    <main className="px-6 py-12">
      {/* HERO */}
      <section className="max-w-5xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-3">
          <BrandMark size={56} />
          <h1 className="heading text-3xl md:text-4xl">Roga</h1>
        </div>
        <p className="tagline">The art of asking.</p>
        <p className="copy max-w-2xl mx-auto">
          Sharpen your Question Intelligence with daily challenges and deep practice.
        </p>
        <div className="flex justify-center gap-4">
          <Button>Start Daily Challenge</Button>
          <Button variant="ghost">Learn More</Button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto mt-16 grid gap-6 md:grid-cols-3">
        <Card>
          <h3 className="heading text-xl mb-2">Daily Challenge</h3>
          <p className="copy">2–3 minute scenarios with fast feedback.</p>
          <div className="mt-4"><Badge>+10 Insight XP</Badge></div>
        </Card>

        <Card>
          <h3 className="heading text-xl mb-2">Deep Practice</h3>
          <p className="copy">10–15 minute multi-round roleplay with a session summary.</p>
        </Card>

        <Card>
          <h3 className="heading text-xl mb-2">Streaks & Badges</h3>
          <p className="copy">Keep your curiosity going with streaks and collectibles.</p>
        </Card>
      </section>

      {/* FOOTER */}
      <footer className="max-w-5xl mx-auto mt-16 py-8 text-center text-sm text-coal/70">
        Roga trains Question Intelligence — the art of asking better questions.
        <div className="mt-2">Privacy • Terms • Contact</div>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-4xl heading">roga — ask better questions</h1>
        <p className="tagline text-lg">
          Daily challenges to sharpen your questioning. Streaks, badges, and deep practice.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/game" className="btn btn-primary">
            Start Quick Challenge
          </a>
          <a href="/streaks" className="btn btn-ghost">
            Streaks & Badges
          </a>
        </div>
        <p className="text-xs text-gray-500">MVP wireframe • v0</p>
      </div>
    </main>
  );
}

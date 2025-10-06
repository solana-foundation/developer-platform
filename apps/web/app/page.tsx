export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          Developer Platform
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Built with Next.js, NestJS, and Solana
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/api/docs"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            API Documentation
          </a>
        </div>
      </div>
    </div>
  );
}

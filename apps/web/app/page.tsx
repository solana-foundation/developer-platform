import { Header } from '@/components/common/header';
import { Hero } from '@/components/common/hero';
import { Stats } from '@/components/common/stats';
import { Features } from '@/components/common/features';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Features />
      </main>
    </div>
  );
}

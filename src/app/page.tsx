import PFPOverlayGenerator from './components/PFPOverlayGenerator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4" style={{ backgroundColor: '#0F0F0F' }}>
      <PFPOverlayGenerator />
    </main>
  );
}
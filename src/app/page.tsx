import PFPOverlayGenerator from './components/PFPOverlayGenerator';

export default function Home() {
  return (
    <main className="flex flex-col items-center p-4" style={{ backgroundColor: '#0F0F0F' }}>
      <PFPOverlayGenerator />
    </main>
  );
}
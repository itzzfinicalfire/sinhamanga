import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Translator from './components/Translator.jsx';
import Features from './components/Features.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import FAQ from './components/FAQ.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header />
      <main>
        <Hero />
        <Translator />
        <Features />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

import { useState } from 'react';
import { ArrowUpRight, Award, Crown, X } from 'lucide-react';
import '../vanguardHero.css';

const NAV_LINKS = [
  { label: 'Films', section: 1 },
  { label: 'Comics', section: 2 },
  { label: 'Chat', section: 3 },
];

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_154941_df1a96e1-a06f-450c-bd02-d863414cc1a0.mp4';

function Brand({ className = '' }) {
  return (
    <span className={`font-podium font-bold uppercase tracking-wider text-white ${className}`}>
      HeroVerse
    </span>
  );
}

function GetInTouchButton({ className = '', onNavigateSection }) {
  return (
    <a
      href="#chat"
      onClick={(event) => {
        event.preventDefault();
        onNavigateSection(3);
      }}
      className={`group inline-flex items-center gap-2 border border-white/30 px-6 py-3 text-xs uppercase tracking-widest text-white transition hover:border-white/60 hover:bg-white/10 ${className}`}
    >
      Join the Community
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

export default function VanguardHero({ onNavigateSection }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-inter">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex h-full flex-col">
        <nav className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 lg:py-7">
          <Brand className="text-2xl sm:text-3xl" />

          <div className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map(({ label, section }) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateSection(section);
                }}
                className="font-inter text-sm uppercase tracking-widest text-white/80 transition hover:text-white"
              >
                {label}
              </a>
            ))}
          </div>

          <GetInTouchButton className="hidden md:inline-flex" onNavigateSection={onNavigateSection} />

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-end space-y-1.5 md:hidden"
          >
            <div className="h-0.5 w-6 bg-white" />
            <div className="h-0.5 w-6 bg-white" />
            <div className="h-0.5 w-4 bg-white" />
          </button>
        </nav>

        <div className="flex flex-1 items-center px-6 sm:px-10 lg:px-16">
          <div className="max-w-3xl text-left">
            <div className="mb-6 flex animate-fade-up items-center gap-2 lg:mb-8">
              <Crown className="h-4 w-4 text-white/70" />
              <span className="font-inter text-xs uppercase tracking-[0.3em] text-white/70 sm:text-sm">
                Your home for superhero stories
              </span>
            </div>

            <h1 className="animate-fade-up-delay-1 font-podium uppercase leading-[0.92] tracking-tight text-white">
              <span className="block text-[clamp(2.8rem,8vw,7rem)]">Watch.</span>
              <span className="block text-[clamp(2.8rem,8vw,7rem)]">Read.</span>
              <span className="block text-[clamp(2.8rem,8vw,7rem)]">Connect.</span>
            </h1>

            <p className="mt-6 max-w-md animate-fade-up-delay-2 font-inter text-sm leading-relaxed text-white/70 sm:text-base lg:mt-8">
              Discover superhero films and comic books, then connect with fans of Marvel, DC, and beyond.
            </p>

            <div className="mt-8 flex animate-fade-up-delay-3 flex-wrap items-center gap-4 sm:gap-6 lg:mt-10">
              <a
                href="#films"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateSection(1);
                }}
                className="group inline-flex items-center gap-2 bg-black px-5 py-3 text-[11px] uppercase tracking-widest text-white transition hover:bg-neutral-900 sm:px-7 sm:py-4 sm:text-xs"
              >
                Explore HeroVerse
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <div className="hidden items-center gap-3 sm:flex">
                <Award className="h-8 w-8 text-white/50" />
                <div className="font-inter text-xs uppercase tracking-wider text-white/60">
                  <div>One universe</div>
                  <div>Every fan</div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex animate-fade-up-delay-4 flex-wrap gap-6 sm:mt-10 sm:gap-12 lg:mt-14 lg:gap-16">
              {[
                { value: 'FILMS', label: 'Discover stories' },
                { value: 'COMICS', label: 'Explore the pages' },
                { value: 'CHAT', label: 'Meet fellow fans' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-inter text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 font-inter text-[9px] uppercase tracking-widest text-white/50 sm:text-xs">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm transition-all duration-500 md:hidden ${
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <Brand className="text-2xl" />
          <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X className="h-7 w-7 text-white" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          {NAV_LINKS.map(({ label, section }, i) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              onClick={(event) => {
                event.preventDefault();
                setMenuOpen(false);
                onNavigateSection(section);
              }}
              className="font-podium text-4xl uppercase text-white transition-all duration-500 sm:text-5xl"
              style={{
                transitionDelay: `${i * 80 + 100}ms`,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
              }}
            >
              {label}
            </a>
          ))}

          <div
            className="transition-all duration-500"
            style={{
              transitionDelay: `${NAV_LINKS.length * 80 + 100}ms`,
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            <GetInTouchButton onNavigateSection={onNavigateSection} />
          </div>
        </div>
      </div>
    </div>
  );
}

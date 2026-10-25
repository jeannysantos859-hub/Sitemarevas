import React from 'react';

interface WaveGraphicProps {
  className?: string;
  variant?: 'subtle' | 'dark' | 'glow';
}

export const WaveGraphic: React.FC<WaveGraphicProps> = ({ className = '', variant = 'subtle' }) => {
  if (variant === 'dark') {
    return (
      <div className={`overflow-hidden pointer-events-none select-none ${className}`} aria-hidden="true">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-auto text-[#064E3B]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity="0.15"
            d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,144C672,149,768,203,864,208C960,213,1056,171,1152,149.3C1248,128,1344,128,1392,128L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="currentColor"
          />
          <path
            opacity="0.25"
            d="M0,96L48,128C96,160,192,224,288,229.3C384,235,480,181,576,165.3C672,149,768,171,864,186.7C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="#2F5E4E"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'glow') {
    return (
      <div className={`overflow-hidden pointer-events-none select-none relative ${className}`} aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#DCE5E0]/60 rounded-full blur-3xl -z-10 animate-glow" />
        <svg
          viewBox="0 0 1200 400"
          className="w-full h-auto text-[#2F5E4E]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 50,200 C 200,80 400,320 600,200 C 800,80 1000,320 1150,200"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            opacity="0.3"
          />
          <path
            d="M 50,220 C 250,110 450,290 650,210 C 850,130 1050,300 1150,220"
            stroke="#064E3B"
            strokeWidth="1.2"
            opacity="0.4"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 180"
        className="w-full h-auto text-[#DCE5E0]"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          opacity="0.5"
          d="M0,64L60,80C120,96,240,128,360,128C480,128,600,96,720,80C840,64,960,64,1080,80C1200,96,1320,128,1380,144L1440,160L1440,180L1380,180C1320,180,1200,180,1080,180C960,180,840,180,720,180C600,180,480,180,360,180C240,180,120,180,60,180L0,180Z"
        />
        <path
          opacity="0.8"
          d="M0,96L60,101.3C120,107,240,117,360,106.7C480,96,600,64,720,64C840,64,960,96,1080,106.7C1200,117,1320,107,1380,101.3L1440,96L1440,180L1380,180C1320,180,1200,180,1080,180C960,180,840,180,720,180C600,180,480,180,360,180C240,180,120,180,60,180L0,180Z"
        />
      </svg>
    </div>
  );
};

export const BrandMark: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size];

  return (
    <div className={`inline-flex items-center justify-center rounded-lg bg-[#064E3B] text-white p-1.5 shadow-sm ${className}`}>
      <svg className={sizeClasses} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Subtle stylized wave / 'M' glyph */}
        <path
          d="M6 23V9L12 18L16 12L20 18L26 9V23"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 25C10 23.5 14 26.5 18 25C22 23.5 24 25.5 26 25"
          stroke="#DCE5E0"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

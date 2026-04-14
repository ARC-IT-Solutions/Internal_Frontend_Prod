import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono:  ['var(--font-mono)', 'monospace'],
      },
      colors: {
        gold:   { DEFAULT:'#C9A84C', light:'#E8C96A', dim:'rgba(201,168,76,0.12)' },
        cream:  { DEFAULT:'#EDE5D0', mute:'#8A7D65', dim:'#3A3020' },
        canvas: { DEFAULT:'#0B0907', raised:'#110F0A', card:'#181410', hover:'#1F1A12' },
      },
      keyframes: {
        'fade-up':   { '0%':{ opacity:'0', transform:'translateY(16px)' }, '100%':{ opacity:'1', transform:'translateY(0)' } },
        'fade-in':   { '0%':{ opacity:'0' }, '100%':{ opacity:'1' } },
        'shimmer':   { '0%':{ backgroundPosition:'-400px 0' }, '100%':{ backgroundPosition:'400px 0' } },
        'pulse-dot': { '0%,100%':{ opacity:'1' }, '50%':{ opacity:'0.4' } },
        'slide-in':  { '0%':{ transform:'translateX(-8px)', opacity:'0' }, '100%':{ transform:'translateX(0)', opacity:'1' } },
        'scale-in':  { '0%':{ transform:'scale(0.95)', opacity:'0' }, '100%':{ transform:'scale(1)', opacity:'1' } },
      },
      animation: {
        'fade-up':   'fade-up 0.5s ease both',
        'fade-in':   'fade-in 0.3s ease both',
        'shimmer':   'shimmer 1.8s infinite linear',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'slide-in':  'slide-in 0.25s ease both',
        'scale-in':  'scale-in 0.2s ease both',
      },
      backgroundImage: {
        'shimmer-gold': 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.06) 50%, transparent 100%)',
        'shimmer-dark': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        'gold-gradient':'linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)',
      },
    },
  },
  plugins: [],
};
export default config;

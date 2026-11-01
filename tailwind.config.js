/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: '#F4F1E8',
          text: '#171717',
          black: '#171717',
          blue: '#3155E7',
          orange: '#FF7043',
          lime: '#D7F36B',
          muted: '#A6A49C',
          card: '#FFFFFF',
          border: '#171717',
          surface: '#EAE6DB',
          danger: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B'
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #171717',
        'brutal': '4px 4px 0px #171717',
        'brutal-lg': '6px 6px 0px #171717',
        'brutal-blue': '4px 4px 0px #3155E7',
        'brutal-lime': '4px 4px 0px #171717',
      }
    },
  },
  plugins: [],
}


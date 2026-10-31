/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5145E5',
          dark: '#4338CA',
          light: '#6366F1',
        },
        secondary: {
          DEFAULT: '#8067F8',
          light: '#A78BFA',
        },
        accent: {
          DEFAULT: '#38C6D9',
          light: '#67E8F9',
        },
        mainBg: '#F7F8FC',
        cardBg: '#FFFFFF',
        deepNavy: '#171A35',
        slateGray: '#788097',
        softLavender: '#E8E9F2',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(81, 69, 229, 0.08), 0 4px 12px -2px rgba(23, 26, 53, 0.04)',
        'premium-hover': '0 20px 35px -12px rgba(81, 69, 229, 0.16), 0 8px 16px -4px rgba(23, 26, 53, 0.06)',
        'glow-indigo': '0 0 25px rgba(81, 69, 229, 0.35)',
        'glow-cyan': '0 0 25px rgba(56, 198, 217, 0.35)',
      },
    },
  },
  plugins: [],
}

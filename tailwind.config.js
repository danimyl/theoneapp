/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'spotify-black': '#121212',
        'spotify-darker': '#080808',
        'spotify-card': '#181818',
        'spotify-card-hover': '#282828',
        'spotify-green': '#1DB954',
        'spotify-green-hover': '#1ED760',
        'modal-overlay': '#000000',
        'primary-text': '#FFFFFF',
        'secondary-text': '#B3B3B3',
        'tertiary-text': '#6A6A6A',
        'accent-text': '#1DB954',
        'primary-button': {
          500: '#1DB954',
          600: '#1ED760',
        },
        'secondary-button': {
          500: '#535353',
          600: '#636363',
        },
      },
    },
  },
  plugins: [],
}
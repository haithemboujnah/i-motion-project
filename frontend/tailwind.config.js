/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs principales du logo
        logo: {
          blue: '#57a1ce',
          blueLight: '#7bb8de',
          blueDark: '#3d7fa8',
          gray: '#afadb3',
          grayLight: '#c9c8cc',
          grayDark: '#8a888e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'gradient-logo': 'linear-gradient(135deg, #57a1ce 0%, #afadb3 100%)',
        'gradient-logo-blue': 'linear-gradient(135deg, #57a1ce 0%, #3d7fa8 100%)',
        'gradient-logo-gray': 'linear-gradient(135deg, #afadb3 0%, #8a888e 100%)',
      },
      boxShadow: {
        'logo': '0 4px 20px rgba(87, 161, 206, 0.3)',
        'logo-lg': '0 8px 40px rgba(87, 161, 206, 0.25)',
        'logo-xl': '0 12px 60px rgba(87, 161, 206, 0.2)',
        'logo-gray': '0 4px 20px rgba(175, 173, 179, 0.3)',
        // Ajout des ombres personnalisées
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 8px 30px -5px rgba(0, 0, 0, 0.06)',
        'hard': '0 10px 40px -5px rgba(0, 0, 0, 0.15), 0 20px 60px -10px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./views/**/*.pug'],
  theme: {
    extend: {
      colors: {
        darkCyan: '#119DA4',        
        cerulean: '#0C7489',        
        midnightGreen: '#13505B',   
        customBlack: '#040404',     
        customWhite: '#FFFFFF',     
      },
    },
  },
  plugins: [],
}


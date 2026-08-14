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
        peach: {
          50: '#FBEFE6',   // base warm peach/blush cream background
          100: '#F5E4D7',  // soft peach surface
          200: '#EBD3C2',  // peach border
          card: '#FFFDFB', // cream/white card surface
        },
        rust: {
          50: '#FDF5F2',
          100: '#F7E4DC',
          200: '#ECC5B7',
          400: '#C9775C',
          500: '#B5654A',  // primary deep rust / terracotta accent
          600: '#9E5239',  // rust hover
          700: '#84412B',  // dark rust text
          900: '#4F2213',
        },
        dustyrose: {
          50: '#FDF7F5',
          100: '#F9E9E4',  // soft dusty rose surface
          200: '#F3CFC5',
          400: '#E1A392',
          500: '#D98E77',  // secondary dusty rose / salmon
          600: '#C4765E',  // dusty rose hover
          700: '#A75C46',
        },
        espresso: {
          50: '#F8F5F4',
          100: '#EBE4E1',
          200: '#D7C7C1',
          500: '#705044',
          700: '#523A31',
          900: '#3D2B24',  // deep espresso brown dark accent / footer
        },
        warmtext: {
          50: '#FBEFE6',
          100: '#F4E2D5',
          500: '#7A6258',  // muted warm text
          700: '#4F3930',  // subhead text
          900: '#2E2019',  // deep warm brown primary text
        },
        warmborder: '#E8D5C8', // soft warm border
        // Legacy alias tokens mapped for full compatibility
        cream: {
          50: '#FBEFE6',
          100: '#F5E4D7',
          200: '#EBD3C2',
          card: '#FFFDFB',
        },
        mint: {
          50: '#FBEFE6',
          100: '#F5E4D7',
          200: '#EBD3C2',
          card: '#FFFDFB',
        },
        olive: {
          50: '#FDF5F2',
          100: '#F7E4DC',
          200: '#ECC5B7',
          400: '#C9775C',
          500: '#B5654A',  // mapped to deep rust
          600: '#9E5239',
          700: '#84412B',
          900: '#4F2213',
        },
        leaf: {
          50: '#FDF5F2',
          100: '#F7E4DC',
          200: '#ECC5B7',
          400: '#C9775C',
          500: '#B5654A',  // mapped to deep rust
          600: '#9E5239',
          700: '#84412B',
          800: '#4F2213',
        },
        sage: {
          50: '#FDF7F5',
          100: '#F9E9E4',
          200: '#F3CFC5',
          400: '#E1A392',
          500: '#D98E77',  // mapped to dusty rose
          600: '#C4765E',
          700: '#A75C46',
        },
        tan: {
          50: '#FDF7F5',
          100: '#F9E9E4',
          200: '#F3CFC5',
          400: '#E1A392',
          500: '#D98E77',  // mapped to dusty rose
          600: '#C4765E',
          700: '#A75C46',
        },
        terracotta: {
          50: '#FDF5F2',
          100: '#F7E4DC',
          500: '#B5654A',  // deep rust / terracotta
          600: '#9E5239',
        },
        gold: {
          50: '#FDF7F5',
          100: '#F9E9E4',
          200: '#F3CFC5',
          400: '#E1A392',
          500: '#D98E77',  // mapped to dusty rose
          600: '#C4765E',
        },
        charcoalolive: {
          50: '#FBEFE6',
          100: '#F4E2D5',
          500: '#7A6258',
          700: '#4F3930',
          900: '#2E2019',  // deep warm brown text
        },
        darkcharcoal: {
          50: '#FBEFE6',
          100: '#F4E2D5',
          200: '#EBD3C2',
          500: '#7A6258',
          700: '#4F3930',
          900: '#2E2019',  // deep warm brown text
        },
        warmbrown: {
          50: '#FBEFE6',
          100: '#F4E2D5',
          500: '#7A6258',
          700: '#4F3930',
          900: '#2E2019',
        },
        forest: {
          50: '#FDF5F2',
          100: '#F7E4DC',
          400: '#C9775C',
          600: '#B5654A',
          800: '#84412B',
          900: '#3D2B24',
        },
        earth: {
          brown: '#4F3930',
          'brown-dark': '#2E2019',
          terracotta: '#B5654A',
          tan: '#D98E77',
          cream: '#FBEFE6',
        },
        accent: {
          gold: '#D98E77',
          leaf: '#B5654A',
          terracotta: '#B5654A',
          sage: '#D98E77',
          tan: '#D98E77'
        },
        dark: {
          bg: '#3D2B24',
          card: '#4F3930',
          elevated: '#523A31',
          border: '#B5654A',
          muted: '#E1A392'
        },
        brand: {
          primary: '#B5654A',  // deep rust / terracotta
          hover: '#9E5239',    // rust hover
          accent: '#D98E77',   // dusty rose
          espresso: '#3D2B24', // deep espresso brown
          emerald: '#D98E77',
          amber: '#F59E0B',    // status amber kept distinct
          purple: '#B5654A'
        }
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        serif: ['Sora', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 10px 30px -5px rgba(181, 101, 74, 0.25)',
        'glow-rust': '0 10px 30px -5px rgba(181, 101, 74, 0.35)',
        'glow-rose': '0 10px 30px -5px rgba(217, 142, 119, 0.35)',
        'glow-espresso': '0 10px 30px -5px rgba(61, 43, 36, 0.35)',
        'earthy': '0 12px 30px -5px rgba(46, 32, 25, 0.08)',
        'warm': '0 10px 25px -5px rgba(46, 32, 25, 0.06)',
        'warm-sm': '0 4px 14px 0 rgba(46, 32, 25, 0.04)',
        'warm-md': '0 8px 24px -4px rgba(46, 32, 25, 0.08)',
        'warm-lg': '0 20px 40px -8px rgba(46, 32, 25, 0.12)',
        'warm-hover': '0 16px 36px -6px rgba(181, 101, 74, 0.22), 0 6px 16px -4px rgba(46, 32, 25, 0.08)'
      }
    },
  },
  plugins: [],
}

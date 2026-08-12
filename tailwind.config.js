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
          50: '#FBEFE6',   // base warm peach / blush cream page background
          100: '#F8E5DF',  // soft peach card surface
          200: '#EAD5C7',  // peach border
          card: '#FDF4EC', // warm blush-cream card surface
        },
        rust: {
          50: '#FDF5F2',
          100: '#F9E5DD',
          200: '#F0C5B7',
          400: '#CA7B61',
          500: '#B5654A',  // primary deep rust / terracotta
          600: '#9C4F36',  // deep rust hover
          700: '#823C27',  // dark terracotta text
          900: '#3D2B24',
        },
        dustyrose: {
          50: '#FDF6F4',
          100: '#F8E9E4',  // soft dusty rose surface
          200: '#EFCFC5',
          400: '#E4A493',
          500: '#D98E77',  // secondary dusty rose / salmon
          600: '#C2735C',  // dusty rose hover
          700: '#9E5440',
        },
        espresso: {
          50: '#F8EFEA',
          100: '#EADCD5',
          500: '#5C4339',
          700: '#47332B',
          900: '#3D2B24',  // tertiary/dark accent deep espresso brown
        },
        warmtext: {
          50: '#FDF6F4',
          100: '#F8E9E4',
          500: '#6E554B',  // muted warm brown text
          700: '#4A372E',  // subhead text
          900: '#2E2019',  // deep warm brown primary text
        },
        // Legacy alias tokens mapped for full compatibility
        cream: {
          50: '#FBEFE6',   // mapped to warm peach base
          100: '#F8E5DF',
          200: '#EAD5C7',
          card: '#FDF4EC',
        },
        mint: {
          50: '#FBEFE6',   // mapped to warm peach base
          100: '#F8E5DF',
          200: '#EAD5C7',
          card: '#FDF4EC',
        },
        olive: {
          50: '#FDF5F2',
          100: '#F9E5DD',
          200: '#F0C5B7',
          400: '#CA7B61',
          500: '#B5654A',  // mapped to deep rust
          600: '#9C4F36',  // mapped to deep rust hover
          700: '#823C27',
          900: '#3D2B24',
        },
        leaf: {
          50: '#FDF5F2',
          100: '#F9E5DD',
          200: '#F0C5B7',
          400: '#CA7B61',
          500: '#B5654A',  // mapped to deep rust
          600: '#9C4F36',
          700: '#823C27',
          800: '#3D2B24',
        },
        sage: {
          50: '#FDF6F4',
          100: '#F8E9E4',
          200: '#EFCFC5',
          400: '#E4A493',
          500: '#D98E77',  // mapped to dusty rose
          600: '#C2735C',
          700: '#9E5440',
        },
        tan: {
          50: '#FDF6F4',
          100: '#F8E9E4',
          200: '#EFCFC5',
          400: '#E4A493',
          500: '#D98E77',  // mapped to dusty rose
          600: '#C2735C',
          700: '#9E5440',
        },
        terracotta: {
          50: '#FDF5F2',
          100: '#F9E5DD',
          500: '#B5654A',  // mapped to deep rust
          600: '#9C4F36',
        },
        gold: {
          50: '#FDF6F4',
          100: '#F8E9E4',
          200: '#EFCFC5',
          400: '#E4A493',
          500: '#D98E77',  // mapped to dusty rose
          600: '#C2735C',
        },
        charcoalolive: {
          50: '#FDF6F4',
          100: '#F8E9E4',
          500: '#6E554B',
          700: '#4A372E',
          900: '#2E2019',  // deep warm brown text
        },
        darkcharcoal: {
          50: '#FDF6F4',
          100: '#F8E9E4',
          200: '#EAD5C7',
          500: '#6E554B',  // muted text
          700: '#4A372E',
          900: '#2E2019',  // deep warm brown text
        },
        warmbrown: {
          50: '#FDF6F4',
          100: '#F8E9E4',
          500: '#6E554B',
          700: '#47332B',
          900: '#2E2019',
        },
        warmborder: '#EAD5C7', // warm peach border
        forest: {
          50: '#FDF5F2',
          100: '#F9E5DD',
          400: '#D98E77',
          600: '#B5654A',
          800: '#2E2019',
          900: '#3D2B24',
        },
        earth: {
          brown: '#4A372E',
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
          card: '#2E2019',
          elevated: '#47332B',
          border: '#B5654A',
          muted: '#E4A493'
        },
        brand: {
          primary: '#B5654A',  // deep rust
          hover: '#9C4F36',    // rust hover
          accent: '#D98E77',   // dusty rose
          espresso: '#3D2B24', // deep espresso
          emerald: '#D98E77',
          amber: '#D98E77',
          purple: '#B5654A'
        }
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        display: ['Fraunces', 'serif'],
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

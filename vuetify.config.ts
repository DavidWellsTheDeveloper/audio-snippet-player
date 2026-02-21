import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'

export default defineVuetifyConfiguration({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#009688', // teal
          secondary: '#00897B', // teal darken-1 (analogous)
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#26A69A', // teal lighten-1
          secondary: '#4DB6AC', // teal lighten-2
        },
      },
    },
  },
})

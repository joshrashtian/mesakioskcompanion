export type Theme = {
  name: string
  root: {
    background?: string
    text?: string
    primary?: string
    secondary?: string
    tertiary?: string
    quaternary?: string
    quinary?: string
  }
  page?: {
    webview?: {
      tab?: string
      tabBackground?: string
      tabActive?: string
    }
  }
}

export const themes: Theme[] = [
  {
    name: 'default',
    root: {
      background: '#1b1b1f',
      text: '#ffffff'
    },
    page: {
      webview: {
        tab: '#1b1b1f',
        tabBackground: 'bg-zinc-300 dark:bg-zinc-700',
        tabActive: '#ffffff'
      }
    }
  }
]

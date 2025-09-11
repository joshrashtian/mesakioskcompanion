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
      searchBar?: string
      background?: string
      tab?: string
      tabBarBackground?: string
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
        background: 'bg-slate-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100',
        searchBar:
          'dark:bg-zinc-900 dark:text-zinc-100 outline-none focus:outline-none px-3 py-3 min-w-[500px] rounded-3xl dark:border dark:border-zinc-700 no-drag bg-slate-100 text-slate-900 rounded-3xl',
        tab: '#1b1b1f',
        tabBarBackground:
          'flex items-center dark:bg-zinc-800 bg-white border-b border-zinc-700 px-2 py-1',
        tabBackground:
          'bg-zinc-100 px-4 py-2 border text-zinc-900 border-zinc-700 rounded-2xl  dark:bg-zinc-900 dark:text-zinc-100',
        tabActive:
          ' px-4 py-2 border border-zinc-700 rounded-2xl hover:bg-zinc-700 bg-slate-200 text-slate-900 dark:bg-zinc-700 dark:text-zinc-100'
      }
    }
  }
]

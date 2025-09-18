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
      appSelector?: {
        app?: string
      }

      searchBar?: string
      closeButton?: string
      background?: string
      tab?: string
      tabBarBackground?: string
      tabBackground?: string
      tabActive?: string
      buttons?: string
    }
  }
}

export const themes: Theme[] = [
  {
    name: 'default',
    root: {
      background: 'bg-zinc-900',
      text: 'text-white'
    },
    page: {
      webview: {
        appSelector: {
          app: 'group flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-105'
        },
        background: 'bg-slate-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100',
        searchBar:
          'dark:bg-zinc-900 dark:text-zinc-100 outline-none focus:outline-none px-3 py-3 min-w-[500px] rounded-3xl dark:border dark:border-zinc-700 no-drag bg-slate-100 text-slate-900 rounded-3xl',
        tab: 'bg-zinc-900',
        tabBarBackground:
          'flex items-center dark:bg-zinc-800 bg-white border-b border-zinc-700 px-2 py-1',
        tabBackground:
          'bg-zinc-100 px-4 py-2 border text-zinc-900 border-zinc-700 rounded-2xl dark:bg-zinc-900 dark:text-zinc-100',
        tabActive:
          'px-4 py-2 border border-zinc-700 active:bg-slate-400 rounded-2xl hover:bg-slate-300 dark:hover:bg-zinc-700 bg-slate-300 text-slate-900 dark:bg-zinc-700 dark:text-zinc-100',
        closeButton:
          'hover:text-zinc-800 opacity-0 dark:text-zinc-200 group-hover:opacity-100 transition-opacity',
        buttons:
          'bg-gray-500 text-zinc-100 hover:bg-gray-600 px-3 py-3 w-fit rounded-2xl border border-zinc-700 no-drag'
      }
    }
  }
]

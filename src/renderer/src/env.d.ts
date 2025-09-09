/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<
      React.HTMLAttributes<import('electron').WebviewTag>,
      import('electron').WebviewTag
    > & {
      src?: string
      allowpopups?: string | boolean
      partition?: string
      preload?: string
    }
  }
}

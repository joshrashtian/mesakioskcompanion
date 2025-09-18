import React from 'react'
import {
  IoGlobe,
  IoLogoGoogle,
  IoLogoGithub,
  IoLogoYoutube,
  IoLogoDiscord,
  IoDocument,
  IoMail,
  IoCloud,
  IoFlask,
  IoCalculator
} from 'react-icons/io5'
import { useTheme } from './useTheme'
import SpotifyIcon from '@renderer/assets/SVGs/SpotifyIcon'

interface Website {
  name: string
  url: string
  icon: React.JSX.Element
  color: string
  category: string
}

interface WebsiteDashboardProps {
  onOpenWebsite: (url: string) => void
}

const POPULAR_WEBSITES: Website[] = [
  // Social Media
  {
    name: 'YouTube',
    url: 'https://youtube.com',
    icon: <IoLogoYoutube />,
    color: 'text-red-500',
    category: 'Social'
  },

  {
    name: 'Discord',
    url: 'https://discord.com',
    icon: <IoLogoDiscord />,
    color: 'text-indigo-500',
    category: 'Social'
  },

  // Productivity
  {
    name: 'Google',
    url: 'https://www.google.com/webhp?igu=1',
    icon: <IoLogoGoogle />,
    color: 'text-blue-500',
    category: 'Productivity'
  },
  {
    name: 'Gmail',
    url: 'https://gmail.com',
    icon: <IoMail />,
    color: 'text-red-500',
    category: 'Productivity'
  },
  {
    name: 'Google Drive',
    url: 'https://drive.google.com',
    icon: <IoCloud />,
    color: 'text-blue-500',
    category: 'Productivity'
  },
  {
    name: 'Google Docs',
    url: 'https://docs.google.com',
    icon: <IoDocument />,
    color: 'text-blue-600',
    category: 'Productivity'
  },
  {
    name: 'Notion',
    url: 'https://notion.so',
    icon: <IoDocument />,
    color: 'text-gray-700',
    category: 'Productivity'
  },
  {
    name: 'Spotify',
    url: 'https://open.spotify.com',
    icon: <SpotifyIcon />,
    color: 'text-green-500',
    category: 'Productivity'
  },

  // Development
  {
    name: 'GitHub',
    url: 'https://github.com',
    icon: <IoLogoGithub />,
    color: 'text-gray-800',
    category: 'Development'
  },
  {
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    icon: <IoDocument />,
    color: 'text-orange-500',
    category: 'Development'
  },
  // Education

  {
    name: 'Wikipedia',
    url: 'https://wikipedia.org',
    icon: <IoDocument />,
    color: 'text-gray-600',
    category: 'Education'
  },
  {
    name: 'MasteringPhysics',
    url: 'https://www.pearson.com/en-us/higher-education/products-services/mastering/physics.html?srsltid=AfmBOorJhYu_eKrFt3JxkEK6TizGnBpvbGIp58S4OZgY_P-2C_X6GO3G',
    icon: <IoFlask />,
    color: 'text-gray-600',
    category: 'Education'
  },
  {
    name: 'MyOpenMath',
    url: 'https://myopenmath.com/login',
    icon: <IoCalculator />,
    color: 'text-gray-600',
    category: 'Education'
  },
  // Mesa Connect
  {
    name: 'Mesa Connect',
    url: 'https://mesaconnect.io',
    icon: <IoGlobe />,
    color: 'text-orange-500',
    category: 'Featured'
  }
]

const CATEGORIES = [
  'All',
  'Featured',
  'Social',
  'Productivity',
  'Development',
  'Entertainment',
  'News',
  'Shopping'
]

export default function WebsiteDashboard({
  onOpenWebsite
}: WebsiteDashboardProps): React.JSX.Element {
  const theme = useTheme()
  const [selectedCategory, setSelectedCategory] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredWebsites = POPULAR_WEBSITES.filter((website) => {
    const matchesCategory = selectedCategory === 'All' || website.category === selectedCategory
    const matchesSearch = website.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div
      className={`h-full w-full p-6 overflow-auto ${theme.page?.webview?.background || 'bg-white dark:bg-zinc-900'}`}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
          Welcome to Mesa Kiosk
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-6">
          Choose a website to get started
        </p>

        {/* Search Bar */}
        <div className="max-w-screen mx-auto mb-6">
          <input
            type="text"
            placeholder="Search websites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap mt-4 justify-center gap-2 mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Website Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3  xl:grid-cols-4 gap-4  mx-auto">
        {filteredWebsites.map((website) => (
          <div
            key={website.name}
            onClick={() => onOpenWebsite(website.url)}
            className={
              theme.page?.webview?.appSelector?.app ||
              'group flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-105'
            }
          >
            <div
              className={`text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 ${website.color}`}
            >
              {website.icon}
            </div>
            <span className="text-sm font-medium text-zinc-900 dark:text-white text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              {website.name}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {website.category}
            </span>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredWebsites.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl text-zinc-300 dark:text-zinc-600 mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            No websites found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Try adjusting your search or category filter
          </p>
        </div>
      )}
    </div>
  )
}

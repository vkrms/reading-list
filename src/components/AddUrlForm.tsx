import React, { useState } from 'react'
import { Plus, Link, Loader2, AlertTriangle } from 'lucide-react'
import type { Database } from '../lib/supabase'

type ReadingListItem = Database['public']['Tables']['reading_list_items']['Row']

interface AddUrlFormProps {
  onAdd: (url: string, openGraphData: any) => Promise<void>
  existingItems: ReadingListItem[]
}

export function AddUrlForm({ onAdd, existingItems }: AddUrlFormProps) {
  const [url, setUrl] = useState('')
  const [openGraphData, setOpenGraphData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [duplicateItem, setDuplicateItem] = useState<ReadingListItem | null>(null)

  const fetchOpenGraphData = async (url: string) => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-opengraph`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch article data')
    }

    return await response.json()
  }

  const checkForDuplicate = (url: string) => {
    const normalizedUrl = url.toLowerCase().trim()
    return existingItems.find(item => 
      item.url.toLowerCase().trim() === normalizedUrl
    ) || null
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text')
    
    // Check if pasted text looks like a URL
    try {
      new URL(pastedText)
      
      // Check for duplicates first
      const duplicate = checkForDuplicate(pastedText)
      if (duplicate) {
        setDuplicateItem(duplicate)
        setOpenGraphData(null)
        return
      }
      
      setDuplicateItem(null)
      setFetchingData(true)
      
      try {
        const data = await fetchOpenGraphData(pastedText)
        setOpenGraphData(data)
      } catch (error) {
        console.error('Error fetching OpenGraph data:', error)
        setOpenGraphData(null)
      } finally {
        setFetchingData(false)
      }
    } catch {
      // Not a valid URL, ignore
      setOpenGraphData(null)
      setDuplicateItem(null)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    
    // Clear OpenGraph data if URL is cleared or changed significantly
    if (!newUrl || (openGraphData && !newUrl.includes(new URL(openGraphData.url || '').hostname))) {
      setOpenGraphData(null)
      setDuplicateItem(null)
    }
    
    // Check for duplicates on manual input
    if (newUrl) {
      try {
        new URL(newUrl)
        const duplicate = checkForDuplicate(newUrl)
        setDuplicateItem(duplicate)
        if (duplicate) {
          setOpenGraphData(null)
        }
      } catch {
        setDuplicateItem(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !openGraphData) return

    setLoading(true)
    try {
      await onAdd(url.trim(), openGraphData)
      setUrl('')
      setOpenGraphData(null)
    } catch (error: any) {
      console.error('Error adding URL:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-blue-500" />
        Add New Article
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Article URL
          </label>
          <div className="relative">
            <Link className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              id="url"
              type="url"
              value={url}
              onChange={handleUrlChange}
              onPaste={handlePaste}
              placeholder="https://example.com/article"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                fetchingData ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
              }`}
              required
            />
            {fetchingData && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          
          {fetchingData && (
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Fetching article data...
            </p>
          )}
        </div>

        {duplicateItem && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 mb-1">Article Already Added</h4>
              <p className="text-sm text-amber-700 mb-2">
                This article is already in your reading list:
              </p>
              <div className="bg-white rounded-md p-3 border border-amber-200">
                <h5 className="font-medium text-gray-900 text-sm mb-1">
                  {duplicateItem.title}
                </h5>
                <p className="text-xs text-gray-600">
                  Added {new Date(duplicateItem.created_at).toLocaleDateString()} • 
                  {duplicateItem.is_read ? ' Read' : ' Unread'}
                </p>
              </div>
            </div>
          </div>
        )}

        {openGraphData && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Preview:</h3>
            <div className="flex gap-3">
              {openGraphData.image && (
                <img
                  src={openGraphData.image}
                  alt={openGraphData.title}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {openGraphData.title || 'No title found'}
                </h4>
                {openGraphData.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {openGraphData.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new URL(openGraphData.url || url).hostname}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url.trim() || !openGraphData || fetchingData || duplicateItem}
          className="w-full max-w-sm mx-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding to reading list...
            </>
          ) : duplicateItem ? (
            'Article already in reading list'
          ) : !openGraphData && url ? (
            'Paste a URL to fetch article data'
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add to Reading List
            </>
          )}
        </button>
      </form>
    </div>
  )
}
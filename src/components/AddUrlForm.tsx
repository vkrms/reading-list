import React, { useState } from 'react'
import { Plus, Link, Loader2, AlertTriangle } from 'lucide-react'
import type { Database } from '../lib/supabase'
import type { OpenGraphData } from '../hooks/useReadingList'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagCombobox } from '@/components/TagCombobox'

type ReadingListItem = Database['public']['Tables']['reading_list_items']['Row']

interface AddUrlFormProps {
  onAdd: (url: string, tag: string, openGraphData: OpenGraphData) => Promise<void>
  existingItems: ReadingListItem[]
}

export function AddUrlForm({ onAdd, existingItems }: AddUrlFormProps) {
  const [url, setUrl] = useState('')
  const [tag, setTag] = useState('')

  const tagSuggestions = Array.from(
    new Set(existingItems.map((i) => i.tag).filter(Boolean))
  ).sort()
  const [openGraphData, setOpenGraphData] = useState<OpenGraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [duplicateItem, setDuplicateItem] = useState<ReadingListItem | null>(null)

  const fetchOpenGraphData = async (url: string): Promise<OpenGraphData> => {
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
      const error = await response.json() as { error?: string }
      throw new Error(error.error || 'Failed to fetch article data')
    }

    return await response.json() as OpenGraphData
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
        // Set minimal OpenGraph data to allow saving the URL
        setOpenGraphData({
          title: pastedText,
          description: 'Unable to fetch article preview',
          url: pastedText,
          image: null
        })
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
    const trimmedTag = tag.trim()

    if (!url.trim() || !trimmedTag || !openGraphData) return

    setLoading(true)
    try {
      await onAdd(url.trim(), trimmedTag, openGraphData)
      setUrl('')
      setTag('')
      setOpenGraphData(null)
    } catch (error) {
      console.error('Error adding URL:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6 border-white/70 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl text-slate-950">
          <Plus className="h-5 w-5 text-blue-500" />
          Add New Article
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="url">
              Article URL
            </Label>
            <div className="relative">
              <Link className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                value={url}
                onChange={handleUrlChange}
                onPaste={handlePaste}
                placeholder="https://example.com/article"
                className={`h-11 pl-10 ${fetchingData ? 'border-blue-300 bg-blue-50' : ''}`}
                required
              />
              {fetchingData && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>

            {fetchingData && (
              <p className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Fetching article data...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tag</Label>
            <TagCombobox
              value={tag}
              onChange={setTag}
              suggestions={tagSuggestions}
            />
            <p className="text-xs text-muted-foreground">
              Pick an existing tag or type to create a new one.
            </p>
          </div>

          {duplicateItem && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Article Already Added</AlertTitle>
              <AlertDescription>
                <p className="mb-3 text-amber-800">
                  This article is already in your reading list:
                </p>
                <div className="rounded-md border border-amber-200 bg-white p-3">
                  <h5 className="mb-1 text-sm font-medium text-slate-900">
                    {duplicateItem.title}
                  </h5>
                  <p className="text-xs text-slate-600">
                    Added {new Date(duplicateItem.created_at).toLocaleDateString()} •
                    {duplicateItem.is_read ? ' Read' : ' Unread'}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {openGraphData && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-medium text-slate-900">Preview</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  {tag.trim() || 'Tag pending'}
                </Badge>
              </div>
              <div className="flex gap-3">
                {openGraphData.image && (
                  <img
                    src={openGraphData.image}
                    alt={openGraphData.title}
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium text-slate-900">
                    {openGraphData.title || 'No title found'}
                  </h4>
                  {openGraphData.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {openGraphData.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {new URL(openGraphData.url || url).hostname}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !url.trim() || !tag.trim() || !openGraphData || fetchingData || duplicateItem}
            className="mx-auto flex h-11 w-full max-w-sm items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding to reading list...
              </>
            ) : duplicateItem ? (
              'Article already in reading list'
            ) : !openGraphData && url ? (
              'Paste a URL to fetch article data'
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add to Reading List
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
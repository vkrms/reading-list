import React, { useState, useMemo } from 'react'
import { useReadingList } from '../hooks/useReadingList'
import { ReadingListItem } from './ReadingListItem'
import { AddUrlForm } from './AddUrlForm'
import { BookOpen, Filter, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import type { OpenGraphData } from '../hooks/useReadingList'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type ReadingListFilter = 'all' | 'unread' | 'read'

export function ReadingList() {
  const { user, signOut } = useAuth()
  const { items, loading, addItem, toggleRead, deleteItem, updateItem } = useReadingList(user?.id)
  const [filter, setFilter] = useState<ReadingListFilter>('all')

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'unread':
        return items.filter(item => !item.is_read)
      case 'read':
        return items.filter(item => item.is_read)
      default:
        return items
    }
  }, [items, filter])

  const stats = useMemo(() => {
    const total = items.length
    const unread = items.filter(item => !item.is_read).length
    const read = items.filter(item => item.is_read).length
    return { total, unread, read }
  }, [items])

  const allTags = useMemo(
    () => Array.from(new Set(items.map((i) => i.tag).filter(Boolean))).sort(),
    [items]
  )

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out'
      toast.error(message)
    }
  }

  const handleAddUrl = async (url: string, tag: string, openGraphData: OpenGraphData) => {
    await addItem(url, tag, openGraphData)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your reading list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reading List</h1>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <User className="w-3 h-3" />
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="gap-2 text-gray-600 hover:text-gray-700"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-[712px] mx-auto px-4 py-8 w-fit box-content">
        {/* Add URL Form */}
        <AddUrlForm onAdd={handleAddUrl} existingItems={items} />

        {/* Stats and Filter */}
        <Card className="mb-6 border-white/70 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-950">{stats.total}</div>
                <div className="text-sm text-slate-600">Total Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
                <div className="text-sm text-slate-600">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.read}</div>
                <div className="text-sm text-slate-600">Read</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <Select
                value={filter}
                onValueChange={(value) => setFilter(value as ReadingListFilter)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter articles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Articles</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reading List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No articles yet' : `No ${filter} articles`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Add your first article by entering a URL above'
                : `You don't have any ${filter} articles`
              }
            </p>
            {filter !== 'all' && (
              <Button
                onClick={() => setFilter('all')}
                variant="link"
                className="text-blue-600 hover:text-blue-700"
              >
                Show all articles
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 w-fit">
            {filteredItems.map((item) => (
              <ReadingListItem
                key={item.id}
                item={item}
                allTags={allTags}
                onToggleRead={toggleRead}
                onDelete={deleteItem}
                onUpdate={updateItem}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
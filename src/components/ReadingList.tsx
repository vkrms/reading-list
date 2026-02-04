import React, { useState, useMemo } from 'react'
import { useReadingList } from '../hooks/useReadingList'
import { ReadingListItem } from './ReadingListItem'
import { AddUrlForm } from './AddUrlForm'
import { BookOpen, Filter, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export function ReadingList() {
  const { user, signOut } = useAuth()
  const { items, loading, addItem, toggleRead, deleteItem, updateItem } = useReadingList(user?.id)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

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

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleAddUrl = async (url: string, openGraphData: any) => {
    await addItem(url, openGraphData)
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

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-[712px] mx-auto px-4 py-8 w-fit box-content">
        {/* Add URL Form */}
        <AddUrlForm onAdd={handleAddUrl} existingItems={items} />

        {/* Stats and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
                <div className="text-sm text-gray-600">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.read}</div>
                <div className="text-sm text-gray-600">Read</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Articles</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>

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
              <button
                onClick={() => setFilter('all')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Show all articles
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 w-fit">
            {filteredItems.map((item) => (
              <ReadingListItem
                key={item.id}
                item={item}
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
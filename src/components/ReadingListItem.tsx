import React, { useState, useEffect } from 'react'
import { ExternalLink, Check, X, Trash2, BookOpen, StickyNote } from 'lucide-react'
import type { Database } from '../lib/supabase'

type ReadingListItem = Database['public']['Tables']['reading_list_items']['Row']

interface ReadingListItemProps {
  item: ReadingListItem
  onToggleRead: (id: string, isRead: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, updates: Partial<ReadingListItem>) => Promise<any>
}

export function ReadingListItem({ item, onToggleRead, onDelete, onUpdate }: ReadingListItemProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(item.text_note || '')

  useEffect(() => {
    if (!isEditingNote) {
      setNoteValue(item.text_note || '')
    }
  }, [item.text_note, isEditingNote])

  const handleToggleRead = async () => {
    setLoading(true)
    try {
      await onToggleRead(item.id, !item.is_read)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await onDelete(item.id)
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSaveNote = async () => {
    setLoading(true)
    try {
      await onUpdate(item.id, { text_note: noteValue.trim() || null })
      setIsEditingNote(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelNote = () => {
    setNoteValue(item.text_note || '')
    setIsEditingNote(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 max-w-[712px]`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {item.is_read ? (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                <Check className="w-3 h-3" />
                Read
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                <BookOpen className="w-3 h-3" />
                Unread
              </div>
            )}
            <span className="text-xs text-gray-500">
              Added {formatDate(item.created_at)}
            </span>
          </div>

          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block hover:opacity-80 transition-opacity cursor-pointer"
          >
            <h3 className={`text-lg font-semibold mb-2 leading-normal my-4 ${
              item.is_read ? 'text-gray-600 line-through' : 'text-gray-900'
            }`}>
              {item.title}
            </h3>
          </a>

          {item.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-4 max-w-[64ch]">
              {item.description}
            </p>
          )}

          {item.text_note && !isEditingNote && (
            <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-300 rounded-r-lg mb-4">
              <div className="flex items-center gap-2 mb-1 text-gray-700 font-medium text-sm">
                <StickyNote className="w-4 h-4" />
                Note
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-[8]">
                {item.text_note}
              </p>
            </div>
          )}

          {isEditingNote && (
            <div className="mt-4 space-y-2 mb-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                <StickyNote className="w-4 h-4" />
                {item.text_note ? 'Edit Note' : 'Add Note'}
              </div>
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[100px]"
                placeholder="Add your thoughts about this article..."
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelNote}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Check className="w-4 h-4 animate-pulse" />}
                  Save Note
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Read Article
            </a>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-500 truncate max-w-xs">
              {new URL(item.url).hostname}
            </span>
          </div>
        </div>

        {item.image_url && (
          <div className="flex-shrink-0 w-20 h-20">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleRead}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              item.is_read
                ? 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {item.is_read ? (
              <>
                <X className="w-4 h-4" />
                Mark Unread
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Mark as Read
              </>
            )}
          </button>

          {!isEditingNote && (
            <button
              onClick={() => setIsEditingNote(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <StickyNote className="w-4 h-4" />
              {item.text_note ? 'Edit Note' : 'Add Note'}
            </button>
          )}
        </div>

        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Delete this item?</span>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
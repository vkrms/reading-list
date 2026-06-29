import React, { useState, useEffect } from 'react'
import { ExternalLink, Check, X, MoreHorizontal, Tag, Trash2, BookOpen, StickyNote } from 'lucide-react'
import type { Database } from '../lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { TagCombobox } from '@/components/TagCombobox'

type ReadingListItem = Database['public']['Tables']['reading_list_items']['Row']

interface ReadingListItemProps {
  item: ReadingListItem
  allTags: string[]
  onToggleRead: (id: string, isRead: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, updates: Partial<ReadingListItem>) => Promise<ReadingListItem>
}

export function ReadingListItem({ item, allTags, onToggleRead, onDelete, onUpdate }: ReadingListItemProps) {
  const [loading, setLoading] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(item.text_note || '')
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [tagValue, setTagValue] = useState(item.tag ?? '')

  useEffect(() => {
    if (!isEditingNote) {
      setNoteValue(item.text_note || '')
    }
  }, [item.text_note, isEditingNote])

  useEffect(() => {
    setTagValue(item.tag ?? '')
  }, [item.tag])

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
    }
  }

  const handleSaveTag = async () => {
    const trimmed = (tagValue ?? '').trim()
    if (!trimmed) return
    setLoading(true)
    try {
      await onUpdate(item.id, { tag: trimmed })
      setTagDialogOpen(false)
    } finally {
      setLoading(false)
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
    <Card className="max-w-[712px] border-white/70 bg-white/95 shadow-md transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {item.is_read ? (
                <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <Check className="w-3 h-3" />
                  Read
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <BookOpen className="w-3 h-3" />
                  Unread
                </Badge>
              )}
              <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                {item.tag}
              </Badge>
              <span className="text-xs text-slate-500">
                Added {formatDate(item.created_at)}
              </span>
            </div>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:opacity-80 transition-opacity cursor-pointer"
            >
              <h3 className={`text-lg font-semibold mb-2 leading-normal my-4 ${item.is_read ? 'text-gray-600 line-through' : 'text-gray-900'
                }`}>
                {item.title}
              </h3>
            </a>

            {item.description && (
              <p className="mb-3 max-w-[64ch] text-sm text-slate-600 line-clamp-4">
                {item.description}
              </p>
            )}

            {item.text_note && !isEditingNote && (
              <div className="mb-4 mt-4 rounded-r-lg border-l-4 border-slate-300 bg-slate-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <StickyNote className="w-4 h-4" />
                  Note
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-[8]">
                  {item.text_note}
                </p>
              </div>
            )}

            {isEditingNote && (
              <div className="mb-4 mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <StickyNote className="w-4 h-4" />
                  {item.text_note ? 'Edit Note' : 'Add Note'}
                </div>
                <Textarea
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Add your thoughts about this article..."
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleCancelNote}
                    variant="ghost"
                    className="text-slate-600 hover:text-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveNote}
                    disabled={loading}
                    className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {loading && <Check className="w-4 h-4 animate-pulse" />}
                    Save Note
                  </Button>
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
              <span className="text-slate-400">•</span>
              <span className="max-w-xs truncate text-xs text-slate-500">
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

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-1">
            <Button
              onClick={handleToggleRead}
              disabled={loading}
              variant="ghost"
              className={item.is_read
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-700'
                : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'}
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
            </Button>

            {!isEditingNote && (
              <Button
                onClick={() => setIsEditingNote(true)}
                variant="ghost"
                className="text-slate-600 hover:bg-slate-100 hover:text-slate-700"
              >
                <StickyNote className="w-4 h-4" />
                {item.text_note ? 'Edit Note' : 'Add Note'}
              </Button>
            )}
          </div>

          {/* ⋯ actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => { setTagValue(item.tag); setTagDialogOpen(true) }}>
                <Tag className="h-4 w-4" />
                Edit Tag
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleDelete}
                disabled={loading}
                className="text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* Edit Tag dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <TagCombobox
            value={tagValue}
            onChange={setTagValue}
            suggestions={allTags}
          />
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSaveTag}
              disabled={loading || !(tagValue ?? '').trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import toast from 'react-hot-toast'

type ReadingListItem = Database['public']['Tables']['reading_list_items']['Row']

export function useReadingList(userId: string | undefined) {
  const [items, setItems] = useState<ReadingListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchItems()
    }
  }, [userId])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_list_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
      toast.error('Failed to load reading list')
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (url: string, openGraphData: any) => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('reading_list_items')
        .insert({
          user_id: userId,
          url,
          title: openGraphData.title,
          description: openGraphData.description,
          image_url: openGraphData.image
        })
        .select()
        .single()

      if (error) throw error
      
      setItems(prev => [data, ...prev])
      toast.success('Article added to reading list')
      return data
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add article')
      throw error
    }
  }

  const updateItem = async (id: string, updates: Partial<ReadingListItem>) => {
    try {
      const { data, error } = await supabase
        .from('reading_list_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setItems(prev => prev.map(item => item.id === id ? data : item))
      return data
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update article')
      throw error
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reading_list_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      setItems(prev => prev.filter(item => item.id !== id))
      toast.success('Article removed from reading list')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to remove article')
      throw error
    }
  }

  const toggleRead = async (id: string, isRead: boolean) => {
    await updateItem(id, { is_read: isRead })
    toast.success(isRead ? 'Marked as read' : 'Marked as unread')
  }

  return {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleRead,
    refetch: fetchItems
  }
}
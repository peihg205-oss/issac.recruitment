'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMemberUnreadCount, getAdminUnreadCount } from '@/lib/messages-manager'

/**
 * Hook to get real-time unread messages count for a candidate/member.
 * Subscribes to:
 * 1. window CustomEvent 'issac_chat_unread_changed'
 * 2. BroadcastChannel 'issac_chat_channel'
 * 3. Supabase Realtime postgres_changes on audit_logs & messages
 * 4. Fallback interval
 */
export function useMemberChatUnread(userId?: string | null, applicationId?: string | null) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const updateCount = async () => {
      try {
        let uid = userId
        if (!uid) {
          const { data: { user } } = await supabase.auth.getUser()
          uid = user?.id || null
        }
        if (!uid) return

        const count = await getMemberUnreadCount(supabase, uid, applicationId)
        if (isMounted) {
          setUnreadCount(count)
        }
      } catch (e) {
        // silent fail
      }
    }

    updateCount()

    // 1. In-app custom event
    const handleEvent = () => updateCount()
    window.addEventListener('issac_chat_unread_changed', handleEvent)

    // 2. Cross-tab BroadcastChannel
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('issac_chat_channel')
      bc.onmessage = () => updateCount()
    } catch {}

    // 3. Supabase Realtime Channel
    const channel = supabase
      .channel(`rt-member-unread-${userId || 'me'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => updateCount())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => updateCount())
      .subscribe()

    // 4. Polling fallback every 6 seconds
    const interval = setInterval(updateCount, 6000)

    return () => {
      isMounted = false
      window.removeEventListener('issac_chat_unread_changed', handleEvent)
      if (bc) bc.close()
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [userId, applicationId, supabase])

  return unreadCount
}

/**
 * Hook to get real-time unread messages count for Admin.
 */
export function useAdminChatUnread() {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const updateCount = async () => {
      try {
        const count = await getAdminUnreadCount(supabase)
        if (isMounted) {
          setUnreadCount(count)
        }
      } catch {}
    }

    updateCount()

    const handleEvent = () => updateCount()
    window.addEventListener('issac_chat_unread_changed', handleEvent)

    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('issac_chat_channel')
      bc.onmessage = () => updateCount()
    } catch {}

    const channel = supabase
      .channel('rt-admin-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => updateCount())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => updateCount())
      .subscribe()

    const interval = setInterval(updateCount, 6000)

    return () => {
      isMounted = false
      window.removeEventListener('issac_chat_unread_changed', handleEvent)
      if (bc) bc.close()
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [supabase])

  return unreadCount
}

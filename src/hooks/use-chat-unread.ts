'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMemberUnreadCount, getAdminUnreadCount } from '@/lib/messages-manager'

/**
 * Hook to get real-time unread messages count for a candidate/member.
 * Safe, debounced, and does not cause infinite re-renders.
 */
export function useMemberChatUnread(userId?: string | null, applicationId?: string | null) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])
  const isUpdatingRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const updateCount = async () => {
      if (isUpdatingRef.current) return
      isUpdatingRef.current = true
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
      } finally {
        isUpdatingRef.current = false
      }
    }

    // Run once on mount
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

    // 3. Supabase Realtime Channel (Only listen for new messages, avoid loops)
    const channelName = `rt-m-unread-${userId || 'me'}-${Math.random().toString(36).slice(2, 6)}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload: any) => {
        if (payload?.new?.action === 'CHAT_MESSAGE') {
          updateCount()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        updateCount()
      })
      .subscribe()

    // 4. Fallback interval every 12 seconds
    const interval = setInterval(updateCount, 12000)

    return () => {
      isMounted = false
      window.removeEventListener('issac_chat_unread_changed', handleEvent)
      if (bc) bc.close()
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [userId, applicationId]) // eslint-disable-line react-hooks/exhaustive-deps

  return unreadCount
}

/**
 * Hook to get real-time unread messages count for Admin.
 */
export function useAdminChatUnread(adminRole?: string) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = useMemo(() => createClient(), [])
  const isUpdatingRef = useRef(false)

  // Resolve role from param or cookie
  const effectiveRole = useMemo(() => {
    if (adminRole) return adminRole
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)issac_admin_role=([^;]+)/)
      if (match) return match[1]
    }
    return 'chu-nhiem'
  }, [adminRole])

  useEffect(() => {
    let isMounted = true

    const updateCount = async () => {
      if (isUpdatingRef.current) return
      isUpdatingRef.current = true
      try {
        const count = await getAdminUnreadCount(supabase, effectiveRole)
        if (isMounted) {
          setUnreadCount(count)
        }
      } catch {} finally {
        isUpdatingRef.current = false
      }
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
      .channel(`rt-adm-unread-${Math.random().toString(36).slice(2, 6)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload: any) => {
        if (payload?.new?.action === 'CHAT_MESSAGE') {
          updateCount()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        updateCount()
      })
      .subscribe()

    const interval = setInterval(updateCount, 12000)

    return () => {
      isMounted = false
      window.removeEventListener('issac_chat_unread_changed', handleEvent)
      if (bc) bc.close()
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [effectiveRole]) // eslint-disable-line react-hooks/exhaustive-deps

  return unreadCount
}

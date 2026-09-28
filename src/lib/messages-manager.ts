import { SupabaseClient } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  application_id: string // Can be application_id or candidate user_id
  sender_id: string
  sender_role: 'member' | 'admin'
  sender_name: string | null
  content: string
  is_read: boolean
  created_at: string
}

export interface ConversationSummary {
  application_id: string // Primary conversation key: app.id || profile.id
  candidate_id: string
  candidate_name: string
  candidate_student_id: string
  candidate_email?: string
  candidate_phone?: string
  dept_name: string
  dept_slug?: string | null
  has_application: boolean
  last_message: string
  last_time: string
  unread_count: number
  total_messages: number
}

const LOCAL_STORAGE_PREFIX = 'issac_chat_msgs_'

/**
 * Broadcast an unread change event to all components & tabs
 */
export function notifyUnreadChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('issac_chat_unread_changed'))
    try {
      const bc = new BroadcastChannel('issac_chat_channel')
      bc.postMessage({ type: 'unread_changed', timestamp: Date.now() })
      bc.close()
    } catch {}
  }
}

/**
 * Helper to get locally cached messages
 */
function getLocalMessages(key: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`)
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
  } catch {
    return []
  }
}

/**
 * Helper to save messages to local cache
 */
function saveLocalMessages(key: string, msgs: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(msgs))
  } catch (e) {
    console.warn('Failed to cache chat messages locally:', e)
  }
}

/**
 * Fetch all messages for a given conversation (by application_id or candidate user_id).
 * Checks both `messages` table (if present) and `audit_logs` (action: 'CHAT_MESSAGE')
 * to ensure 100% reliable cross-device sync on laptop and phone.
 */
export async function fetchApplicationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  candidateUserId?: string
): Promise<ChatMessage[]> {
  const mergedMap = new Map<string, ChatMessage>()
  const searchIds = Array.from(new Set([conversationId, candidateUserId].filter(Boolean) as string[]))

  // 1. Check local cache first for instant feedback
  searchIds.forEach(id => {
    const localList = getLocalMessages(id)
    localList.forEach(m => mergedMap.set(m.id, m))
  })

  // 2. Try fetching from Supabase `messages` table
  try {
    for (const id of searchIds) {
      const { data: dbMsgs, error: dbErr } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: true })

      if (!dbErr && dbMsgs && dbMsgs.length > 0) {
        dbMsgs.forEach((m: any) => {
          mergedMap.set(m.id, {
            id: m.id,
            application_id: conversationId,
            sender_id: m.sender_id,
            sender_role: m.sender_role,
            sender_name: m.sender_name || null,
            content: m.content,
            is_read: Boolean(m.is_read),
            created_at: m.created_at,
          })
        })
      }
    }
  } catch (err) {
    console.debug('Messages table not queried:', err)
  }

  // 3. Always fetch from `audit_logs` where action = 'CHAT_MESSAGE'
  try {
    const { data: auditMsgs, error: auditErr } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'CHAT_MESSAGE')
      .order('created_at', { ascending: true })

    if (!auditErr && auditMsgs && auditMsgs.length > 0) {
      auditMsgs.forEach((log: any) => {
        const meta = log.metadata || {}
        const msgId = meta.id || log.id
        const appId = meta.application_id || meta.conversation_id || log.target_id
        const candidateId = meta.candidate_user_id || (meta.sender_role === 'member' ? meta.sender_id : null)

        // Check if message belongs to this conversation
        const isMatch = searchIds.some(id =>
          id === appId ||
          id === log.target_id ||
          (candidateId && id === candidateId) ||
          (meta.sender_role === 'member' && id === meta.sender_id)
        )

        if (isMatch) {
          const role = meta.sender_role || (log.user_name?.toLowerCase().includes('ban') ? 'admin' : 'member')
          const content = meta.content || log.description || ''

          if (content) {
            const existing = mergedMap.get(msgId)
            mergedMap.set(msgId, {
              id: msgId,
              application_id: conversationId,
              sender_id: meta.sender_id || log.user_id || 'system',
              sender_role: role,
              sender_name: meta.sender_name || log.user_name || (role === 'admin' ? 'Ban Tuyển quân iSSAC' : 'Ứng viên'),
              content,
              is_read: existing ? existing.is_read : Boolean(meta.is_read),
              created_at: meta.created_at || log.created_at,
            })
          }
        }
      })
    }
  } catch (err) {
    console.warn('Error fetching audit_logs chat:', err)
  }

  // 4. Check read status overrides from audit_logs CHAT_READ
  try {
    const { data: readLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'CHAT_READ')
      .order('created_at', { ascending: false })
      .limit(20)

    if (readLogs && readLogs.length > 0) {
      readLogs.forEach((rl: any) => {
        const target = rl.target_id || rl.metadata?.application_id || rl.metadata?.conversation_id
        const isTargetMatch = searchIds.includes(target)
        if (isTargetMatch) {
          const readerRole = rl.metadata?.reader_role
          const readAt = new Date(rl.metadata?.read_at || rl.created_at).getTime()
          if (readerRole) {
            mergedMap.forEach(m => {
              const msgTime = new Date(m.created_at).getTime()
              if (msgTime <= readAt) {
                if (readerRole === 'member' && m.sender_role === 'admin') {
                  m.is_read = true
                } else if (readerRole === 'admin' && m.sender_role === 'member') {
                  m.is_read = true
                }
              }
            })
          }
        }
      })
    }
  } catch {}

  // 5. Convert to sorted array
  const result = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Save latest to local cache for all search IDs
  searchIds.forEach(id => saveLocalMessages(id, result))
  return result
}

/**
 * Send a chat message between Candidate and Ban Tuyển quân / Ban Chủ nhiệm.
 * Works immediately upon account creation even without an application!
 * Persists to Supabase DB + Supabase audit_logs + localStorage cache.
 */
export async function sendChatMessage(
  supabase: SupabaseClient,
  params: {
    application_id?: string | null
    conversation_id?: string
    sender_id: string
    sender_role: 'member' | 'admin'
    sender_name: string
    content: string
    candidate_user_id?: string
  }
): Promise<ChatMessage> {
  const { sender_id, sender_role, sender_name, content } = params
  const trimmed = content.trim()
  if (!trimmed) throw new Error('Nội dung cảnh báo không được để trống')

  // CHẶN ỨNG VIÊN PHẢN HỒI: Ứng viên chỉ có quyền xem cảnh báo, không có quyền gửi/phản hồi
  if (sender_role === 'member') {
    throw new Error('Ứng viên chỉ có quyền xem thông báo cảnh báo từ Ban Tuyển quân và không có quyền phản hồi.')
  }

  const conversationKey = params.conversation_id || params.application_id || params.candidate_user_id || sender_id
  const targetAppId = params.application_id || conversationKey
  const candidateUserId = params.candidate_user_id

  const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}`
  const nowIso = new Date().toISOString()

  const newMsg: ChatMessage = {
    id: msgId,
    application_id: conversationKey,
    sender_id,
    sender_role,
    sender_name,
    content: trimmed,
    is_read: false,
    created_at: nowIso,
  }

  // 1. Save to local cache immediately for instant render
  const existing = getLocalMessages(conversationKey)
  const updated = [...existing.filter(m => m.id !== msgId), newMsg]
  saveLocalMessages(conversationKey, updated)
  if (candidateUserId && candidateUserId !== conversationKey) {
    saveLocalMessages(candidateUserId, updated)
  }

  // Notify tabs immediately of unread change
  notifyUnreadChanged()

  // 2. Try inserting into Supabase `messages` table
  let insertedToTable = false
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(targetAppId)) {
      const { error: tableErr } = await supabase.from('messages').insert({
        id: msgId,
        application_id: targetAppId,
        sender_id,
        sender_role,
        sender_name,
        content: trimmed,
        is_read: false,
        created_at: nowIso,
      })
      if (!tableErr) insertedToTable = true
    }
  } catch {}

  // 3. Always insert into Supabase `audit_logs` (unrestricted cross-device persistence across phone & laptop)
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const safeUserId = uuidRegex.test(sender_id) ? sender_id : null
    const safeTargetId = uuidRegex.test(conversationKey)
      ? conversationKey
      : (candidateUserId && uuidRegex.test(candidateUserId) ? candidateUserId : null)

    await supabase.from('audit_logs').insert({
      action: 'CHAT_MESSAGE',
      target_type: 'candidate_warning',
      target_id: safeTargetId,
      user_id: safeUserId,
      user_name: sender_name,
      description: trimmed,
      metadata: {
        id: msgId,
        conversation_id: conversationKey,
        application_id: params.application_id || null,
        candidate_user_id: candidateUserId || null,
        sender_id,
        sender_role,
        sender_name,
        content: trimmed,
        is_read: false,
        created_at: nowIso,
        saved_to_table: insertedToTable,
      },
    })
  } catch (e) {
    console.warn('Failed to insert warning into audit_logs:', e)
  }

  // 4. Send warning notification to recipient
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (sender_role === 'admin' && candidateUserId && uuidRegex.test(candidateUserId)) {
      await supabase.from('notifications').insert({
        user_id: candidateUserId,
        title: 'Cảnh báo từ Ban Tuyển quân iSSAC',
        message: `${sender_name}: "${trimmed.slice(0, 100)}${trimmed.length > 100 ? '...' : ''}"`,
        type: 'warning',
        action_url: '/member/messages',
      })
    }
  } catch {}

  // Broadcast again after DB insert
  notifyUnreadChanged()

  return newMsg
}

/**
 * Mark messages in a conversation as read by a specific role.
 */
export async function markChatAsRead(
  supabase: SupabaseClient,
  conversationId: string,
  readerRole: 'member' | 'admin',
  candidateUserId?: string
): Promise<void> {
  const searchIds = Array.from(new Set([conversationId, candidateUserId].filter(Boolean) as string[]))

  // 1. Update local cache
  searchIds.forEach(id => {
    const localList = getLocalMessages(id)
    let changed = false
    const updated = localList.map(m => {
      if (readerRole === 'member' && m.sender_role === 'admin' && !m.is_read) {
        changed = true
        return { ...m, is_read: true }
      }
      if (readerRole === 'admin' && m.sender_role === 'member' && !m.is_read) {
        changed = true
        return { ...m, is_read: true }
      }
      return m
    })
    if (changed) saveLocalMessages(id, updated)
  })

  notifyUnreadChanged()

  // 2. Update `messages` table if possible
  try {
    const filterRole = readerRole === 'member' ? 'admin' : 'member'
    for (const id of searchIds) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('application_id', id)
        .eq('sender_role', filterRole)
    }
  } catch {}

  notifyUnreadChanged()
}

/**
 * Get total unread messages count for a candidate/member (messages from admin that are not read)
 */
export async function getMemberUnreadCount(
  supabase: SupabaseClient,
  userId: string,
  applicationId?: string | null
): Promise<number> {
  if (!userId) return 0
  try {
    const msgs = await fetchApplicationMessages(supabase, applicationId || userId, userId)
    return msgs.filter(m => m.sender_role === 'admin' && !m.is_read).length
  } catch {
    return 0
  }
}

/**
 * Get total unread messages count for Admin (messages from members that are not read)
 */
export async function getAdminUnreadCount(supabase: SupabaseClient, adminRole?: string): Promise<number> {
  try {
    const convs = await fetchAllConversations(supabase)
    const isSuper = !adminRole || adminRole === 'chu-nhiem' || adminRole === 'super_admin'
    const filtered = isSuper ? convs : convs.filter(c => c.dept_slug === adminRole)
    return filtered.reduce((sum, c) => sum + c.unread_count, 0)
  } catch {
    return 0
  }
}

/**
 * Fetch all conversation summaries for the Admin portal (/admin/messages).
 * Reads ALL candidates (even newly registered accounts without applications yet).
 */
export async function fetchAllConversations(
  supabase: SupabaseClient
): Promise<ConversationSummary[]> {
  // 1. Fetch all candidate profiles (excluding admins/deleted)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, student_id, email, phone, role, is_active, created_at')
    .not('role', 'in', '("admin","super_admin","deleted")')
    .order('created_at', { ascending: false })

  const candidateProfiles = profiles || []

  // 2. Fetch all applications
  const { data: apps } = await supabase
    .from('applications')
    .select(`
      id, user_id, status, created_at,
      departments!applications_department_id_fkey(name, slug)
    `)
    .order('created_at', { ascending: false })

  const appsByUserId = new Map<string, any>()
  if (apps) {
    apps.forEach(app => {
      if (app.user_id) appsByUserId.set(app.user_id, app)
    })
  }

  // 3. Gather all messages from both `messages` table and `audit_logs`
  const allMessagesMap = new Map<string, ChatMessage & { candidate_user_id?: string }>()

  // A. from `messages` table
  try {
    const { data: dbMsgs } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (dbMsgs) {
      dbMsgs.forEach((m: any) => {
        allMessagesMap.set(m.id, {
          id: m.id,
          application_id: m.application_id,
          sender_id: m.sender_id,
          sender_role: m.sender_role,
          sender_name: m.sender_name || null,
          content: m.content,
          is_read: Boolean(m.is_read),
          created_at: m.created_at,
        })
      })
    }
  } catch {}

  // B. from `audit_logs` table
  try {
    const { data: auditMsgs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'CHAT_MESSAGE')
      .order('created_at', { ascending: true })

    if (auditMsgs) {
      auditMsgs.forEach((log: any) => {
        const meta = log.metadata || {}
        const msgId = meta.id || log.id
        const appId = meta.application_id || meta.conversation_id || log.target_id
        const candidateUserId = meta.candidate_user_id || (meta.sender_role === 'member' ? meta.sender_id : null)

        if (appId && (meta.content || log.description)) {
          const role = meta.sender_role || (log.user_name?.toLowerCase().includes('ban') ? 'admin' : 'member')
          const existing = allMessagesMap.get(msgId)
          allMessagesMap.set(msgId, {
            id: msgId,
            application_id: appId,
            candidate_user_id: candidateUserId,
            sender_id: meta.sender_id || log.user_id || 'system',
            sender_role: role,
            sender_name: meta.sender_name || log.user_name || (role === 'admin' ? 'Ban Tuyển quân iSSAC' : 'Ứng viên'),
            content: meta.content || log.description || '',
            is_read: existing ? existing.is_read : Boolean(meta.is_read),
            created_at: meta.created_at || log.created_at,
          })
        }
      })
    }
  } catch {}

  // C. Map all messages to candidate profiles
  const msgsByProfileId: Record<string, ChatMessage[]> = {}
  allMessagesMap.forEach(m => {
    let matchedProfile = candidateProfiles.find(p => {
      const app = appsByUserId.get(p.id)
      return (
        p.id === m.application_id ||
        (app && app.id === m.application_id) ||
        p.id === m.candidate_user_id ||
        (m.sender_role === 'member' && p.id === m.sender_id)
      )
    })

    if (matchedProfile) {
      if (!msgsByProfileId[matchedProfile.id]) msgsByProfileId[matchedProfile.id] = []
      msgsByProfileId[matchedProfile.id].push(m)
    }
  })

  // D. Build summaries for all candidates
  const convs: ConversationSummary[] = candidateProfiles.map(prof => {
    const app = appsByUserId.get(prof.id)
    const conversationKey = app?.id || prof.id
    const profMsgs = (msgsByProfileId[prof.id] || []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const lastMsg = profMsgs[profMsgs.length - 1]
    const unread = profMsgs.filter(m => m.sender_role === 'member' && !m.is_read).length

    let deptName = 'Tài khoản mới (Chưa nộp đơn)'
    let deptSlug: string | null = null
    if (app?.departments?.name) {
      deptName = `Ban ${app.departments.name}`
      deptSlug = app.departments.slug || null
    } else if (app) {
      deptName = 'Đơn ứng tuyển (Đang chọn ban)'
    }

    return {
      application_id: conversationKey,
      candidate_id: prof.id,
      candidate_name: prof.full_name || 'Ứng viên Gen 3',
      candidate_student_id: prof.student_id || '',
      candidate_email: prof.email || '',
      candidate_phone: prof.phone || '',
      dept_name: deptName,
      dept_slug: deptSlug,
      has_application: Boolean(app),
      last_message: lastMsg ? lastMsg.content : 'Chưa có cảnh báo nào',
      last_time: lastMsg ? lastMsg.created_at : prof.created_at,
      unread_count: unread,
      total_messages: profMsgs.length,
    }
  })

  // Sort: conversations with messages first (most recent message first), then new candidates without messages
  convs.sort((a, b) => {
    if (a.total_messages > 0 && b.total_messages === 0) return -1
    if (a.total_messages === 0 && b.total_messages > 0) return 1
    return new Date(b.last_time).getTime() - new Date(a.last_time).getTime()
  })

  return convs
}

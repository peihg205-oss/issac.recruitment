import { SupabaseClient } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  application_id: string
  sender_id: string
  sender_role: 'member' | 'admin'
  sender_name: string | null
  content: string
  is_read: boolean
  created_at: string
}

export interface ConversationSummary {
  application_id: string
  candidate_name: string
  candidate_student_id: string
  candidate_email?: string
  candidate_phone?: string
  dept_name: string
  last_message: string
  last_time: string
  unread_count: number
  total_messages: number
}

const LOCAL_STORAGE_PREFIX = 'issac_chat_msgs_'
const LOCAL_STORAGE_READ_PREFIX = 'issac_chat_read_'

/**
 * Helper to get locally cached messages for an application
 */
function getLocalMessages(applicationId: string): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${applicationId}`)
    if (!raw) return []
    return JSON.parse(raw) as ChatMessage[]
  } catch {
    return []
  }
}

/**
 * Helper to save messages to local cache
 */
function saveLocalMessages(applicationId: string, msgs: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${applicationId}`, JSON.stringify(msgs))
  } catch (e) {
    console.warn('Failed to cache chat messages locally:', e)
  }
}

/**
 * Fetch all messages for a given application.
 * Checks both `messages` table (if present) and `audit_logs` (action: 'CHAT_MESSAGE')
 * to ensure 100% reliable cross-device sync on laptop and phone.
 */
export async function fetchApplicationMessages(
  supabase: SupabaseClient,
  applicationId: string
): Promise<ChatMessage[]> {
  const mergedMap = new Map<string, ChatMessage>()

  // 1. Check local cache first for instant feedback
  const localList = getLocalMessages(applicationId)
  localList.forEach(m => mergedMap.set(m.id, m))

  // 2. Try fetching from Supabase `messages` table
  try {
    const { data: dbMsgs, error: dbErr } = await supabase
      .from('messages')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true })

    if (!dbErr && dbMsgs && dbMsgs.length > 0) {
      dbMsgs.forEach((m: any) => {
        mergedMap.set(m.id, {
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
  } catch (err) {
    // Graceful fallback if table does not exist
    console.debug('Messages table not queried:', err)
  }

  // 3. Always fetch from `audit_logs` where action = 'CHAT_MESSAGE'
  try {
    const { data: auditMsgs, error: auditErr } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'CHAT_MESSAGE')
      .eq('target_id', applicationId)
      .order('created_at', { ascending: true })

    if (!auditErr && auditMsgs && auditMsgs.length > 0) {
      auditMsgs.forEach((log: any) => {
        const meta = log.metadata || {}
        const msgId = meta.id || log.id
        const role = meta.sender_role || (log.user_name?.toLowerCase().includes('ban') ? 'admin' : 'member')
        const content = meta.content || log.description || ''

        if (content) {
          // If not already present or more detailed, update
          const existing = mergedMap.get(msgId)
          mergedMap.set(msgId, {
            id: msgId,
            application_id: applicationId,
            sender_id: meta.sender_id || log.user_id || 'system',
            sender_role: role,
            sender_name: meta.sender_name || log.user_name || (role === 'admin' ? 'Ban Tuyển quân iSSAC' : 'Ứng viên'),
            content,
            is_read: existing ? existing.is_read : Boolean(meta.is_read),
            created_at: meta.created_at || log.created_at,
          })
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
      .eq('target_id', applicationId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (readLogs && readLogs.length > 0) {
      readLogs.forEach((rl: any) => {
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
      })
    }
  } catch {}

  // 5. Convert to sorted array
  const result = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Save latest to local cache
  saveLocalMessages(applicationId, result)
  return result
}

/**
 * Send a chat message between Candidate and Ban Tuyển quân / Ban Chủ nhiệm.
 * Persists to Supabase DB + Supabase audit_logs + localStorage cache.
 */
export async function sendChatMessage(
  supabase: SupabaseClient,
  params: {
    application_id: string
    sender_id: string
    sender_role: 'member' | 'admin'
    sender_name: string
    content: string
    candidate_user_id?: string
  }
): Promise<ChatMessage> {
  const { application_id, sender_id, sender_role, sender_name, content, candidate_user_id } = params
  const trimmed = content.trim()
  if (!trimmed) throw new Error('Tin nhắn không được để trống')

  const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}`
  const nowIso = new Date().toISOString()

  const newMsg: ChatMessage = {
    id: msgId,
    application_id,
    sender_id,
    sender_role,
    sender_name,
    content: trimmed,
    is_read: false,
    created_at: nowIso,
  }

  // 1. Save to local cache immediately
  const existing = getLocalMessages(application_id)
  const updated = [...existing.filter(m => m.id !== msgId), newMsg]
  saveLocalMessages(application_id, updated)

  // 2. Try inserting into Supabase `messages` table
  let insertedToTable = false
  try {
    const { error: tableErr } = await supabase.from('messages').insert({
      id: msgId,
      application_id,
      sender_id,
      sender_role,
      sender_name,
      content: trimmed,
      is_read: false,
      created_at: nowIso,
    })
    if (!tableErr) insertedToTable = true
  } catch {}

  // 3. Insert into Supabase `audit_logs` (unrestricted cross-device persistence across phone & laptop)
  try {
    await supabase.from('audit_logs').insert({
      action: 'CHAT_MESSAGE',
      target_type: 'application',
      target_id: application_id,
      user_id: sender_id,
      user_name: sender_name,
      description: trimmed,
      metadata: {
        id: msgId,
        application_id,
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
    console.warn('Failed to insert chat into audit_logs:', e)
  }

  // 4. Send notification to recipient
  try {
    if (sender_role === 'admin' && candidate_user_id) {
      // Admin replied to candidate -> notify candidate
      await supabase.from('notifications').insert({
        user_id: candidate_user_id,
        title: 'Phản hồi mới từ Ban Tuyển quân iSSAC',
        message: `${sender_name}: "${trimmed.slice(0, 100)}${trimmed.length > 100 ? '...' : ''}"`,
        type: 'info',
        action_url: '/member/messages',
      })
    } else if (sender_role === 'member') {
      // Candidate messaged -> find admin / notify
      // Notification will be visible in Admin messages list badge
    }
  } catch {}

  return newMsg
}

/**
 * Mark messages in an application as read by a specific role.
 */
export async function markChatAsRead(
  supabase: SupabaseClient,
  applicationId: string,
  readerRole: 'member' | 'admin'
): Promise<void> {
  // 1. Update local cache
  const localList = getLocalMessages(applicationId)
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
  if (changed) saveLocalMessages(applicationId, updated)

  // 2. Update `messages` table
  try {
    const filterRole = readerRole === 'member' ? 'admin' : 'member'
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('application_id', applicationId)
      .eq('sender_role', filterRole)
  } catch {}

  // 3. Log read event in audit_logs so all other devices receive the read status
  try {
    await supabase.from('audit_logs').insert({
      action: 'CHAT_READ',
      target_type: 'application',
      target_id: applicationId,
      description: `Messages read by ${readerRole}`,
      metadata: {
        reader_role: readerRole,
        read_at: new Date().toISOString(),
      },
    })
  } catch {}
}

/**
 * Fetch all conversation summaries for the Admin portal (/admin/messages).
 * Reads all candidate applications and cross-references all messages.
 */
export async function fetchAllConversations(
  supabase: SupabaseClient
): Promise<ConversationSummary[]> {
  // 1. Fetch all applications
  const { data: apps, error: appErr } = await supabase
    .from('applications')
    .select(`
      id, user_id, status, created_at,
      departments!applications_department_id_fkey(name)
    `)
    .order('created_at', { ascending: false })

  if (appErr || !apps || apps.length === 0) return []

  // 2. Fetch candidate profiles
  const userIds = Array.from(new Set(apps.map(a => a.user_id).filter(Boolean)))
  let profilesMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, student_id, email, phone')
      .in('id', userIds)
    if (profs) profs.forEach(p => { profilesMap[p.id] = p })
  }

  // 3. Gather messages from both `messages` table and `audit_logs`
  const allMessagesMap = new Map<string, ChatMessage>()

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
        const appId = meta.application_id || log.target_id
        if (appId && (meta.content || log.description)) {
          const role = meta.sender_role || (log.user_name?.toLowerCase().includes('ban') ? 'admin' : 'member')
          const existing = allMessagesMap.get(msgId)
          allMessagesMap.set(msgId, {
            id: msgId,
            application_id: appId,
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

  // C. Group messages by application_id
  const msgsByApp: Record<string, ChatMessage[]> = {}
  allMessagesMap.forEach(m => {
    if (!msgsByApp[m.application_id]) msgsByApp[m.application_id] = []
    msgsByApp[m.application_id].push(m)
  })

  // D. Build summaries for all applications that have messages or exist
  const convs: ConversationSummary[] = apps.map(app => {
    const prof = profilesMap[app.user_id] || {}
    const appMsgs = (msgsByApp[app.id] || []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const lastMsg = appMsgs[appMsgs.length - 1]
    const unread = appMsgs.filter(m => m.sender_role === 'member' && !m.is_read).length

    return {
      application_id: app.id,
      candidate_name: prof.full_name || 'Ứng viên Gen 3',
      candidate_student_id: prof.student_id || '',
      candidate_email: prof.email || '',
      candidate_phone: prof.phone || '',
      dept_name: (app.departments as any)?.name || 'Chưa phân ban',
      last_message: lastMsg ? lastMsg.content : 'Chưa có tin nhắn nào',
      last_time: lastMsg ? lastMsg.created_at : app.created_at,
      unread_count: unread,
      total_messages: appMsgs.length,
    }
  })

  // Sort: conversations with messages first (most recent message first), then others
  convs.sort((a, b) => {
    if (a.total_messages > 0 && b.total_messages === 0) return -1
    if (a.total_messages === 0 && b.total_messages > 0) return 1
    return new Date(b.last_time).getTime() - new Date(a.last_time).getTime()
  })

  return convs
}

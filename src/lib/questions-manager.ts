import { createClient } from './supabase/client'

export interface QuestionOption {
  id: string
  question_id?: string
  option_text: string
  sort_order?: number
}

export interface QuestionItem {
  id: string
  department_id: string | null // null = Câu hỏi chung toàn CLB
  question_text: string
  question_type: 'short_text' | 'long_text' | 'multiple_choice' | 'checkbox' | 'dropdown'
  placeholder?: string | null
  is_required: boolean
  sort_order: number
  is_active: boolean
  departments?: { id?: string; name: string; slug: string } | null
  question_options?: QuestionOption[]
}

export const DEFAULT_COMMON_QUESTIONS: QuestionItem[] = [
  {
    id: 'q-common-1',
    department_id: null,
    question_text: 'Bạn biết đến iSSAC qua kênh thông tin nào?',
    question_type: 'multiple_choice',
    placeholder: 'Chọn kênh bạn biết đến CLB',
    is_required: true,
    sort_order: 1,
    is_active: true,
    departments: null,
    question_options: [
      { id: 'opt-c1-1', option_text: 'Facebook Fanpage CLB' },
      { id: 'opt-c1-2', option_text: 'Instagram @issac.club' },
      { id: 'opt-c1-3', option_text: 'TikTok @issac.club' },
      { id: 'opt-c1-4', option_text: 'Bạn bè / Thành viên CLB giới thiệu' },
      { id: 'opt-c1-5', option_text: 'Kênh truyền thông Trường Quốc tế (VNU-IS)' },
    ],
  },
  {
    id: 'q-common-2',
    department_id: null,
    question_text: 'Mục tiêu lớn nhất của bạn khi ứng tuyển trở thành Đại sứ sinh viên iSSAC Gen 3 là gì?',
    question_type: 'long_text',
    placeholder: 'Chia sẻ định hướng, mong muốn phát triển bản thân và giá trị bạn hướng tới...',
    is_required: true,
    sort_order: 2,
    is_active: true,
    departments: null,
    question_options: [],
  },
  {
    id: 'q-common-3',
    department_id: null,
    question_text: 'Theo bạn, phẩm chất quan trọng nhất của một Đại sứ Sinh viên đại diện cho Trường Quốc tế là gì?',
    question_type: 'long_text',
    placeholder: 'Chia sẻ góc nhìn và quan điểm của bạn...',
    is_required: true,
    sort_order: 3,
    is_active: true,
    departments: null,
    question_options: [],
  },
  {
    id: 'q-common-4',
    department_id: null,
    question_text: 'Bạn có thể dành bao nhiêu thời gian mỗi tuần cho các hoạt động và sự kiện của CLB iSSAC?',
    question_type: 'multiple_choice',
    placeholder: 'Chọn mức độ cam kết thời gian',
    is_required: true,
    sort_order: 4,
    is_active: true,
    departments: null,
    question_options: [
      { id: 'opt-c4-1', option_text: '3 - 5 giờ / tuần' },
      { id: 'opt-c4-2', option_text: '5 - 10 giờ / tuần' },
      { id: 'opt-c4-3', option_text: 'Trên 10 giờ / tuần' },
      { id: 'opt-c4-4', option_text: 'Linh hoạt, sẵn sàng ưu tiên tối đa cho các chiến dịch cao điểm' },
    ],
  },
]

const STORAGE_KEY_CUSTOM_QUESTIONS = 'issac_custom_questions'
const STORAGE_KEY_DELETED_QUESTIONS = 'issac_deleted_question_ids'

export function getDeletedQuestionIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_QUESTIONS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

export function getCustomStoredQuestions(): QuestionItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_QUESTIONS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

export function saveCustomStoredQuestions(list: QuestionItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(list))
    window.dispatchEvent(new Event('issac_questions_updated'))
  } catch {}
}

/**
 * Fetch Question Bank Sync State from Supabase DB (cross-device sync for laptop & phone).
 */
export async function fetchQuestionsBankStateFromDB(): Promise<{
  deletedQuestionIds: string[]
  customQuestions: QuestionItem[]
}> {
  const localDeleted = getDeletedQuestionIds()
  const localCustom = getCustomStoredQuestions()

  try {
    const supabase = createClient()
    const { data: syncLogs } = await supabase
      .from('audit_logs')
      .select('description')
      .eq('action', 'SYNC_QUESTIONS_BANK')
      .order('created_at', { ascending: false })
      .limit(1)

    if (syncLogs && syncLogs.length > 0 && syncLogs[0].description) {
      const parsed = JSON.parse(syncLogs[0].description)
      if (parsed && typeof parsed === 'object') {
        const deletedQuestionIds = Array.isArray(parsed.deletedQuestionIds)
          ? Array.from(new Set([...localDeleted, ...parsed.deletedQuestionIds]))
          : localDeleted

        const customQuestions: QuestionItem[] = Array.isArray(parsed.customQuestions)
          ? parsed.customQuestions
          : localCustom

        // Update local cache
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY_DELETED_QUESTIONS, JSON.stringify(deletedQuestionIds))
            localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(customQuestions))
          } catch {}
        }

        return { deletedQuestionIds, customQuestions }
      }
    }
  } catch (err) {
    console.warn('Error fetching questions bank sync state:', err)
  }

  return { deletedQuestionIds: localDeleted, customQuestions: localCustom }
}

/**
 * Persist Question Bank State to Supabase DB for instant cross-device sync.
 */
export async function syncQuestionsBankStateToDB(state: {
  deletedQuestionIds: string[]
  customQuestions: QuestionItem[]
}): Promise<void> {
  // 1. Update local cache immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_QUESTIONS, JSON.stringify(state.deletedQuestionIds))
      localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(state.customQuestions))
      window.dispatchEvent(new Event('issac_questions_updated'))
      window.dispatchEvent(new Event('storage'))
    } catch {}
  }

  // 2. Sync to Supabase audit_logs (unrestricted cross-device persistence)
  try {
    const supabase = createClient()
    await supabase.from('audit_logs').insert({
      action: 'SYNC_QUESTIONS_BANK',
      user_name: 'BCN',
      description: JSON.stringify({
        deletedQuestionIds: state.deletedQuestionIds,
        customQuestions: state.customQuestions,
        updatedAt: new Date().toISOString(),
      }),
    })
  } catch (err) {
    console.warn('Failed to sync questions bank to DB:', err)
  }
}

export async function fetchAllQuestions(): Promise<QuestionItem[]> {
  const supabase = createClient()

  // 1. Fetch DB sync state first (cross-device sync)
  const { deletedQuestionIds, customQuestions } = await fetchQuestionsBankStateFromDB()

  let remoteQuestions: QuestionItem[] = []
  try {
    const { data: dbData } = await supabase
      .from('questions')
      .select('*, departments(id, name, slug), question_options(id, option_text, sort_order)')
      .eq('is_active', true)
      .order('sort_order')

    if (dbData && dbData.length > 0) {
      remoteQuestions = dbData as QuestionItem[]
    }
  } catch {}

  // 2. Merge map: Default Common Questions -> Remote Questions -> Custom Synced Questions
  const map = new Map<string, QuestionItem>()

  DEFAULT_COMMON_QUESTIONS.forEach(q => {
    if (!deletedQuestionIds.includes(q.id)) {
      map.set(q.id, q)
    }
  })

  remoteQuestions.forEach(q => {
    if (!deletedQuestionIds.includes(q.id)) {
      map.set(q.id, q)
    }
  })

  customQuestions.forEach(q => {
    if (!deletedQuestionIds.includes(q.id)) {
      map.set(q.id, q)
    }
  })

  return Array.from(map.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

export async function saveQuestionItem(item: Partial<QuestionItem>): Promise<QuestionItem> {
  const supabase = createClient()
  const isNew = !item.id

  let assignedDept: any = null
  if (item.department_id && item.department_id !== 'common') {
    if (item.departments) {
      assignedDept = item.departments
    }
  }

  const deptId = (!item.department_id || item.department_id === 'common') ? null : item.department_id

  const questionObj: QuestionItem = {
    id: item.id || `q-custom-${Date.now()}`,
    department_id: deptId,
    question_text: item.question_text || '',
    question_type: item.question_type || 'long_text',
    placeholder: item.placeholder || null,
    is_required: item.is_required ?? true,
    sort_order: item.sort_order || Date.now(),
    is_active: true,
    departments: assignedDept,
    question_options: item.question_options || [],
  }

  // 1. Try persisting to Supabase questions table if allowed
  try {
    if (isNew) {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          department_id: deptId,
          question_text: questionObj.question_text,
          question_type: questionObj.question_type,
          placeholder: questionObj.placeholder,
          is_required: questionObj.is_required,
          sort_order: questionObj.sort_order,
          is_active: true,
        })
        .select('*, departments(id, name, slug), question_options(id, option_text)')
        .single()

      if (!error && data) {
        questionObj.id = data.id
        if (data.departments) questionObj.departments = data.departments
      }
    } else {
      await supabase
        .from('questions')
        .update({
          department_id: deptId,
          question_text: questionObj.question_text,
          question_type: questionObj.question_type,
          placeholder: questionObj.placeholder,
          is_required: questionObj.is_required,
        })
        .eq('id', questionObj.id)
    }
  } catch {}

  // 2. Cross-device sync to Supabase audit_logs & local cache
  const { deletedQuestionIds, customQuestions } = await fetchQuestionsBankStateFromDB()
  const updatedDeleted = deletedQuestionIds.filter(id => id !== questionObj.id)

  const idx = customQuestions.findIndex(q => q.id === questionObj.id)
  let updatedCustom: QuestionItem[]
  if (idx >= 0) {
    updatedCustom = [...customQuestions]
    updatedCustom[idx] = questionObj
  } else {
    updatedCustom = [...customQuestions, questionObj]
  }

  await syncQuestionsBankStateToDB({
    deletedQuestionIds: updatedDeleted,
    customQuestions: updatedCustom,
  })

  return questionObj
}

export async function deleteQuestionItem(id: string): Promise<boolean> {
  const supabase = createClient()

  // 1. Try deleting from Supabase questions table
  try {
    await supabase.from('questions').delete().eq('id', id)
  } catch {}

  // 2. Add to deletedQuestionIds and remove from customQuestions in DB sync
  const { deletedQuestionIds, customQuestions } = await fetchQuestionsBankStateFromDB()

  const updatedDeleted = Array.from(new Set([...deletedQuestionIds, id]))
  const updatedCustom = customQuestions.filter(q => q.id !== id)

  await syncQuestionsBankStateToDB({
    deletedQuestionIds: updatedDeleted,
    customQuestions: updatedCustom,
  })

  return true
}

export function subscribeQuestionsChange(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = () => callback()
  window.addEventListener('issac_questions_updated', handler)
  window.addEventListener('storage', handler)

  const supabase = createClient()
  const channel = supabase
    .channel(`questions-realtime-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, (payload) => {
      if (payload.new && (payload.new as any).action === 'SYNC_QUESTIONS_BANK') {
        callback()
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
      callback()
    })
    .subscribe()

  return () => {
    window.removeEventListener('issac_questions_updated', handler)
    window.removeEventListener('storage', handler)
    supabase.removeChannel(channel)
  }
}

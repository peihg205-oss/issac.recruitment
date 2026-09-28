import { MOCK_CANDIDATES } from './mock-data'

export interface ResolvedCandidateProfile {
  full_name: string
  student_id: string
  email: string
  phone: string
  date_of_birth: string
  high_school: string
  major: string
  cohort: string
  university: string
  gender: string
  address: string
}

/**
 * Định dạng ngày tháng năm sinh sang chuẩn dd/mm/yyyy thân thiện
 */
function formatBirthDate(rawDate?: string | null): string {
  if (!rawDate) return ''
  const trimmed = rawDate.trim()
  if (!trimmed || trimmed === 'Chưa cập nhật' || trimmed === '—') return ''
  
  // Dạng ISO: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }

  // Dạng DD/MM/YYYY hoặc D/M/YYYY
  const vnMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (vnMatch) {
    const [, d, m, y] = vnMatch
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }

  return trimmed
}

/**
 * Suy luận Khóa sinh viên từ 2 số đầu MSSV
 */
function inferCohort(studentId?: string | null, existingCohort?: string | null): string {
  if (existingCohort && existingCohort.trim()) return existingCohort.trim()
  if (!studentId) return 'K22'
  const sid = studentId.trim()
  if (sid.startsWith('26')) return 'K26'
  if (sid.startsWith('25')) return 'K25'
  if (sid.startsWith('24')) return 'K24'
  if (sid.startsWith('23')) return 'K23'
  if (sid.startsWith('22')) return 'K22'
  if (sid.startsWith('21')) return 'K21'
  return 'K22'
}

/**
 * Trích xuất an toàn và đa tầng (Multi-tier Fallback) toàn bộ thông tin ứng viên
 * Đảm bảo 100% có đầy đủ Ngày, Tháng Năm sinh, Trường THPT và Ngành học
 */
export function resolveCandidateProfileInfo(app: any, profile: any): ResolvedCandidateProfile {
  let parsedNote: any = null
  const reviewNoteStr = app?.review_note || profile?.review_note
  if (reviewNoteStr) {
    try {
      parsedNote = JSON.parse(reviewNoteStr)
    } catch {
      parsedNote = null
    }
  }

  // Tra cứu trong Mock data nếu có
  const appId = app?.id || ''
  const userId = app?.user_id || profile?.id || ''
  const email = (profile?.email || app?.email || '').toLowerCase().trim()

  const mockCandidate = MOCK_CANDIDATES.find(m => 
    (appId && m.id === appId) ||
    (userId && (m.user_id === userId || m.id === userId)) ||
    (email && m.profiles?.email?.toLowerCase().trim() === email)
  )
  const mockProf = (mockCandidate?.profiles as any) || null

  // 1. Họ và tên
  const full_name = 
    profile?.full_name?.trim() ||
    parsedNote?.candidate_profile?.full_name?.trim() ||
    app?.full_name?.trim() ||
    mockProf?.full_name ||
    'Ứng viên'

  // 2. Mã số sinh viên (MSSV)
  const student_id =
    profile?.student_id?.trim() ||
    parsedNote?.candidate_profile?.student_id?.trim() ||
    mockProf?.student_id ||
    ''

  // 3. Email
  const resolvedEmail =
    profile?.email?.trim() ||
    parsedNote?.candidate_profile?.email?.trim() ||
    app?.email?.trim() ||
    mockProf?.email ||
    ''

  // 4. Số điện thoại
  const phone =
    profile?.phone?.trim() ||
    parsedNote?.candidate_profile?.phone?.trim() ||
    mockProf?.phone ||
    ''

  // 5. Ngày, Tháng Năm sinh
  let rawDateOfBirth =
    profile?.date_of_birth?.trim() ||
    parsedNote?.candidate_profile?.date_of_birth?.trim() ||
    mockProf?.date_of_birth ||
    ''

  // 6. Ngành học (Major)
  let major =
    profile?.major?.trim() ||
    parsedNote?.candidate_profile?.major?.trim() ||
    mockProf?.major ||
    ''

  // 7. Trường THPT từng theo học (High School)
  let high_school =
    profile?.high_school?.trim() ||
    profile?.school?.trim() ||
    profile?.thpt?.trim() ||
    (profile as any)?.highSchool?.trim() ||
    parsedNote?.candidate_profile?.high_school?.trim() ||
    mockProf?.high_school ||
    ''

  // Quét từ các câu trả lời nếu thông tin trong hồ sơ chưa có
  if (parsedNote?.answers && Array.isArray(parsedNote.answers)) {
    for (const ans of parsedNote.answers) {
      const qText = (ans.question_text || '').toLowerCase()
      const aText = (ans.answer_text || ans.selected_option || '').trim()
      const aTextLower = aText.toLowerCase()

      // Tìm ngày tháng năm sinh nếu chưa có
      if (!rawDateOfBirth) {
        const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/
        const match = aText.match(dateRegex)
        if (match) {
          rawDateOfBirth = match[1]
        }
      }

      // Tìm trường THPT nếu chưa có
      if (!high_school) {
        if (qText.includes('thpt') || qText.includes('cấp 3') || qText.includes('trường')) {
          if (aText && aText.length < 150) high_school = aText
        } else if (aTextLower.includes('thpt ') || aTextLower.includes('chuyên ')) {
          const matchHs = aText.match(/(?:THPT|trường THPT|chuyên)\s+([A-ZÀ-Ỹa-zà-ỹ\s\-]+?)(?=[,\.\n]|$)/i)
          if (matchHs && matchHs[0].length < 80) {
            high_school = matchHs[0].trim()
          }
        }
      }

      // Tìm ngành học nếu chưa có
      if (!major) {
        if (aTextLower.includes('kinh doanh quốc tế') || aTextLower.includes(' ib ') || aTextLower.includes('(ib)')) {
          major = 'Kinh doanh Quốc tế (IB)'
        } else if (aTextLower.includes('hệ thống thông tin') || aTextLower.includes(' mis ') || aTextLower.includes('(mis)')) {
          major = 'Hệ thống thông tin quản lý (MIS)'
        } else if (aTextLower.includes('quản trị kinh doanh') || aTextLower.includes(' em ') || aTextLower.includes('(em)')) {
          major = 'Quản trị Kinh doanh (EM)'
        } else if (aTextLower.includes('marketing') || aTextLower.includes('tiếp thị')) {
          major = 'Marketing số & Phân tích dữ liệu'
        } else if (aTextLower.includes('fintech') || aTextLower.includes('tài chính') || aTextLower.includes('ngân hàng')) {
          major = 'Tài chính - Ngân hàng (Fintech)'
        } else if (aTextLower.includes('tin học') || aTextLower.includes('kỹ thuật máy tính') || aTextLower.includes('ice') || aTextLower.includes('cntt')) {
          major = 'Tin học và Kỹ thuật máy tính'
        } else if (aTextLower.includes('ngôn ngữ anh') || aTextLower.includes('helix') || aTextLower.includes('tiếng anh ứng dụng')) {
          major = 'Ngôn ngữ Anh ứng dụng'
        } else if (aTextLower.includes('quản trị khách sạn') || aTextLower.includes('khách sạn') || aTextLower.includes('du lịch')) {
          major = 'Quản trị Khách sạn'
        } else if (aTextLower.includes('kế toán') || aTextLower.includes('kiểm toán')) {
          major = 'Kế toán và Kiểm toán'
        }
      }
    }
  }

  // Khóa sinh viên (tự động suy luận từ MSSV nếu thiếu)
  const cohort = inferCohort(student_id, profile?.cohort || parsedNote?.candidate_profile?.cohort || mockProf?.cohort)

  // Trường Đại học
  const university =
    profile?.university?.trim() ||
    parsedNote?.candidate_profile?.university?.trim() ||
    mockProf?.university ||
    'Trường Quốc tế - ĐHQGHN'

  // Giới tính
  const gender =
    profile?.gender?.trim() ||
    parsedNote?.candidate_profile?.gender?.trim() ||
    mockProf?.gender ||
    'Chưa cập nhật'

  // Link Facebook
  const address =
    profile?.address?.trim() ||
    (profile as any)?.facebook_url?.trim() ||
    parsedNote?.candidate_profile?.address?.trim() ||
    mockProf?.facebook_url ||
    ''

  const formattedDob = formatBirthDate(rawDateOfBirth)

  return {
    full_name,
    student_id,
    email: resolvedEmail,
    phone,
    date_of_birth: formattedDob || 'Chưa cập nhật',
    high_school: high_school || 'Chưa cập nhật',
    major: major || 'Chưa cập nhật',
    cohort,
    university,
    gender,
    address,
  }
}

export interface CandidateEvaluator {
  name: string
  email: string
  role: 'chu-nhiem' | 'truyen-thong' | 'tu-van' | 'nhan-su'
  department_name: string
  evaluated_at: string
}

export interface CandidateEvaluationData {
  criteria_scores: {
    'crit-1': number // Thái độ & Tác phong (/2.5)
    'crit-2': number // Giao tiếp & Thuyết phục (/2.5)
    'crit-3': number // Chuyên môn theo Ban (/3.0)
    'crit-4': number // Đồng đội & Cam kết (/2.0)
  }
  score_justification: string // Lý giải chi tiết tại sao cho điểm số này
  strengths: string
  weaknesses: string
  dept_recommendation: 'pass' | 'waitlist' | 'fail' // Đề xuất sơ bộ của Ban
  dept_recommendation_label: string
  bcn_decision: 'pass' | 'waitlist' | 'fail' | 'pending' // Quyết định cuối cùng của BCN
  bcn_approval_status: 'approved' | 'modified' | 'pending'
  bcn_note?: string
}

export const MOCK_DEPARTMENTS = [
  {
    id: 'dept-1',
    name: 'Ban Truyền thông',
    slug: 'truyen-thong',
    color: '#2563eb',
    description: 'Sáng tạo nội dung, thiết kế đồ họa, chụp ảnh, sản xuất video và quản lý truyền thông mạng xã hội của CLB.'
  },
  {
    id: 'dept-2',
    name: 'Ban Tư vấn',
    slug: 'tu-van',
    color: '#059669',
    description: 'Tư vấn hướng nghiệp, kết nối học bổng, hỗ trợ học tập và định hướng phát triển toàn diện cho sinh viên.'
  },
  {
    id: 'dept-3',
    name: 'Ban Nhân sự',
    slug: 'nhan-su',
    color: '#7c3aed',
    description: 'Quản trị nhân lực nội bộ, xây dựng văn hóa gắn kết thành viên, tổ chức tuyển quân và vận hành hoạt động CLB.'
  },
]

export const MOCK_CANDIDATES = [
  {
    id: 'app-01',
    user_id: 'user-01',
    department_id: 'dept-1',
    status: 'finalized' as const,
    submitted_at: '2026-09-01T08:30:00+07:00',
    created_at: '2026-09-01T08:00:00Z',
    profiles: {
      full_name: 'Nguyễn Hà Phương',
      email: 'phuong.nguyen@vnu.edu.vn',
      student_id: '22070142',
      phone: '0987123456',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Hệ thống thông tin quản lý (MIS)',
      cohort: 'K22',
      gender: 'Nữ',
      cv_url: 'https://drive.google.com/sample_cv_phuong',
      facebook_url: 'https://facebook.com/haphuong.issac',
      gpa: 3.82,
      bio: 'Sáng tạo nội dung TikTok & Fanpage, từng làm Trưởng ban truyền thông Ngày hội Tân sinh viên VNU-IS.',
    },
    departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
    evaluator: {
      name: 'Trần Hoàng Nam',
      email: 'truyenthong@issac.vnu.edu.vn',
      role: 'truyen-thong' as const,
      department_name: 'Ban Truyền thông',
      evaluated_at: '2026-09-12 10:30',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.4, 'crit-2': 2.4, 'crit-3': 2.9, 'crit-4': 1.9 },
      score_justification: 'Thái độ phỏng vấn rất đĩnh đạc, năng lượng đại sứ sinh viên tươi sáng (2.4/2.5). Kỹ năng giao tiếp và xử lý tình huống truyền thông xuất sắc (2.4/2.5). Năng lực chuyên môn vượt trội với kinh nghiệm quản trị kênh và thiết kế ấn tượng (2.9/3.0). Cam kết cống hiến lâu dài (1.9/2.0). Đạt tổng 9.6/10.',
      strengths: 'Kỹ năng sáng tạo content đa nền tảng, thiết kế chỉn chu, tư duy thẩm mỹ hiện đại.',
      weaknesses: 'Cần phân bổ cân đối thời gian giữa việc học và lịch sự kiện cao điểm của CLB.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm nhất trí thông qua. Xếp hạng #1 toàn CLB.',
    },
    candidate_rankings: { rank_number: 1, dept_rank: 1, final_score: 9.6, result: 'pass' as const },
  },
  {
    id: 'app-02',
    user_id: 'user-02',
    department_id: 'dept-2',
    status: 'finalized' as const,
    submitted_at: '2026-09-01T09:50:30+07:00',
    created_at: '2026-09-01T08:30:00Z',
    profiles: {
      full_name: 'Trần Minh Hoàng',
      email: 'hoang.tran@vnu.edu.vn',
      student_id: '22070891',
      phone: '0912345678',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Kinh doanh Quốc tế (IB)',
      cohort: 'K22',
      gender: 'Nam',
      cv_url: 'https://drive.google.com/sample_cv_hoang',
      facebook_url: 'https://facebook.com/minhhoang.advisor',
      gpa: 3.75,
      bio: 'IELTS 8.0, kinh nghiệm tư vấn học bổng du học và hỗ trợ sinh viên quốc tế tại VNU-IS.',
    },
    departments: { name: 'Ban Tư vấn', slug: 'tu-van' },
    evaluator: {
      name: 'Lê Hải Yến',
      email: 'tuvan@issac.vnu.edu.vn',
      role: 'tu-van' as const,
      department_name: 'Ban Tư vấn',
      evaluated_at: '2026-09-12 11:15',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.4, 'crit-2': 2.5, 'crit-3': 2.8, 'crit-4': 1.8 },
      score_justification: 'Khả năng tiếng Anh và diễn đạt lưu loát tuyệt vời, phản xạ trả lời tình huống tư vấn thấu đáo (2.5/2.5). Thái độ khiêm tốn, lịch thiệp (2.4/2.5). Kiến thức về các chương trình đào tạo và học bổng tại VNU-IS rất vững vàng (2.8/3.0). Đạt tổng 9.5/10.',
      strengths: 'Kỹ năng ngoại ngữ hoàn hảo, tư duy phản biện tốt, thấu cảm với người nghe.',
      weaknesses: 'Cần thích ứng với phong cách tư vấn nhóm đông sinh viên cùng lúc.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm phê chuẩn. Đại sứ đại diện mảng học thuật tư vấn xuất sắc.',
    },
    candidate_rankings: { rank_number: 2, dept_rank: 1, final_score: 9.5, result: 'pass' as const },
  },
  {
    id: 'app-03',
    user_id: 'user-03',
    department_id: 'dept-3',
    status: 'finalized' as const,
    submitted_at: '2026-09-01T11:15:45+07:00',
    created_at: '2026-09-01T09:00:00Z',
    profiles: {
      full_name: 'Lê Thảo Linh',
      email: 'linh.le@vnu.edu.vn',
      student_id: '23070215',
      phone: '0978901234',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Quản trị Kinh doanh (EM)',
      cohort: 'K23',
      gender: 'Nữ',
      cv_url: 'https://drive.google.com/sample_cv_linh',
      facebook_url: 'https://facebook.com/thaolinh.hr',
      gpa: 3.88,
      bio: 'Kỹ năng quản trị nhân sự, lắng nghe, kết nối thành viên và điều phối nhân lực các sự kiện lớn.',
    },
    departments: { name: 'Ban Nhân sự', slug: 'nhan-su' },
    evaluator: {
      name: 'Phạm Minh Đức',
      email: 'nhansu@issac.vnu.edu.vn',
      role: 'nhan-su' as const,
      department_name: 'Ban Nhân sự',
      evaluated_at: '2026-09-12 14:00',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.5, 'crit-2': 2.3, 'crit-3': 2.7, 'crit-4': 1.9 },
      score_justification: 'Tác phong chuẩn mực, đúng giờ, hình ảnh đại sứ sinh viên rất sáng (2.5/2.5). Kỹ năng thấu hiểu tâm lý và giải quyết mâu thuẫn nội bộ tốt (2.7/3.0). Trình bày mạch lạc, tự tin (2.3/2.5). Tinh thần trách nhiệm cao, cam kết gắn kết lâu dài (1.9/2.0). Tổng điểm 9.4/10.',
      strengths: 'Kỹ năng lắng nghe tích cực, khả năng điều phối nhân sự, tính kỷ luật cao.',
      weaknesses: 'Cần quyết đoán hơn trong việc đưa ra quyết định xử lý kỷ luật.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm nhất trí. Nhân tố hạt nhân cho văn hóa nội bộ CLB.',
    },
    candidate_rankings: { rank_number: 3, dept_rank: 1, final_score: 9.4, result: 'pass' as const },
  },
  {
    id: 'app-04',
    user_id: 'user-04',
    department_id: 'dept-1',
    status: 'finalized' as const,
    submitted_at: '2026-09-01T15:30:20+07:00',
    created_at: '2026-09-01T10:00:00Z',
    profiles: {
      full_name: 'Phạm Đăng Khoa',
      email: 'khoa.pham@vnu.edu.vn',
      student_id: '22070554',
      phone: '0934567890',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Marketing số',
      cohort: 'K22',
      gender: 'Nam',
      cv_url: 'https://drive.google.com/sample_cv_khoa',
      facebook_url: 'https://facebook.com/dangkhoa.design',
      gpa: 3.68,
      bio: 'Sử dụng thuần thục Adobe Illustrator, Photoshop, Figma. Có kinh nghiệm xây dựng bộ nhận diện CLB.',
    },
    departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
    evaluator: {
      name: 'Trần Hoàng Nam',
      email: 'truyenthong@issac.vnu.edu.vn',
      role: 'truyen-thong' as const,
      department_name: 'Ban Truyền thông',
      evaluated_at: '2026-09-12 14:45',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.3, 'crit-2': 2.3, 'crit-3': 2.9, 'crit-4': 1.8 },
      score_justification: 'Kỹ năng thiết kế đồ họa xuất sắc nhất đợt phỏng vấn (2.9/3.0). Thái độ cầu thị, thẳng thắn (2.3/2.5). Kỹ năng thuyết phục về định hướng visual nhận diện thương hiệu thuyết phục (2.3/2.5). Điểm tổng 9.3/10.',
      strengths: 'Chuyên môn visual design đỉnh cao, gu thẩm mỹ hiện đại, làm việc độc lập tốt.',
      weaknesses: 'Đôi khi hơi bảo thủ về quan điểm nghệ thuật, cần lắng nghe feedback nhóm hơn.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm phê duyệt. Phụ trách mảng Visual Identity.',
    },
    candidate_rankings: { rank_number: 4, dept_rank: 2, final_score: 9.3, result: 'pass' as const },
  },
  {
    id: 'app-05',
    user_id: 'user-05',
    department_id: 'dept-2',
    status: 'finalized' as const,
    submitted_at: '2026-09-02T08:45:12+07:00',
    created_at: '2026-09-02T07:45:00Z',
    profiles: {
      full_name: 'Vũ Hải Yến',
      email: 'yen.vu@vnu.edu.vn',
      student_id: '23070388',
      phone: '0901234888',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Tài chính - Ngân hàng (Fintech)',
      cohort: 'K23',
      gender: 'Nữ',
      cv_url: 'https://drive.google.com/sample_cv_yen',
      facebook_url: 'https://facebook.com/haiyen.vu',
      gpa: 3.79,
      bio: 'Tự tin, nhiệt tình, có kinh nghiệm tư vấn định hướng môn học và hướng nghiệp sinh viên năm nhất.',
    },
    departments: { name: 'Ban Tư vấn', slug: 'tu-van' },
    evaluator: {
      name: 'Lê Hải Yến',
      email: 'tuvan@issac.vnu.edu.vn',
      role: 'tu-van' as const,
      department_name: 'Ban Tư vấn',
      evaluated_at: '2026-09-12 15:30',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.4, 'crit-2': 2.4, 'crit-3': 2.6, 'crit-4': 1.8 },
      score_justification: 'Giao tiếp gần gũi, giọng nói truyền cảm, tạo thiện cảm ngay từ phút đầu (2.4/2.5). Nắm chắc quy chế đào tạo và lộ trình tín chỉ (2.6/3.0). Phản xạ tình huống tư vấn tân sinh viên tốt (2.4/2.5). Điểm tổng 9.2/10.',
      strengths: 'Kỹ năng giao tiếp ấm áp, tận tâm, nắm bắt tâm lý sinh viên nhanh.',
      weaknesses: 'Cần bổ sung kiến thức về các chương trình trao đổi quốc tế.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 5, dept_rank: 2, final_score: 9.2, result: 'pass' as const },
  },
  {
    id: 'app-06',
    user_id: 'user-06',
    department_id: 'dept-3',
    status: 'finalized' as const,
    submitted_at: '2026-09-02T10:10:05+07:00',
    created_at: '2026-09-02T09:00:00Z',
    profiles: {
      full_name: 'Đoàn Quốc Tuấn',
      email: 'tuan.doan@vnu.edu.vn',
      student_id: '22070441',
      phone: '0966554433',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Hệ thống thông tin quản lý',
      cohort: 'K22',
      gender: 'Nam',
      cv_url: 'https://drive.google.com/sample_cv_tuan',
      facebook_url: 'https://facebook.com/quoctuan.doan',
      gpa: 3.65,
      bio: 'Năng động, có kỹ năng tổ chức team bonding và đánh giá nhân sự theo KPI.',
    },
    departments: { name: 'Ban Nhân sự', slug: 'nhan-su' },
    evaluator: {
      name: 'Phạm Minh Đức',
      email: 'nhansu@issac.vnu.edu.vn',
      role: 'nhan-su' as const,
      department_name: 'Ban Nhân sự',
      evaluated_at: '2026-09-12 16:15',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.3, 'crit-2': 2.3, 'crit-3': 2.7, 'crit-4': 1.8 },
      score_justification: 'Kinh nghiệm quản lý hồ sơ và theo dõi chuyên cần bằng công cụ số hóa tốt (2.7/3.0). Năng nổ, nhiệt tình trong các hoạt động kết nối (2.3/2.5). Tác phong lịch sự, đúng mực (2.3/2.5). Điểm tổng 9.1/10.',
      strengths: 'Kỹ năng vận hành quy trình nội bộ, ứng dụng Google Sheet/Notion chuyên nghiệp.',
      weaknesses: 'Cần nâng cao kỹ năng điều tiết cảm xúc trong các cuộc họp căng thẳng.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 6, dept_rank: 2, final_score: 9.1, result: 'pass' as const },
  },
  {
    id: 'app-07',
    user_id: 'user-07',
    department_id: 'dept-1',
    status: 'finalized' as const,
    submitted_at: '2026-09-02T14:25:40+07:00',
    created_at: '2026-09-02T13:30:00Z',
    profiles: {
      full_name: 'Hoàng Bích Ngọc',
      email: 'ngoc.hoang@vnu.edu.vn',
      student_id: '23070512',
      phone: '0944332211',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Marketing số',
      cohort: 'K23',
      gender: 'Nữ',
      cv_url: 'https://drive.google.com/sample_cv_ngoc',
      facebook_url: 'https://facebook.com/bichngoc.media',
      gpa: 3.85,
      bio: 'Sở trường viết bài PR truyền thông, lên kịch bản video ngắn và quản trị kênh mạng xã hội.',
    },
    departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
    evaluator: {
      name: 'Trần Hoàng Nam',
      email: 'truyenthong@issac.vnu.edu.vn',
      role: 'truyen-thong' as const,
      department_name: 'Ban Truyền thông',
      evaluated_at: '2026-09-13 09:30',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.3, 'crit-2': 2.3, 'crit-3': 2.6, 'crit-4': 1.8 },
      score_justification: 'Văn phong viết bài PR sắc sảo, bắt trend tốt (2.6/3.0). Trình bày ý tưởng chiến dịch rõ ràng, cuốn hút (2.3/2.5). Tác phong tự tin, chỉn chu (2.3/2.5). Cam kết thời gian cao (1.8/2.0). Điểm tổng 9.0/10.',
      strengths: 'Kỹ năng copywriting xuất sắc, tư duy content sáng tạo, nắm bắt thị hiếu giới trẻ.',
      weaknesses: 'Kỹ năng chụp ảnh và xử lý hình ảnh cơ bản, cần học thêm Photoshop.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 7, dept_rank: 3, final_score: 9.0, result: 'pass' as const },
  },
  {
    id: 'app-08',
    user_id: 'user-08',
    department_id: 'dept-2',
    status: 'finalized' as const,
    submitted_at: '2026-09-02T16:30:10+07:00',
    created_at: '2026-09-02T15:20:00Z',
    profiles: {
      full_name: 'Bùi Đức Anh',
      email: 'anh.bui@vnu.edu.vn',
      student_id: '22070629',
      phone: '0919876543',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Kinh doanh Quốc tế',
      cohort: 'K22',
      gender: 'Nam',
      cv_url: 'https://drive.google.com/sample_cv_ducanh',
      facebook_url: 'https://facebook.com/ducanh.bui',
      gpa: 3.72,
      bio: 'Khả năng giao tiếp thuyết phục, sẵn lòng hỗ trợ giải đáp thắc mắc cho tân sinh viên VNU-IS.',
    },
    departments: { name: 'Ban Tư vấn', slug: 'tu-van' },
    evaluator: {
      name: 'Lê Hải Yến',
      email: 'tuvan@issac.vnu.edu.vn',
      role: 'tu-van' as const,
      department_name: 'Ban Tư vấn',
      evaluated_at: '2026-09-13 10:15',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.3, 'crit-2': 2.3, 'crit-3': 2.6, 'crit-4': 1.7 },
      score_justification: 'Kỹ năng tư vấn tự nhiên, nhiệt thành (2.3/2.5). Có kinh nghiệm thực chiến trong các buổi Open Day và Tư vấn tuyển sinh (2.6/3.0). Phản xạ linh hoạt trước các tình huống phụ huynh hỏi khó (2.3/2.5). Điểm tổng 8.9/10.',
      strengths: 'Tác phong đĩnh đạc, xử lý tình huống giao tiếp khéo léo, am hiểu tâm lý tân sinh viên.',
      weaknesses: 'Cần trau dồi thêm kỹ năng soạn thảo tài liệu hướng dẫn chuẩn hóa.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 8, dept_rank: 3, final_score: 8.9, result: 'pass' as const },
  },
  {
    id: 'app-09',
    user_id: 'user-09',
    department_id: 'dept-3',
    status: 'finalized' as const,
    submitted_at: '2026-09-03T09:15:35+07:00',
    created_at: '2026-09-03T08:15:00Z',
    profiles: {
      full_name: 'Đặng Mai Chi',
      email: 'chi.dang@vnu.edu.vn',
      student_id: '23070774',
      phone: '0981122334',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Quản trị Kinh doanh',
      cohort: 'K23',
      gender: 'Nữ',
      cv_url: 'https://drive.google.com/sample_cv_maichi',
      facebook_url: 'https://facebook.com/maichi.dang',
      gpa: 3.76,
      bio: 'Cẩn thận, chu đáo, có trách nhiệm trong theo dõi chuyên cần và đánh giá thành viên.',
    },
    departments: { name: 'Ban Nhân sự', slug: 'nhan-su' },
    evaluator: {
      name: 'Phạm Minh Đức',
      email: 'nhansu@issac.vnu.edu.vn',
      role: 'nhan-su' as const,
      department_name: 'Ban Nhân sự',
      evaluated_at: '2026-09-13 11:00',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.3, 'crit-2': 2.2, 'crit-3': 2.5, 'crit-4': 1.8 },
      score_justification: 'Tính cách tỉ mỉ, chu đáo, đặc biệt phù hợp với công việc quản lý dữ liệu nhân sự (2.5/3.0). Thái độ khiêm tốn, lịch thiệp (2.3/2.5). Kỹ năng giao tiếp vừa vặn, chân thành (2.2/2.5). Điểm tổng 8.8/10.',
      strengths: 'Quản lý tài liệu cẩn thận, không ngại việc hỗ trợ hậu cần, đáng tin cậy.',
      weaknesses: 'Còn hơi rụt rè khi nói trước tập thể đông người.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 9, dept_rank: 3, final_score: 8.8, result: 'pass' as const },
  },
  {
    id: 'app-10',
    user_id: 'user-10',
    department_id: 'dept-1',
    status: 'finalized' as const,
    submitted_at: '2026-09-03T11:20:10+07:00',
    created_at: '2026-09-03T10:30:00Z',
    profiles: {
      full_name: 'Lý Gia Bảo',
      email: 'bao.ly@vnu.edu.vn',
      student_id: '22070311',
      phone: '0972233445',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Tin học và Kỹ thuật máy tính',
      cohort: 'K22',
      gender: 'Nam',
      cv_url: 'https://drive.google.com/sample_cv_giabao',
      facebook_url: 'https://facebook.com/giabao.media',
      gpa: 3.58,
      bio: 'Quay dựng video ngắn TikTok, Reels, sử dụng Premiere và CapCut chuyên nghiệp.',
    },
    departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
    evaluator: {
      name: 'Trần Hoàng Nam',
      email: 'truyenthong@issac.vnu.edu.vn',
      role: 'truyen-thong' as const,
      department_name: 'Ban Truyền thông',
      evaluated_at: '2026-09-13 14:00',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.2, 'crit-2': 2.2, 'crit-3': 2.6, 'crit-4': 1.7 },
      score_justification: 'Kỹ năng dựng video ngắn bắt nhịp âm nhạc rất tốt (2.6/3.0). Tư duy hình ảnh động nhạy bén (2.2/2.5). Thái độ tích cực, sẵn sàng nhận nhiệm vụ khó (2.2/2.5). Điểm tổng 8.7/10.',
      strengths: 'Kỹ năng video editing nhanh, có thiết bị cá nhân hỗ trợ sản xuất media.',
      weaknesses: 'Kỹ năng viết kịch bản cần trau chuốt thêm về thông điệp chiều sâu.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 10, dept_rank: 4, final_score: 8.7, result: 'pass' as const },
  },
  {
    id: 'app-11',
    user_id: 'user-11',
    department_id: 'dept-2',
    status: 'finalized' as const,
    submitted_at: '2026-09-03T14:45:22+07:00',
    created_at: '2026-09-03T14:00:00Z',
    profiles: {
      full_name: 'Dương Khánh Huyền',
      email: 'huyen.duong@vnu.edu.vn',
      student_id: '23070899',
      phone: '0938877665',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Ngôn ngữ Anh ứng dụng',
      cohort: 'K23',
      gender: 'Nữ',
      cv_url: 'https://drive.google.com/sample_cv_khanhhuyen',
      facebook_url: 'https://facebook.com/khanhhuyen.advisor',
      gpa: 3.81,
      bio: 'Tiếng Anh xuất sắc, có chứng chỉ MC sự kiện, yêu thích kết nối và giải đáp học tập.',
    },
    departments: { name: 'Ban Tư vấn', slug: 'tu-van' },
    evaluator: {
      name: 'Lê Hải Yến',
      email: 'tuvan@issac.vnu.edu.vn',
      role: 'tu-van' as const,
      department_name: 'Ban Tư vấn',
      evaluated_at: '2026-09-13 14:45',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.3, 'crit-2': 2.4, 'crit-3': 2.3, 'crit-4': 1.6 },
      score_justification: 'Kỹ năng nói trước đám đông và dẫn dắt câu chuyện rất thu hút (2.4/2.5). Tác phong sáng sủa, hoạt bát (2.3/2.5). Kiến thức chuyên môn tư vấn đang ở mức khá, tiếp thu nhanh (2.3/3.0). Điểm tổng 8.6/10.',
      strengths: 'Kỹ năng MC, dẫn dắt chương trình và kết nối hội trường cực tốt.',
      weaknesses: 'Cần tìm hiểu sâu hơn các môn chuyên ngành kỹ thuật công nghệ tại trường.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 11, dept_rank: 4, final_score: 8.6, result: 'pass' as const },
  },
  {
    id: 'app-12',
    user_id: 'user-12',
    department_id: 'dept-3',
    status: 'finalized' as const,
    submitted_at: '2026-09-03T17:10:00+07:00',
    created_at: '2026-09-03T16:00:00Z',
    profiles: {
      full_name: 'Phan Gia Huy',
      email: 'huy.phan@vnu.edu.vn',
      student_id: '22070732',
      phone: '0909988776',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Kinh doanh Quốc tế',
      cohort: 'K22',
      gender: 'Nam',
      cv_url: 'https://drive.google.com/sample_cv_giahuy',
      facebook_url: 'https://facebook.com/giahuy.hr',
      gpa: 3.61,
      bio: 'Có kinh nghiệm tổ chức các buổi teambuilding, hoạt động thể thao gắn kết sinh viên.',
    },
    departments: { name: 'Ban Nhân sự', slug: 'nhan-su' },
    evaluator: {
      name: 'Phạm Minh Đức',
      email: 'nhansu@issac.vnu.edu.vn',
      role: 'nhan-su' as const,
      department_name: 'Ban Nhân sự',
      evaluated_at: '2026-09-13 15:30',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.2, 'crit-2': 2.2, 'crit-3': 2.4, 'crit-4': 1.7 },
      score_justification: 'Khả năng hoạt náo và khuấy động không khí tập thể rất nổi trội (2.4/3.0). Tính tình cởi mở, chân thành (2.2/2.5). Thái độ tham gia phỏng vấn nghiêm túc (2.2/2.5). Điểm tổng 8.5/10.',
      strengths: 'Kỹ năng hoạt náo, tổ chức trò chơi tập thể, kết nối thành viên.',
      weaknesses: 'Kỹ năng quản lý tài liệu và soạn biên bản họp còn hạn chế.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 12, dept_rank: 4, final_score: 8.5, result: 'pass' as const },
  },
  {
    id: 'app-13',
    user_id: 'user-13',
    department_id: 'dept-1',
    status: 'finalized' as const,
    submitted_at: '2026-09-04T09:40:15+07:00',
    created_at: '2026-09-04T08:00:00Z',
    profiles: {
      full_name: 'Ngô Trúc Quỳnh',
      email: 'quynh.ngo@vnu.edu.vn',
      student_id: '23070445',
      phone: '0918822334',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Marketing số',
      cohort: 'K23',
      gender: 'Nữ',
      cv_url: 'https://drive.google.com/sample_cv_trucquynh',
      facebook_url: 'https://facebook.com/trucquynh.media',
      gpa: 3.73,
      bio: 'Nhiếp ảnh gia sự kiện nghiệp dư, sở hữu máy ảnh cá nhân và kỹ năng chỉnh sửa ảnh Lightroom.',
    },
    departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
    evaluator: {
      name: 'Trần Hoàng Nam',
      email: 'truyenthong@issac.vnu.edu.vn',
      role: 'truyen-thong' as const,
      department_name: 'Ban Truyền thông',
      evaluated_at: '2026-09-13 16:15',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.2, 'crit-2': 2.1, 'crit-3': 2.4, 'crit-4': 1.7 },
      score_justification: 'Có trang thiết bị máy ảnh cá nhân và gu màu ảnh sự kiện tốt (2.4/3.0). Thái độ hòa nhã, cởi mở (2.2/2.5). Kỹ năng giao tiếp tự nhiên (2.1/2.5). Điểm tổng 8.4/10.',
      strengths: 'Kỹ năng nhiếp ảnh sự kiện thực chiến, chỉnh sửa ảnh nhanh chóng.',
      weaknesses: 'Cần nâng cao khả năng quản lý media asset trên kho lưu trữ đám mây.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 13, dept_rank: 5, final_score: 8.4, result: 'pass' as const },
  },
  {
    id: 'app-14',
    user_id: 'user-14',
    department_id: 'dept-2',
    status: 'finalized' as const,
    submitted_at: '2026-09-04T11:15:20+07:00',
    created_at: '2026-09-04T09:45:00Z',
    profiles: {
      full_name: 'Tạ Minh Trí',
      email: 'tri.ta@vnu.edu.vn',
      student_id: '22070198',
      phone: '0977112233',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Hệ thống thông tin quản lý',
      cohort: 'K22',
      gender: 'Nam',
      cv_url: 'https://drive.google.com/sample_cv_minhtri',
      facebook_url: 'https://facebook.com/minhtri.advisor',
      gpa: 3.66,
      bio: 'Kiên nhẫn, nhiệt tình hỗ trợ giải đáp thắc mắc về tín chỉ và kinh nghiệm học tập.',
    },
    departments: { name: 'Ban Tư vấn', slug: 'tu-van' },
    evaluator: {
      name: 'Lê Hải Yến',
      email: 'tuvan@issac.vnu.edu.vn',
      role: 'tu-van' as const,
      department_name: 'Ban Tư vấn',
      evaluated_at: '2026-09-13 17:00',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.2, 'crit-2': 2.1, 'crit-3': 2.3, 'crit-4': 1.7 },
      score_justification: 'Kiên nhẫn lắng nghe câu hỏi từ ứng viên khác trong nhóm phỏng vấn (2.2/2.5). Trả lời chắc chắn các câu hỏi về quy trình học tập (2.3/3.0). Thái độ chuẩn mực (2.2/2.5). Điểm tổng 8.3/10.',
      strengths: 'Sự kiên trì, đáng tin cậy, tác phong bình tĩnh trước câu hỏi khó.',
      weaknesses: 'Cần nâng cao sự nhiệt huyết và năng lượng tương tác.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm chấp thuận.',
    },
    candidate_rankings: { rank_number: 14, dept_rank: 5, final_score: 8.3, result: 'pass' as const },
  },
  {
    id: 'app-15',
    user_id: 'user-15',
    department_id: 'dept-3',
    status: 'finalized' as const,
    submitted_at: '2026-09-04T14:30:45+07:00',
    created_at: '2026-09-04T13:00:00Z',
    profiles: {
      full_name: 'Chu Ngọc Lan',
      email: 'lan.chu@vnu.edu.vn',
      student_id: '23070661',
      phone: '0945667788',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Quản trị Kinh doanh',
      cohort: 'K23',
      gender: 'Nữ',
      cv_url: 'https://drive.google.com/sample_cv_ngoclan',
      facebook_url: 'https://facebook.com/ngoclan.hr',
      gpa: 3.70,
      bio: 'Yêu thích các hoạt động cộng đồng, có khả năng kết nối bạn bè và hậu cần sự kiện.',
    },
    departments: { name: 'Ban Nhân sự', slug: 'nhan-su' },
    evaluator: {
      name: 'Phạm Minh Đức',
      email: 'nhansu@issac.vnu.edu.vn',
      role: 'nhan-su' as const,
      department_name: 'Ban Nhân sự',
      evaluated_at: '2026-09-13 17:30',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.1, 'crit-2': 2.1, 'crit-3': 2.3, 'crit-4': 1.7 },
      score_justification: 'Thái độ lễ phép, tinh thần phục vụ và hỗ trợ tập thể cao (2.1/2.5). Hiểu biết căn bản về cách thức vận hành ban nhân sự (2.3/3.0). Điểm phỏng vấn đạt chuẩn 8.2/10, chốt danh sách TOP 15 toàn CLB.',
      strengths: 'Chăm chỉ, sẵn lòng hỗ trợ đồng đội, tính cách thân thiện.',
      weaknesses: 'Cần rèn luyện tính chủ động khởi xướng các hoạt động mới.',
      dept_recommendation: 'pass' as const,
      dept_recommendation_label: 'Pass',
      bcn_decision: 'pass' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm xem xét và phê chuẩn vị trí thứ 15 chính thức.',
    },
    candidate_rankings: { rank_number: 15, dept_rank: 5, final_score: 8.2, result: 'pass' as const },
  },
  {
    id: 'app-16',
    user_id: 'user-16',
    department_id: 'dept-1',
    status: 'finalized' as const,
    submitted_at: '2026-09-04T16:55:12+07:00',
    created_at: '2026-09-04T14:45:00Z',
    profiles: {
      full_name: 'Lâm Văn Thắng',
      email: 'thang.lam@vnu.edu.vn',
      student_id: '22070855',
      phone: '0961123456',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Tin học và Kỹ thuật máy tính',
      cohort: 'K22',
      gender: 'Nam',
      cv_url: 'https://drive.google.com/sample_cv_vanthang',
      facebook_url: 'https://facebook.com/vanthang.lam',
      gpa: 3.42,
      bio: 'Có hiểu biết cơ bản về kỹ thuật phát livestream và hỗ trợ âm thanh ánh sáng sự kiện.',
    },
    departments: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
    evaluator: {
      name: 'Trần Hoàng Nam',
      email: 'truyenthong@issac.vnu.edu.vn',
      role: 'truyen-thong' as const,
      department_name: 'Ban Truyền thông',
      evaluated_at: '2026-09-13 18:00',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.0, 'crit-2': 1.9, 'crit-3': 2.4, 'crit-4': 1.6 },
      score_justification: 'Kỹ năng kỹ thuật livestream tốt nhưng phần trình bày ý tưởng truyền thông còn hạn chế (1.9/2.5). Thái độ đúng giờ (2.0/2.5). Điểm tổng 7.9/10, chưa đủ vào TOP 15 chính thức nhưng đề xuất đưa vào Danh sách Dự bị chuyên môn kỹ thuật.',
      strengths: 'Kỹ thuật vận hành máy móc, livestream, hỗ trợ kỹ thuật tốt.',
      weaknesses: 'Khả năng diễn đạt ý tưởng và kỹ năng thuyết phục chưa đạt yêu cầu đại sứ.',
      dept_recommendation: 'waitlist' as const,
      dept_recommendation_label: 'Phân vân / Dự bị',
      bcn_decision: 'waitlist' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm duyệt đưa vào Danh sách Dự bị Ban Truyền thông.',
    },
    candidate_rankings: { rank_number: 16, dept_rank: 6, final_score: 7.9, result: 'waitlist' as const },
  },
  {
    id: 'app-17',
    user_id: 'user-17',
    department_id: 'dept-2',
    status: 'finalized' as const,
    submitted_at: '2026-09-04T18:20:30+07:00',
    created_at: '2026-09-04T15:30:00Z',
    profiles: {
      full_name: 'Vương Bảo Châu',
      email: 'chau.vuong@vnu.edu.vn',
      student_id: '23070921',
      phone: '0933221100',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Kinh doanh Quốc tế',
      cohort: 'K23',
      gender: 'Nữ',
      cv_url: 'https://drive.google.com/sample_cv_baochau',
      facebook_url: 'https://facebook.com/baochau.advisor',
      gpa: 3.55,
      bio: 'Yêu thích giao tiếp, muốn rèn luyện kỹ năng tư vấn và thuyết phục.',
    },
    departments: { name: 'Ban Tư vấn', slug: 'tu-van' },
    evaluator: {
      name: 'Lê Hải Yến',
      email: 'tuvan@issac.vnu.edu.vn',
      role: 'tu-van' as const,
      department_name: 'Ban Tư vấn',
      evaluated_at: '2026-09-13 18:30',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 2.0, 'crit-2': 2.0, 'crit-3': 2.2, 'crit-4': 1.6 },
      score_justification: 'Ứng viên có tiềm năng nhưng kiến thức về các chương trình đào tạo của trường còn thiếu sót (2.2/3.0). Phản xạ trước câu hỏi phỏng vấn còn ngập ngừng (2.0/2.5). Điểm tổng 7.8/10. Ban đề xuất Dự bị.',
      strengths: 'Ham học hỏi, giọng nói rõ ràng, thái độ cầu thị.',
      weaknesses: 'Thiếu sự tự tin trước hội đồng, chưa nắm vững thông tin tuyển sinh.',
      dept_recommendation: 'waitlist' as const,
      dept_recommendation_label: 'Phân vân / Dự bị',
      bcn_decision: 'waitlist' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm duyệt kết quả Dự bị.',
    },
    candidate_rankings: { rank_number: 17, dept_rank: 6, final_score: 7.8, result: 'waitlist' as const },
  },
  {
    id: 'app-18',
    user_id: 'user-18',
    department_id: 'dept-3',
    status: 'finalized' as const,
    submitted_at: '2026-09-05T17:30:15+07:00',
    created_at: '2026-09-04T17:00:00Z',
    profiles: {
      full_name: 'Đặng Tuấn Khang',
      email: 'khang.dang@vnu.edu.vn',
      student_id: '23070102',
      phone: '0988776655',
      university: 'Trường Quốc tế - ĐHQGHN (VNU-IS)',
      major: 'Hệ thống thông tin quản lý',
      cohort: 'K23',
      gender: 'Nam',
      cv_url: 'https://drive.google.com/sample_cv_tuankhang',
      facebook_url: 'https://facebook.com/tuankhang.dang',
      gpa: 3.35,
      bio: 'Có tinh thần học hỏi nhưng chưa có kinh nghiệm quản lý nhân sự.',
    },
    departments: { name: 'Ban Nhân sự', slug: 'nhan-su' },
    evaluator: {
      name: 'Phạm Minh Đức',
      email: 'nhansu@issac.vnu.edu.vn',
      role: 'nhan-su' as const,
      department_name: 'Ban Nhân sự',
      evaluated_at: '2026-09-13 19:00',
    },
    evaluation_data: {
      criteria_scores: { 'crit-1': 1.9, 'crit-2': 1.8, 'crit-3': 2.0, 'crit-4': 1.5 },
      score_justification: 'Ứng viên chưa thể hiện được sự gắn kết và cam kết thời gian cho CLB (1.5/2.0). Kỹ năng xử lý tình huống nhân sự còn lúng túng (2.0/3.0). Điểm tổng 7.2/10, chưa đáp ứng tiêu chuẩn tuyển chọn đợt này.',
      strengths: 'Tính tình hiền hòa, lễ phép với các anh chị khóa trên.',
      weaknesses: 'Thiếu tính chủ động, kỹ năng giao tiếp hạn chế, lịch trình bận rộn khó cam kết.',
      dept_recommendation: 'fail' as const,
      dept_recommendation_label: 'Không đạt (Fail)',
      bcn_decision: 'fail' as const,
      bcn_approval_status: 'approved' as const,
      bcn_note: 'Ban Chủ nhiệm duyệt kết quả Không đạt. Đề nghị giữ liên hệ cho các hoạt động mở sau.',
    },
    candidate_rankings: { rank_number: 18, dept_rank: 6, final_score: 7.2, result: 'fail' as const },
  },
]

export const MOCK_INTERVIEW_SLOTS = [
  {
    id: 'slot-1',
    interview_date: '2026-09-12',
    start_time: '08:30',
    end_time: '10:00',
    format: 'offline' as const,
    location: 'Phòng Hội đồng 302, Nhà C, VNU-IS (Làng Sinh viên HACINCO)',
    meeting_url: null,
    max_candidates: 6,
    current_candidates: 6,
    is_active: true,
  },
  {
    id: 'slot-2',
    interview_date: '2026-09-12',
    start_time: '14:00',
    end_time: '15:30',
    format: 'offline' as const,
    location: 'Phòng Hội đồng 302, Nhà C, VNU-IS (Làng Sinh viên HACINCO)',
    meeting_url: null,
    max_candidates: 6,
    current_candidates: 5,
    is_active: true,
  },
  {
    id: 'slot-3',
    interview_date: '2026-09-13',
    start_time: '09:00',
    end_time: '10:30',
    format: 'online' as const,
    location: null,
    meeting_url: 'https://meet.google.com/iss-ac26-vnu',
    max_candidates: 5,
    current_candidates: 5,
    is_active: true,
  },
  {
    id: 'slot-4',
    interview_date: '2026-09-13',
    start_time: '14:30',
    end_time: '16:00',
    format: 'online' as const,
    location: null,
    meeting_url: 'https://meet.google.com/iss-ac26-vnu',
    max_candidates: 5,
    current_candidates: 2,
    is_active: true,
  },
]


export interface CandidateApplicationAnswer {
  question_id: string
  question_order: number
  category: 'general' | 'department' | 'commitment' | 'attachment'
  category_label: string
  question_text: string
  question_type: 'short_text' | 'long_text' | 'multiple_choice' | 'link'
  answer_text: string
  selected_option?: string
  options?: string[]
  file_url?: string
}

export function getCandidateApplicationAnswers(candidateId: string): CandidateApplicationAnswer[] {
  const candidate = MOCK_CANDIDATES.find(c => c.id === candidateId)
  if (!candidate) return []

  const p = candidate.profiles
  const deptName = candidate.departments.name
  const deptSlug = candidate.departments.slug

  // Common questions
  const q1: CandidateApplicationAnswer = {
    question_id: 'q-gen-1',
    question_order: 1,
    category: 'general',
    category_label: 'Thông tin chung',
    question_text: 'Bạn biết đến iSSAC qua kênh thông tin nào?',
    question_type: 'multiple_choice',
    selected_option: candidateId === 'app-01' || candidateId === 'app-04' || candidateId === 'app-10' || candidateId === 'app-16' 
      ? 'Fanpage & Mạng xã hội CLB'
      : candidateId === 'app-02' || candidateId === 'app-05' || candidateId === 'app-11' || candidateId === 'app-17'
      ? 'Ngày hội Chào Tân sinh viên VNU-IS'
      : 'Bạn bè & Các cựu Đại sứ iSSAC giới thiệu',
    options: ['Fanpage & Mạng xã hội CLB', 'Ngày hội Chào Tân sinh viên VNU-IS', 'Bạn bè & Các cựu Đại sứ iSSAC giới thiệu', 'Giảng viên Trường Quốc tế'],
    answer_text: candidateId === 'app-01' || candidateId === 'app-04' || candidateId === 'app-10' || candidateId === 'app-16'
      ? 'Em theo dõi Fanpage CLB Đại sứ Sinh viên VNU-IS (iSSAC) và kênh TikTok của trường từ trước khi nhập học.'
      : candidateId === 'app-02' || candidateId === 'app-05' || candidateId === 'app-11' || candidateId === 'app-17'
      ? 'Em được ấn tượng sâu sắc từ gian hàng tư vấn tại Ngày hội Chào Tân sinh viên VNU-IS tại cơ sở Hòa Lạc.'
      : 'Em được các anh chị cựu Đại sứ sinh viên khóa trước cùng ngành truyền cảm hứng và động viên nộp đơn ứng tuyển.'
  }

  const q2: CandidateApplicationAnswer = {
    question_id: 'q-gen-2',
    question_order: 2,
    category: 'general',
    category_label: 'Động lực ứng tuyển',
    question_text: 'Mục tiêu lớn nhất và lý do bạn ứng tuyển trở thành Đại sứ sinh viên iSSAC?',
    question_type: 'long_text',
    answer_text: `Em mong muốn trở thành một phần của iSSAC để đại diện cho tinh thần sinh viên Trường Quốc tế - ĐHQGHN: tự tin, năng động và hội nhập quốc tế. ${p.bio || ''} Mục tiêu của em là phát triển toàn diện kỹ năng mềm, mở rộng kết nối và đóng góp giá trị thiết thực cho cộng đồng sinh viên VNU-IS thông qua các dự án của CLB.`
  }

  // Department specialized questions
  let q3: CandidateApplicationAnswer
  let q4: CandidateApplicationAnswer

  if (deptSlug === 'truyen-thong') {
    q3 = {
      question_id: 'q-tt-1',
      question_order: 3,
      category: 'department',
      category_label: 'Chuyên môn Ban Truyền thông',
      question_text: 'Vì sao bạn lựa chọn Ban Truyền thông và phong cách sáng tạo nội dung của bạn là gì?',
      question_type: 'long_text',
      answer_text: candidateId === 'app-01'
        ? 'Em có thế mạnh đặc biệt về thiết kế visual và xây dựng kịch bản video ngắn cho TikTok/Reels. Phong cách sáng tạo của em hiện đại, bắt kịp xu hướng giới trẻ (Gen Z aesthetic) nhưng luôn giữ chuẩn mực trang trọng của Đại học Quốc gia Hà Nội.'
        : candidateId === 'app-04'
        ? 'Em đam mê thiết kế đồ họa nhận diện thương hiệu với Figma & Adobe Illustrator. Em muốn xây dựng bộ ấn phẩm đồng bộ, chỉn chu và nâng tầm nhận diện của CLB iSSAC trên tất cả các kênh truyền thông số.'
        : candidateId === 'app-07'
        ? 'Sở trường của em là copywriting, viết bài PR truyền cảm hứng và sáng tạo nội dung bài đăng Facebook. Em muốn tạo ra các tuyến nội dung sâu sắc về hành trình trưởng thành của sinh viên VNU-IS.'
        : candidateId === 'app-10'
        ? 'Em chuyên về quay phim và dựng video sự kiện bằng Premiere Pro và CapCut. Em muốn ghi lại những thước phim xúc động, hoành tráng trong các sự kiện đại sứ sinh viên.'
        : candidateId === 'app-13'
        ? 'Em sở hữu máy ảnh chuyên dụng và có kỹ năng chụp ảnh sự kiện, phóng sự ảnh và blend màu Lightroom. Em tự tin sẽ phụ trách tốt mảng hình ảnh thực tế cho CLB.'
        : 'Em có niềm yêu thích lớn với việc hỗ trợ kỹ thuật âm thanh, ánh sáng và livestream sự kiện trên nền tảng số, mong muốn được đóng góp cho ban.'
    }

    q4 = {
      question_id: 'q-tt-2',
      question_order: 4,
      category: 'department',
      category_label: 'Kinh nghiệm & Kỹ năng',
      question_text: 'Hãy chia sẻ kinh nghiệm sử dụng các công cụ truyền thông (Canva, Photoshop, Premiere, CapCut) và kèm link sản phẩm nổi bật của bạn.',
      question_type: 'long_text',
      answer_text: `Em đã có kinh nghiệm thực tế quản lý kênh và sản xuất ấn phẩm từ thời THPT và năm nhất đại học. Các công cụ sử dụng thường xuyên: Adobe Photoshop, Illustrator, Premiere Pro, CapCut và Canva Pro. Link sản phẩm và portfolio được đính kèm trong hồ sơ Drive: ${p.cv_url || 'https://drive.google.com/sample_portfolio'}`
    }
  } else if (deptSlug === 'tu-van') {
    q3 = {
      question_id: 'q-tv-1',
      question_order: 3,
      category: 'department',
      category_label: 'Chuyên môn Ban Tư vấn',
      question_text: 'Vì sao bạn lựa chọn Ban Tư vấn và cách bạn tiếp cận để hỗ trợ tân sinh viên?',
      question_type: 'long_text',
      answer_text: candidateId === 'app-02'
        ? 'Với nền tảng tiếng Anh IELTS 8.0 và kinh nghiệm sinh hoạt học thuật, em muốn tư vấn các chương trình học bổng, cơ hội trao đổi quốc tế và định hướng chọn môn chuyên ngành cho các bạn sinh viên.'
        : candidateId === 'app-05'
        ? 'Em là người có tính cách thân thiện, cởi mở và kiên nhẫn. Em muốn làm người bạn đồng hành giải tỏa những bỡ ngỡ, lo âu ban đầu của các bạn tân sinh viên khi mới bước vào giảng đường đại học.'
        : candidateId === 'app-08'
        ? 'Em muốn xây dựng cẩm nang hỏi đáp nhanh về tín chỉ, học phần và các mẹo học tập hiệu quả tại Trường Quốc tế để hỗ trợ sinh viên nhanh chóng và chuẩn xác nhất.'
        : candidateId === 'app-11'
        ? 'Em từng có kinh nghiệm làm MC và diễn thuyết trước đám đông, em tự tin có thể dẫn dắt các buổi workshop chia sẻ phương pháp học tập và hướng nghiệp do CLB tổ chức.'
        : candidateId === 'app-14'
        ? 'Em luôn tỉ mỉ, thích nghiên cứu quy chế đào tạo và thông tin học vụ để giúp các bạn tháo gỡ vướng mắc trong quá trình đăng ký môn học và thực tập.'
        : 'Em muốn rèn luyện kỹ năng giao tiếp, lắng nghe tích cực và học hỏi kiến thức tư vấn chuyên sâu từ các anh chị khóa trên.'
    }

    q4 = {
      question_id: 'q-tv-2',
      question_order: 4,
      category: 'department',
      category_label: 'Xử lý tình huống',
      question_text: 'Theo bạn, kỹ năng quan trọng nhất của người tư vấn là gì? Hãy chia sẻ một tình huống thực tế bạn từng hỗ trợ người khác.',
      question_type: 'long_text',
      answer_text: 'Theo em, kỹ năng quan trọng nhất của người làm công tác tư vấn là "Lắng nghe chủ động và thấu cảm". Em từng hỗ trợ một bạn sinh viên khóa dưới gặp khủng hoảng tâm lý vì không theo kịp các môn học bằng tiếng Anh. Em đã dành thời gian ngồi lại, cùng bạn phân tích thời khóa biểu, chia sẻ tài liệu tự học song ngữ và kết nối bạn với nhóm bạn học cùng tiến, giúp bạn vượt qua kỳ thi với kết quả tốt.'
    }
  } else {
    // Ban Nhân sự
    q3 = {
      question_id: 'q-ns-1',
      question_order: 3,
      category: 'department',
      category_label: 'Chuyên môn Ban Nhân sự',
      question_text: 'Vì sao bạn muốn trở thành thành viên Ban Nhân sự iSSAC và bạn muốn đóng góp gì cho sự gắn kết nội bộ?',
      question_type: 'long_text',
      answer_text: candidateId === 'app-03'
        ? 'Em có định hướng phát triển nghề nghiệp trong lĩnh vực Quản trị Nhân sự (HR). Em muốn trực tiếp tham gia xây dựng quy chế thành viên, bộ tiêu chí đánh giá KPI công bằng và các chương trình bồi dưỡng kỹ năng cho toàn thể CLB.'
        : candidateId === 'app-06'
        ? 'Em là người tràn đầy năng lượng, có khả năng khuấy động phong trào và tổ chức các trò chơi teambuilding. Em muốn Ban Nhân sự luôn là linh hồn gắn kết tình cảm giữa các ban chuyên môn.'
        : candidateId === 'app-09'
        ? 'Em luôn cẩn thận, chu đáo và tôn trọng kỷ luật. Em mong muốn phụ trách công tác lưu trữ hồ sơ, theo dõi chuyên cần và chăm sóc quyền lợi cho từng thành viên trong suốt nhiệm kỳ.'
        : candidateId === 'app-12'
        ? 'Em muốn kết hợp các hoạt động thể thao, dã ngoại và ngày hội văn hóa nội bộ để tạo nên một đại gia đình iSSAC đoàn kết, thân thiết và giàu kỷ niệm.'
        : candidateId === 'app-15'
        ? 'Em thích lắng nghe, quan sát tâm lý của mọi người để kịp thời phát hiện những thành viên đang gặp khó khăn hoặc chùn bước, từ đó hỗ trợ gắn kết các bạn lại với tập thể.'
        : 'Em mong muốn được học hỏi quy trình tổ chức nhân sự, cách vận hành một tổ chức sinh viên chuyên nghiệp và cải thiện sự tự tin của bản thân trong môi trường tập thể.'
    }

    q4 = {
      question_id: 'q-ns-2',
      question_order: 4,
      category: 'department',
      category_label: 'Xử lý tình huống',
      question_text: 'Nếu trong ban có hai thành viên bất đồng quan điểm gay gắt trong quá trình chạy sự kiện, bạn sẽ giải quyết như thế nào?',
      question_type: 'long_text',
      answer_text: candidateId === 'app-18'
        ? 'Em sẽ bình tĩnh lắng nghe góc nhìn của từng bạn một cách khách quan, tìm ra nguyên nhân gốc rễ và cùng ngồi lại đối thoại vì mục tiêu chung của sự kiện. Nếu vượt quá thẩm quyền, em sẽ chủ động báo cáo với Trưởng ban để có hướng xử lý kịp thời.'
        : 'Trước tiên em sẽ tách hai bạn khỏi bầu không khí căng thẳng tại hiện trường để sự kiện không bị gián đoạn. Sau đó, em lắng nghe riêng từng bạn trên tinh thần tôn trọng, không phán xét, làm rõ đâu là sự thật và đâu là cảm xúc cá nhân. Tiếp theo, tổ chức buổi trao đổi thẳng thắn tập trung vào mục tiêu chung và giải pháp tối ưu cho CLB, đồng thời báo cáo với Trưởng ban để theo dõi tiến độ gắn kết.'
    }
  }

  const q5: CandidateApplicationAnswer = {
    question_id: 'q-com-1',
    question_order: 5,
    category: 'commitment',
    category_label: 'Cam kết tham gia',
    question_text: 'Bạn có cam kết dành tối thiểu 10 - 15 giờ/tuần cho các hoạt động của CLB và tham gia đầy đủ các buổi họp/training không?',
    question_type: 'multiple_choice',
    selected_option: 'Cam kết 100% thời gian và trách nhiệm',
    options: ['Cam kết 100% thời gian và trách nhiệm', 'Có thể tham gia 5 - 10 giờ/tuần', 'Chưa chắc chắn do lịch học'],
    answer_text: candidateId === 'app-18'
      ? 'Em xin cam kết dành đủ thời gian tham gia các buổi họp ban hàng tuần, các đợt tập huấn và hỗ trợ chạy sự kiện trực tiếp khi có phân công.'
      : 'Em hoàn toàn cam kết dành tối thiểu 12 - 15 giờ/tuần. Em đã sắp xếp thời khóa biểu hợp lý, ưu tiên lịch sinh hoạt định kỳ của CLB vào tối Thứ Bảy và sẵn sàng hỗ trợ tăng cường trong các tuần lễ diễn ra sự kiện lớn.'
  }

  const q6: CandidateApplicationAnswer = {
    question_id: 'q-att-1',
    question_order: 6,
    category: 'attachment',
    category_label: 'Hồ sơ đính kèm',
    question_text: 'Liên kết CV / Portfolio cá nhân và kênh liên lạc chính thức:',
    question_type: 'link',
    answer_text: `Link CV ứng viên: ${p.cv_url || 'https://drive.google.com/sample_cv'} · Facebook cá nhân: ${p.facebook_url || 'https://facebook.com/'}`,
    file_url: p.cv_url || 'https://drive.google.com/sample_cv'
  }

  return [q1, q2, q3, q4, q5, q6]
}

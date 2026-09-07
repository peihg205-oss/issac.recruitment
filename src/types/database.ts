export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          date_of_birth: string | null
          gender: string | null
          student_id: string | null
          university: string | null
          cohort: string | null
          major: string | null
          high_school: string | null
          address: string | null
          avatar_url: string | null
          role: 'member' | 'admin' | 'super_admin'
          department_id: string | null
          admin_role: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      departments: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string
          icon: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['departments']['Row']>
        Update: Partial<Database['public']['Tables']['departments']['Row']>
      }
      applications: {
        Row: {
          id: string
          user_id: string
          department_id: string
          second_department_id: string | null
          round_id: string | null
          status: ApplicationStatus
          submitted_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          review_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['applications']['Row']> & {
          user_id: string
          department_id: string
        }
        Update: Partial<Database['public']['Tables']['applications']['Row']>
      }
      questions: {
        Row: {
          id: string
          department_id: string | null
          round_id: string | null
          question_text: string
          question_type: QuestionType
          placeholder: string | null
          is_required: boolean
          is_active: boolean
          sort_order: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['questions']['Row']> & { question_text: string }
        Update: Partial<Database['public']['Tables']['questions']['Row']>
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          sort_order: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['question_options']['Row']> & {
          question_id: string
          option_text: string
        }
        Update: Partial<Database['public']['Tables']['question_options']['Row']>
      }
      application_answers: {
        Row: {
          id: string
          application_id: string
          question_id: string
          answer_text: string | null
          answer_options: Json | null
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['application_answers']['Row']> & {
          application_id: string
          question_id: string
        }
        Update: Partial<Database['public']['Tables']['application_answers']['Row']>
      }
      recruitment_rounds: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          round_number: number
          is_active: boolean
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['recruitment_rounds']['Row']> & { name: string; slug: string }
        Update: Partial<Database['public']['Tables']['recruitment_rounds']['Row']>
      }
      interview_slots: {
        Row: {
          id: string
          department_id: string | null
          round_id: string | null
          interview_date: string
          start_time: string
          end_time: string
          format: 'online' | 'offline'
          location: string | null
          meeting_url: string | null
          max_candidates: number
          current_candidates: number
          interviewers: Json
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['interview_slots']['Row']> & {
          interview_date: string
          start_time: string
          end_time: string
        }
        Update: Partial<Database['public']['Tables']['interview_slots']['Row']>
      }
      interviews: {
        Row: {
          id: string
          application_id: string
          slot_id: string
          user_id: string
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          confirmed_at: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['interviews']['Row']> & {
          application_id: string
          slot_id: string
          user_id: string
        }
        Update: Partial<Database['public']['Tables']['interviews']['Row']>
      }
      evaluation_criteria: {
        Row: {
          id: string
          department_id: string | null
          name: string
          description: string | null
          max_score: number
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['evaluation_criteria']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['evaluation_criteria']['Row']>
      }
      evaluations: {
        Row: {
          id: string
          application_id: string
          interviewer_id: string
          status: 'draft' | 'submitted'
          total_score: number | null
          strengths: string | null
          weaknesses: string | null
          overall_comment: string | null
          recommendation: 'pass' | 'waitlist' | 'fail' | null
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['evaluations']['Row']> & {
          application_id: string
          interviewer_id: string
        }
        Update: Partial<Database['public']['Tables']['evaluations']['Row']>
      }
      evaluation_scores: {
        Row: {
          id: string
          evaluation_id: string
          criteria_id: string
          score: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['evaluation_scores']['Row']> & {
          evaluation_id: string
          criteria_id: string
          score: number
        }
        Update: Partial<Database['public']['Tables']['evaluation_scores']['Row']>
      }
      candidate_rankings: {
        Row: {
          id: string
          application_id: string
          department_id: string | null
          final_score: number | null
          rank_number: number | null
          result: 'pending' | 'pass' | 'waitlist' | 'fail'
          is_tie: boolean
          tie_resolved: boolean
          calculated_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['candidate_rankings']['Row']>
        Update: Partial<Database['public']['Tables']['candidate_rankings']['Row']>
      }
      final_results: {
        Row: {
          id: string
          application_id: string
          user_id: string
          result: 'pass' | 'waitlist' | 'fail'
          announcement_message: string | null
          is_published: boolean
          finalized_by: string | null
          finalized_at: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['final_results']['Row']> & {
          application_id: string
          user_id: string
          result: 'pass' | 'waitlist' | 'fail'
        }
        Update: Partial<Database['public']['Tables']['final_results']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          action_url: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & {
          user_id: string
          title: string
          message: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_name: string | null
          department: string | null
          action: string
          target_type: string | null
          target_id: string | null
          description: string | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']> & { action: string }
        Update: never
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: string | null
          label: string | null
          description: string | null
          value_type: 'string' | 'number' | 'boolean' | 'json' | 'date'
          updated_by: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['system_settings']['Row']> & { key: string }
        Update: Partial<Database['public']['Tables']['system_settings']['Row']>
      }
    }
  }
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'received'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'interview_scheduled'
  | 'interviewed'
  | 'evaluating'
  | 'evaluated'
  | 'finalized'

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'file_upload'

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type QuestionOption = Database['public']['Tables']['question_options']['Row']
export type ApplicationAnswer = Database['public']['Tables']['application_answers']['Row']
export type RecruitmentRound = Database['public']['Tables']['recruitment_rounds']['Row']
export type InterviewSlot = Database['public']['Tables']['interview_slots']['Row']
export type Interview = Database['public']['Tables']['interviews']['Row']
export type EvaluationCriteria = Database['public']['Tables']['evaluation_criteria']['Row']
export type Evaluation = Database['public']['Tables']['evaluations']['Row']
export type EvaluationScore = Database['public']['Tables']['evaluation_scores']['Row']
export type CandidateRanking = Database['public']['Tables']['candidate_rankings']['Row']
export type FinalResult = Database['public']['Tables']['final_results']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type SystemSetting = Database['public']['Tables']['system_settings']['Row']

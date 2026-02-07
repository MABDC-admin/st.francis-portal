export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string | null
          end_date: string
          id: string
          is_archived: boolean
          is_current: boolean | null
          name: string
          school_id: string
          start_date: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          is_archived?: boolean
          is_current?: boolean | null
          name: string
          school_id: string
          start_date: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          is_archived?: boolean
          is_current?: boolean | null
          name?: string
          school_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          academic_year_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          priority: string | null
          published_at: string | null
          school_id: string | null
          target_audience: string[] | null
          target_grade_levels: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          published_at?: string | null
          school_id?: string | null
          target_audience?: string[] | null
          target_grade_levels?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          priority?: string | null
          published_at?: string | null
          school_id?: string | null
          target_audience?: string[] | null
          target_grade_levels?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_student_status: {
        Row: {
          academic_year_id: string
          created_at: string
          grade_level: string | null
          id: string
          school_id: string
          student_id: string
          was_active: boolean
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          grade_level?: string | null
          id?: string
          school_id: string
          student_id: string
          was_active?: boolean
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          grade_level?: string | null
          id?: string
          school_id?: string
          student_id?: string
          was_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "archived_student_status_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archived_student_status_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archived_student_status_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attachments: Json | null
          created_at: string | null
          feedback: string | null
          id: string
          score: number | null
          status: string | null
          student_id: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          attachments?: Json | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          status?: string | null
          student_id: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          attachments?: Json | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          score?: number | null
          status?: string | null
          student_id?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "student_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_activity_logs: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          status: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          status?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          status?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      book_page_index: {
        Row: {
          book_id: string
          chapter_title: string | null
          created_at: string
          extracted_text: string | null
          id: string
          index_status: string
          indexed_at: string | null
          keywords: string[] | null
          page_id: string
          page_number: number
          search_vector: unknown
          summary: string | null
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          book_id: string
          chapter_title?: string | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          index_status?: string
          indexed_at?: string | null
          keywords?: string[] | null
          page_id: string
          page_number: number
          search_vector?: unknown
          summary?: string | null
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          chapter_title?: string | null
          created_at?: string
          extracted_text?: string | null
          id?: string
          index_status?: string
          indexed_at?: string | null
          keywords?: string[] | null
          page_id?: string
          page_number?: number
          search_vector?: unknown
          summary?: string | null
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_page_index_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_page_index_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "book_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      book_pages: {
        Row: {
          book_id: string
          created_at: string
          detected_page_number: string | null
          detection_completed: boolean | null
          detection_confidence: number | null
          id: string
          image_url: string
          page_number: number
          page_type: string | null
          thumbnail_url: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          detected_page_number?: string | null
          detection_completed?: boolean | null
          detection_confidence?: number | null
          id?: string
          image_url: string
          page_number: number
          page_type?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          detected_page_number?: string | null
          detection_completed?: boolean | null
          detection_confidence?: number | null
          id?: string
          image_url?: string
          page_number?: number
          page_type?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_pages_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          cover_url: string | null
          created_at: string
          grade_level: number
          id: string
          index_status: string | null
          is_active: boolean | null
          page_count: number | null
          pdf_url: string | null
          school: string | null
          status: string
          subject: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          grade_level: number
          id?: string
          index_status?: string | null
          is_active?: boolean | null
          page_count?: number | null
          pdf_url?: string | null
          school?: string | null
          status?: string
          subject?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          grade_level?: number
          id?: string
          index_status?: string | null
          is_active?: boolean | null
          page_count?: number | null
          pdf_url?: string | null
          school?: string | null
          status?: string
          subject?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      canva_connections: {
        Row: {
          access_token: string
          canva_user_id: string | null
          created_at: string | null
          id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          canva_user_id?: string | null
          created_at?: string | null
          id?: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          canva_user_id?: string | null
          created_at?: string | null
          id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      canva_oauth_states: {
        Row: {
          code_verifier: string
          created_at: string | null
          expires_at: string | null
          id: string
          redirect_uri: string
          state_key: string
          user_id: string
        }
        Insert: {
          code_verifier: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          redirect_uri: string
          state_key: string
          user_id: string
        }
        Update: {
          code_verifier?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          redirect_uri?: string
          state_key?: string
          user_id?: string
        }
        Relationships: []
      }
      class_schedules: {
        Row: {
          academic_year_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          grade_level: string
          id: string
          room: string | null
          school_id: string
          section: string | null
          start_time: string
          subject_id: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          grade_level: string
          id?: string
          room?: string | null
          school_id: string
          section?: string | null
          start_time: string
          subject_id: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          grade_level?: string
          id?: string
          room?: string | null
          school_id?: string
          section?: string | null
          start_time?: string
          subject_id?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string | null
          school_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string | null
          school_id?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string | null
          school_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      data_exports: {
        Row: {
          academic_year_id: string | null
          export_type: string
          exported_at: string | null
          file_name: string | null
          file_size_bytes: number | null
          id: string
          record_count: number | null
          school_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          academic_year_id?: string | null
          export_type: string
          exported_at?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          record_count?: number | null
          school_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          academic_year_id?: string | null
          export_type?: string
          exported_at?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          record_count?: number | null
          school_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_exports_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_exports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      data_validation_issues: {
        Row: {
          created_at: string
          description: string
          field_name: string | null
          id: string
          is_resolved: boolean
          issue_type: string
          resolved_at: string | null
          resolved_by: string | null
          school_id: string
          severity: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          field_name?: string | null
          id?: string
          is_resolved?: boolean
          issue_type: string
          resolved_at?: string | null
          resolved_by?: string | null
          school_id: string
          severity?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          field_name?: string | null
          id?: string
          is_resolved?: boolean
          issue_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          school_id?: string
          severity?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_validation_issues_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_validation_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          academic_year_id: string
          created_at: string | null
          end_time: string | null
          exam_date: string
          exam_type: string
          grade_level: string
          id: string
          notes: string | null
          quarter: number | null
          room: string | null
          school_id: string
          start_time: string | null
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string | null
          end_time?: string | null
          exam_date: string
          exam_type: string
          grade_level: string
          id?: string
          notes?: string | null
          quarter?: number | null
          room?: string | null
          school_id: string
          start_time?: string | null
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string | null
          end_time?: string | null
          exam_date?: string
          exam_type?: string
          grade_level?: string
          id?: string
          notes?: string | null
          quarter?: number | null
          room?: string | null
          school_id?: string
          start_time?: string | null
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      excalidraw_drawings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_shared: boolean | null
          scene_data: Json | null
          school_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_shared?: boolean | null
          scene_data?: Json | null
          school_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_shared?: boolean | null
          scene_data?: Json | null
          school_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "excalidraw_drawings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      flipbooks: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          flipbook_url: string
          grade_levels: string[]
          id: string
          is_active: boolean | null
          school: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          flipbook_url: string
          grade_levels: string[]
          id?: string
          is_active?: boolean | null
          school?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          flipbook_url?: string
          grade_levels?: string[]
          id?: string
          is_active?: boolean | null
          school?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      grade_change_requests: {
        Row: {
          created_at: string
          id: string
          new_values: Json
          old_values: Json
          reason: string
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_grade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_values: Json
          old_values: Json
          reason: string
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_grade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          new_values?: Json
          old_values?: Json
          reason?: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_grade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_change_requests_student_grade_id_fkey"
            columns: ["student_grade_id"]
            isOneToOne: false
            referencedRelation: "student_grades"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_snapshots: {
        Row: {
          academic_year_id: string
          created_at: string
          final_grade: number | null
          id: string
          q1_grade: number | null
          q2_grade: number | null
          q3_grade: number | null
          q4_grade: number | null
          remarks: string | null
          school_id: string
          snapshot_data: Json | null
          student_id: string
          subject_id: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          final_grade?: number | null
          id?: string
          q1_grade?: number | null
          q2_grade?: number | null
          q3_grade?: number | null
          q4_grade?: number | null
          remarks?: string | null
          school_id: string
          snapshot_data?: Json | null
          student_id: string
          subject_id: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          final_grade?: number | null
          id?: string
          q1_grade?: number | null
          q2_grade?: number | null
          q3_grade?: number | null
          q4_grade?: number | null
          remarks?: string | null
          school_id?: string
          snapshot_data?: Json | null
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_snapshots_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_snapshots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_snapshots_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_snapshots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      message_receipts: {
        Row: {
          id: string
          message_id: string
          status: string
          status_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          status?: string
          status_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          status?: string
          status_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          message_type: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          message_type?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          message_type?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_cells: {
        Row: {
          cell_type: string
          content: string
          created_at: string
          id: string
          model: string | null
          notebook_id: string
          output: string | null
          pdf_extracted_text: string | null
          pdf_filename: string | null
          pdf_page_count: number | null
          position: number
          presentation_slide_count: number | null
          presentation_style: string | null
          updated_at: string
        }
        Insert: {
          cell_type?: string
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          notebook_id: string
          output?: string | null
          pdf_extracted_text?: string | null
          pdf_filename?: string | null
          pdf_page_count?: number | null
          position?: number
          presentation_slide_count?: number | null
          presentation_style?: string | null
          updated_at?: string
        }
        Update: {
          cell_type?: string
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          notebook_id?: string
          output?: string | null
          pdf_extracted_text?: string | null
          pdf_filename?: string | null
          pdf_page_count?: number | null
          position?: number
          presentation_slide_count?: number | null
          presentation_style?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_cells_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebooks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          school: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          school?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          school?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      raw_scores: {
        Row: {
          academic_year_id: string
          created_at: string | null
          id: string
          initial_grade: number | null
          pt_max_scores: number[] | null
          pt_scores: number[] | null
          qa_max: number | null
          qa_score: number | null
          quarter: number
          school_id: string
          student_id: string
          subject_id: string
          transmuted_grade: number | null
          updated_at: string | null
          ww_max_scores: number[] | null
          ww_scores: number[] | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string | null
          id?: string
          initial_grade?: number | null
          pt_max_scores?: number[] | null
          pt_scores?: number[] | null
          qa_max?: number | null
          qa_score?: number | null
          quarter: number
          school_id: string
          student_id: string
          subject_id: string
          transmuted_grade?: number | null
          updated_at?: string | null
          ww_max_scores?: number[] | null
          ww_scores?: number[] | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string | null
          id?: string
          initial_grade?: number | null
          pt_max_scores?: number[] | null
          pt_scores?: number[] | null
          qa_max?: number | null
          qa_score?: number | null
          quarter?: number
          school_id?: string
          student_id?: string
          subject_id?: string
          transmuted_grade?: number | null
          updated_at?: string | null
          ww_max_scores?: number[] | null
          ww_scores?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_scores_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_scores_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_scores_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          created_at: string
          file_url: string
          id: string
          is_active: boolean | null
          name: string
          school: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          is_active?: boolean | null
          name: string
          school?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          name?: string
          school?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_change_logs: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          new_role: string
          old_role: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: string
          new_role: string
          old_role?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          new_role?: string
          old_role?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          resource_key: string
          role: string
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          resource_key: string
          role: string
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          resource_key?: string
          role?: string
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_access_logs: {
        Row: {
          academic_year_id: string | null
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          record_id: string | null
          school_id: string | null
          success: boolean | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          academic_year_id?: string | null
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          school_id?: string | null
          success?: boolean | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          academic_year_id?: string | null
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          school_id?: string | null
          success?: boolean | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_access_logs_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_access_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_events: {
        Row: {
          academic_year_id: string | null
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          school: string | null
          title: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          event_type?: string
          id?: string
          school?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          school?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_events_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          acronym: string | null
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          school_id: string
          theme_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          acronym?: string | null
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          school_id?: string
          theme_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          acronym?: string | null
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          school_id?: string
          theme_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      school_switch_log: {
        Row: {
          from_academic_year_id: string | null
          from_school_id: string | null
          id: string
          ip_address: unknown
          session_id: string | null
          switched_at: string | null
          to_academic_year_id: string | null
          to_school_id: string | null
          user_id: string
        }
        Insert: {
          from_academic_year_id?: string | null
          from_school_id?: string | null
          id?: string
          ip_address?: unknown
          session_id?: string | null
          switched_at?: string | null
          to_academic_year_id?: string | null
          to_school_id?: string | null
          user_id: string
        }
        Update: {
          from_academic_year_id?: string | null
          from_school_id?: string | null
          id?: string
          ip_address?: unknown
          session_id?: string | null
          switched_at?: string | null
          to_academic_year_id?: string | null
          to_school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_switch_log_from_academic_year_id_fkey"
            columns: ["from_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_switch_log_from_school_id_fkey"
            columns: ["from_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_switch_log_to_academic_year_id_fkey"
            columns: ["to_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_switch_log_to_school_id_fkey"
            columns: ["to_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          code: string
          contact_number: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          principal_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          principal_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          principal_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      student_assignments: {
        Row: {
          academic_year_id: string
          assignment_type: string | null
          attachments: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string
          grade_level: string
          id: string
          instructions: string | null
          max_score: number | null
          school_id: string
          subject_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          assignment_type?: string | null
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date: string
          grade_level: string
          id?: string
          instructions?: string | null
          max_score?: number | null
          school_id: string
          subject_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          assignment_type?: string | null
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string
          grade_level?: string
          id?: string
          instructions?: string | null
          max_score?: number | null
          school_id?: string
          subject_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_assignments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attendance: {
        Row: {
          academic_year_id: string
          created_at: string | null
          date: string
          id: string
          recorded_by: string | null
          remarks: string | null
          school_id: string
          status: string
          student_id: string
          time_in: string | null
          time_out: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string | null
          date: string
          id?: string
          recorded_by?: string | null
          remarks?: string | null
          school_id: string
          status: string
          student_id: string
          time_in?: string | null
          time_out?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string | null
          date?: string
          id?: string
          recorded_by?: string | null
          remarks?: string | null
          school_id?: string
          status?: string
          student_id?: string
          time_in?: string | null
          time_out?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          analysis_status: string | null
          confidence_score: number | null
          created_at: string
          detected_language: string | null
          detected_type: string | null
          document_name: string
          document_type: string
          extracted_text: string | null
          file_url: string | null
          id: string
          is_pdf_page: boolean | null
          keywords: string[] | null
          original_filename: string | null
          page_count: number | null
          page_images: Json | null
          page_number: number | null
          parent_document_id: string | null
          slot_number: number
          student_id: string
          summary: string | null
          thumbnail_url: string | null
          updated_at: string
          uploaded_at: string | null
        }
        Insert: {
          analysis_status?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_language?: string | null
          detected_type?: string | null
          document_name: string
          document_type: string
          extracted_text?: string | null
          file_url?: string | null
          id?: string
          is_pdf_page?: boolean | null
          keywords?: string[] | null
          original_filename?: string | null
          page_count?: number | null
          page_images?: Json | null
          page_number?: number | null
          parent_document_id?: string | null
          slot_number: number
          student_id: string
          summary?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_at?: string | null
        }
        Update: {
          analysis_status?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_language?: string | null
          detected_type?: string | null
          document_name?: string
          document_type?: string
          extracted_text?: string | null
          file_url?: string | null
          id?: string
          is_pdf_page?: boolean | null
          keywords?: string[] | null
          original_filename?: string | null
          page_count?: number | null
          page_images?: Json | null
          page_number?: number | null
          parent_document_id?: string | null
          slot_number?: number
          student_id?: string
          summary?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "student_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          academic_year_id: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          final_grade: number | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          q1_grade: number | null
          q2_grade: number | null
          q3_grade: number | null
          q4_grade: number | null
          remarks: string | null
          school_id: string
          status: string
          student_id: string
          subject_id: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          final_grade?: number | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          q1_grade?: number | null
          q2_grade?: number | null
          q3_grade?: number | null
          q4_grade?: number | null
          remarks?: string | null
          school_id: string
          status?: string
          student_id: string
          subject_id: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          final_grade?: number | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          q1_grade?: number | null
          q2_grade?: number | null
          q3_grade?: number | null
          q4_grade?: number | null
          remarks?: string | null
          school_id?: string
          status?: string
          student_id?: string
          subject_id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_incidents: {
        Row: {
          action_taken: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          incident_date: string
          reported_by: string | null
          status: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          reported_by?: string | null
          status?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          reported_by?: string | null
          status?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_incidents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_subjects: {
        Row: {
          academic_year_id: string | null
          enrolled_at: string | null
          grade: number | null
          id: string
          school_id: string
          status: string | null
          student_id: string
          subject_id: string
        }
        Insert: {
          academic_year_id?: string | null
          enrolled_at?: string | null
          grade?: number | null
          id?: string
          school_id: string
          status?: string | null
          student_id: string
          subject_id: string
        }
        Update: {
          academic_year_id?: string | null
          enrolled_at?: string | null
          grade?: number | null
          id?: string
          school_id?: string
          status?: string | null
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_subjects_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subjects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year_id: string
          age: number | null
          birth_date: string | null
          created_at: string
          father_contact: string | null
          father_name: string | null
          gender: string | null
          id: string
          level: string
          lrn: string
          mother_contact: string | null
          mother_maiden_name: string | null
          phil_address: string | null
          photo_url: string | null
          previous_school: string | null
          school: string | null
          school_id: string
          student_name: string
          uae_address: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          age?: number | null
          birth_date?: string | null
          created_at?: string
          father_contact?: string | null
          father_name?: string | null
          gender?: string | null
          id?: string
          level: string
          lrn: string
          mother_contact?: string | null
          mother_maiden_name?: string | null
          phil_address?: string | null
          photo_url?: string | null
          previous_school?: string | null
          school?: string | null
          school_id: string
          student_name: string
          uae_address?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          age?: number | null
          birth_date?: string | null
          created_at?: string
          father_contact?: string | null
          father_name?: string | null
          gender?: string | null
          id?: string
          level?: string
          lrn?: string
          mother_contact?: string | null
          mother_maiden_name?: string | null
          phil_address?: string | null
          photo_url?: string | null
          previous_school?: string | null
          school?: string | null
          school_id?: string
          student_name?: string
          uae_address?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string | null
          department: string | null
          description: string | null
          grade_levels: string[]
          id: string
          is_active: boolean | null
          name: string
          units: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          department?: string | null
          description?: string | null
          grade_levels: string[]
          id?: string
          is_active?: boolean | null
          name: string
          units?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          department?: string | null
          description?: string | null
          grade_levels?: string[]
          id?: string
          is_active?: boolean | null
          name?: string
          units?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          employee_id: string
          full_name: string
          grade_level: string | null
          id: string
          phone: string | null
          school: string | null
          status: string | null
          subjects: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          employee_id: string
          full_name: string
          grade_level?: string | null
          id?: string
          phone?: string | null
          school?: string | null
          status?: string | null
          subjects?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string
          full_name?: string
          grade_level?: string | null
          id?: string
          phone?: string | null
          school?: string | null
          status?: string | null
          subjects?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_credentials: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_changed: boolean | null
          role: string
          student_id: string | null
          temp_password: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_changed?: boolean | null
          role: string
          student_id?: string | null
          temp_password: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_changed?: boolean | null
          role?: string
          student_id?: string | null
          temp_password?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_credentials_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_school_access: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          role: string
          school_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          school_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_school_access_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      zoom_settings: {
        Row: {
          active_days: number[]
          breakout_rooms: Json | null
          created_at: string
          id: string
          is_active: boolean
          meeting_id: string | null
          meeting_password: string | null
          meeting_url: string | null
          schedule_end: string
          schedule_start: string
          school_id: string
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_days?: number[]
          breakout_rooms?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          meeting_id?: string | null
          meeting_password?: string | null
          meeting_url?: string | null
          schedule_end?: string
          schedule_start?: string
          school_id: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_days?: number[]
          breakout_rooms?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          meeting_id?: string | null
          meeting_password?: string | null
          meeting_url?: string | null
          schedule_end?: string
          schedule_start?: string
          school_id?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zoom_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      school_access_stats: {
        Row: {
          access_count: number | null
          access_date: string | null
          action: string | null
          school_name: string | null
          table_name: string | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_conversation_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_schools: {
        Args: { p_user_id: string }
        Returns: {
          school_code: string
          school_id: string
          school_name: string
          user_role: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_school_access: {
        Args: {
          p_academic_year_id: string
          p_action: string
          p_error_message?: string
          p_record_id?: string
          p_school_id: string
          p_success?: boolean
          p_table_name: string
          p_user_id: string
        }
        Returns: string
      }
      manage_permissions_manually: {
        Args: {
          target_role: string
          target_school_id: string
          target_user_id: string
        }
        Returns: string
      }
      title_case: { Args: { input_text: string }; Returns: string }
      user_has_school_access: {
        Args: { p_school_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "registrar" | "teacher" | "student" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "registrar", "teacher", "student", "parent"],
    },
  },
} as const

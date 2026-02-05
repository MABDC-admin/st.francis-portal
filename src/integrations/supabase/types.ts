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
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          school_id: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          school_id: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
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
      book_pages: {
        Row: {
          book_id: string
          created_at: string
          id: string
          image_url: string
          page_number: number
          thumbnail_url: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          image_url: string
          page_number: number
          thumbnail_url?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          image_url?: string
          page_number?: number
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
          created_at: string
          final_grade: number | null
          id: string
          q1_grade: number | null
          q2_grade: number | null
          q3_grade: number | null
          q4_grade: number | null
          remarks: string | null
          school_id: string
          student_id: string
          subject_id: string
          updated_at: string
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
          student_id: string
          subject_id: string
          updated_at?: string
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
          student_id?: string
          subject_id?: string
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

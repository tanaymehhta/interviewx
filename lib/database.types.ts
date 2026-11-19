export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answers: {
        Row: {
          created_at: string
          delivery: number | null
          feedback: Json | null
          id: string
          impact: number | null
          job_id: string
          overall: number | null
          parent_answer_id: string | null
          question: string
          question_type: string | null
          relevance: number | null
          seconds: number | null
          session_id: string
          skill_id: string | null
          structure: number | null
          text: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          delivery?: number | null
          feedback?: Json | null
          id?: string
          impact?: number | null
          job_id: string
          overall?: number | null
          parent_answer_id?: string | null
          question: string
          question_type?: string | null
          relevance?: number | null
          seconds?: number | null
          session_id: string
          skill_id?: string | null
          structure?: number | null
          text: string
          user_id?: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          delivery?: number | null
          feedback?: Json | null
          id?: string
          impact?: number | null
          job_id?: string
          overall?: number | null
          parent_answer_id?: string | null
          question?: string
          question_type?: string | null
          relevance?: number | null
          seconds?: number | null
          session_id?: string
          skill_id?: string | null
          structure?: number | null
          text?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_parent_answer_id_fkey"
            columns: ["parent_answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          brief: Json
          company: string
          created_at: string
          id: string
          posting_text: string | null
          role: string
          source_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          brief?: Json
          company: string
          created_at?: string
          id?: string
          posting_text?: string | null
          role: string
          source_url?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          brief?: Json
          company?: string
          created_at?: string
          id?: string
          posting_text?: string | null
          role?: string
          source_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          school: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          school: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          school?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          answer_id: string | null
          card: Json | null
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          answer_id?: string | null
          card?: Json | null
          content?: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id?: string
        }
        Update: {
          answer_id?: string | null
          card?: Json | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_days: {
        Row: {
          day: string
          done: boolean
          id: string
          minutes: number
          round_id: string
          skill_id: string | null
          tool: string
          user_id: string
        }
        Insert: {
          day: string
          done?: boolean
          id?: string
          minutes: number
          round_id: string
          skill_id?: string | null
          tool: string
          user_id?: string
        }
        Update: {
          day?: string
          done?: boolean
          id?: string
          minutes?: number
          round_id?: string
          skill_id?: string | null
          tool?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_days_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_days_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          onboarded: boolean
          program: string | null
          resume_analysis: Json | null
          resume_path: string | null
          resume_text: string | null
          target_roles: string[]
          theme: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          onboarded?: boolean
          program?: string | null
          resume_analysis?: Json | null
          resume_path?: string | null
          resume_text?: string | null
          target_roles?: string[]
          theme?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          onboarded?: boolean
          program?: string | null
          resume_analysis?: Json | null
          resume_path?: string | null
          resume_text?: string | null
          target_roles?: string[]
          theme?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          asked_questions: string[]
          asks: Json
          created_at: string
          date: string | null
          expects: Json
          format: string | null
          id: string
          interviewer_notes: string | null
          interviewer_type: string | null
          job_id: string
          length_minutes: number | null
          name: string
          outcome: string | null
          position: number
          skill_ids: string[]
          snapshot: Json | null
          user_id: string
          went_well: string | null
          went_wrong: string | null
        }
        Insert: {
          asked_questions?: string[]
          asks?: Json
          created_at?: string
          date?: string | null
          expects?: Json
          format?: string | null
          id?: string
          interviewer_notes?: string | null
          interviewer_type?: string | null
          job_id: string
          length_minutes?: number | null
          name: string
          outcome?: string | null
          position: number
          skill_ids?: string[]
          snapshot?: Json | null
          user_id?: string
          went_well?: string | null
          went_wrong?: string | null
        }
        Update: {
          asked_questions?: string[]
          asks?: Json
          created_at?: string
          date?: string | null
          expects?: Json
          format?: string | null
          id?: string
          interviewer_notes?: string | null
          interviewer_type?: string | null
          job_id?: string
          length_minutes?: number | null
          name?: string
          outcome?: string | null
          position?: number
          skill_ids?: string[]
          snapshot?: Json | null
          user_id?: string
          went_well?: string | null
          went_wrong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          ended_at: string | null
          id: string
          job_id: string
          length_minutes: number | null
          review: Json | null
          round_id: string
          script: Json | null
          started_at: string
          status: string
          tool: string
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          job_id: string
          length_minutes?: number | null
          review?: Json | null
          round_id: string
          script?: Json | null
          started_at?: string
          status?: string
          tool: string
          user_id?: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          job_id?: string
          length_minutes?: number | null
          review?: Json | null
          round_id?: string
          script?: Json | null
          started_at?: string
          status?: string
          tool?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_scores: {
        Row: {
          answer_id: string | null
          created_at: string
          id: string
          score: number
          skill_id: string
          user_id: string
        }
        Insert: {
          answer_id?: string | null
          created_at?: string
          id?: string
          score: number
          skill_id: string
          user_id?: string
        }
        Update: {
          answer_id?: string | null
          created_at?: string
          id?: string
          score?: number
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_scores_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_scores_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          id: string
          job_id: string
          last_practiced_at: string | null
          name: string
          reason: string | null
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          last_practiced_at?: string | null
          name: string
          reason?: string | null
          score?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          last_practiced_at?: string | null
          name?: string
          reason?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          id: string
          kind: string
          round_id: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          round_id?: string | null
          title?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          round_id?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const


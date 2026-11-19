// Hand-written from supabase/migrations until the Supabase project exists.
// Task 2.3 replaces this file with `supabase gen types typescript`.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        id: string; name: string | null; program: string | null; target_roles: string[];
        resume_path: string | null; resume_text: string | null; resume_analysis: Json | null;
        theme: string; onboarded: boolean; created_at: string;
      }, "id">;
      jobs: Table<{
        id: string; user_id: string; company: string; role: string; source_url: string | null;
        posting_text: string | null; brief: Json; status: string; created_at: string;
      }, "company" | "role">;
      skills: Table<{
        id: string; user_id: string; job_id: string; name: string; reason: string | null;
        score: number; last_practiced_at: string | null; created_at: string;
      }, "job_id" | "name">;
      rounds: Table<{
        id: string; user_id: string; job_id: string; position: number; name: string; format: string | null;
        length_minutes: number | null; interviewer_type: string | null; asks: Json; expects: Json;
        skill_ids: string[]; date: string | null; interviewer_notes: string | null; outcome: string | null;
        went_well: string | null; went_wrong: string | null; asked_questions: string[]; snapshot: Json | null;
        created_at: string;
      }, "job_id" | "position" | "name">;
      plan_days: Table<{
        id: string; user_id: string; round_id: string; day: string; skill_id: string | null;
        tool: string; minutes: number; done: boolean;
      }, "round_id" | "day" | "tool" | "minutes">;
      sessions: Table<{
        id: string; user_id: string; job_id: string; round_id: string; tool: string;
        length_minutes: number | null; status: string; script: Json | null; review: Json | null;
        started_at: string; ended_at: string | null;
      }, "job_id" | "round_id" | "tool">;
      answers: Table<{
        id: string; user_id: string; job_id: string; session_id: string; skill_id: string | null;
        question: string; question_type: string | null; parent_answer_id: string | null; text: string;
        seconds: number | null; word_count: number | null; overall: number | null; structure: number | null;
        relevance: number | null; impact: number | null; delivery: number | null; feedback: Json | null;
        created_at: string;
      }, "job_id" | "session_id" | "question" | "text">;
      skill_scores: Table<{
        id: string; user_id: string; skill_id: string; answer_id: string | null; score: number; created_at: string;
      }, "skill_id" | "score">;
      threads: Table<{
        id: string; user_id: string; kind: string; round_id: string | null; title: string | null; created_at: string;
      }, "kind">;
      messages: Table<{
        id: string; user_id: string; thread_id: string; role: string; content: string; card: Json | null;
        answer_id: string | null; created_at: string;
      }, "thread_id" | "role">;
      leads: Table<{ id: string; name: string; school: string; email: string; created_at: string }, "name" | "school" | "email">;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

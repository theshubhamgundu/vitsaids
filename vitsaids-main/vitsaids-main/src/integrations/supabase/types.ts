export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          attended_classes: number | null
          created_at: string | null
          ht_no: string
          id: string
          month: string
          percentage: number | null
          student_id: string | null
          total_classes: number | null
          year: number
        }
        Insert: {
          attended_classes?: number | null
          created_at?: string | null
          ht_no: string
          id?: string
          month: string
          percentage?: number | null
          student_id?: string | null
          total_classes?: number | null
          year: number
        }
        Update: {
          attended_classes?: number | null
          created_at?: string | null
          ht_no?: string
          id?: string
          month?: string
          percentage?: number | null
          student_id?: string | null
          total_classes?: number | null
          year?: number
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_name: string
          certificate_url: string
          ht_no: string
          id: string
          uploaded_at: string | null
        }
        Insert: {
          certificate_name: string
          certificate_url: string
          ht_no: string
          id?: string
          uploaded_at?: string | null
        }
        Update: {
          certificate_name?: string
          certificate_url?: string
          ht_no?: string
          id?: string
          uploaded_at?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string | null
          date_issued: string
          file_url: string | null
          ht_no: string | null
          id: string
          issuer: string
          status: string | null
          student_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          date_issued: string
          file_url?: string | null
          ht_no?: string | null
          id?: string
          issuer: string
          status?: string | null
          student_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          date_issued?: string
          file_url?: string | null
          ht_no?: string | null
          id?: string
          issuer?: string
          status?: string | null
          student_id?: string | null
          title?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          speaker: string | null
          time: string
          title: string
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          speaker?: string | null
          time: string
          title: string
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          speaker?: string | null
          time?: string
          title?: string
          venue?: string | null
        }
        Relationships: []
      }
      faculty: {
        Row: {
          bio: string | null
          created_at: string | null
          education: string | null
          email: string | null
          expertise: string | null
          id: string
          image_url: string | null
          linkedin: string | null
          name: string
          phone: string | null
          position: string
          publications: string | null
          research: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          expertise?: string | null
          id?: string
          image_url?: string | null
          linkedin?: string | null
          name: string
          phone?: string | null
          position: string
          publications?: string | null
          research?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          expertise?: string | null
          id?: string
          image_url?: string | null
          linkedin?: string | null
          name?: string
          phone?: string | null
          position?: string
          publications?: string | null
          research?: string | null
        }
        Relationships: []
      }
      gallery: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string | null
          type: string
          uploaded_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
          type: string
          uploaded_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
          type?: string
          uploaded_at?: string
          url?: string
        }
        Relationships: []
      }
      placements: {
        Row: {
          branch: string | null
          company: string
          created_at: string | null
          ctc: number | null
          id: string
          package: string
          position: string
          student_name: string | null
          students_placed: number | null
          type: string | null
          year: string
        }
        Insert: {
          branch?: string | null
          company: string
          created_at?: string | null
          ctc?: number | null
          id?: string
          package: string
          position: string
          student_name?: string | null
          students_placed?: number | null
          type?: string | null
          year: string
        }
        Update: {
          branch?: string | null
          company?: string
          created_at?: string | null
          ctc?: number | null
          id?: string
          package?: string
          position?: string
          student_name?: string | null
          students_placed?: number | null
          type?: string | null
          year?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          cgpa: number | null
          created_at: string | null
          file_url: string | null
          ht_no: string | null
          id: string
          semester: number
          sgpa: number | null
          student_id: string | null
          year: number
        }
        Insert: {
          cgpa?: number | null
          created_at?: string | null
          file_url?: string | null
          ht_no?: string | null
          id?: string
          semester: number
          sgpa?: number | null
          student_id?: string | null
          year: number
        }
        Update: {
          cgpa?: number | null
          created_at?: string | null
          file_url?: string | null
          ht_no?: string | null
          id?: string
          semester?: number
          sgpa?: number | null
          student_id?: string | null
          year?: number
        }
        Relationships: []
      }
      student_certificates: {
        Row: {
          description: string | null
          file_url: string
          htno: string
          id: string
          title: string | null
          uploaded_at: string | null
        }
        Insert: {
          description?: string | null
          file_url: string
          htno: string
          id?: string
          title?: string | null
          uploaded_at?: string | null
        }
        Update: {
          description?: string | null
          file_url?: string
          htno?: string
          id?: string
          title?: string | null
          uploaded_at?: string | null
        }
        Relationships: []
      }
      student_results: {
        Row: {
          cgpa: number
          htno: string
          id: string
          result_url: string
          semester: string
          uploaded_at: string | null
        }
        Insert: {
          cgpa: number
          htno: string
          id?: string
          result_url: string
          semester: string
          uploaded_at?: string | null
        }
        Update: {
          cgpa?: number
          htno?: string
          id?: string
          result_url?: string
          semester?: string
          uploaded_at?: string | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          created_at: string | null
          id: string
          slot: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          slot: string
        }
        Update: {
          created_at?: string | null
          id?: string
          slot?: string
        }
        Relationships: []
      }
      timetable: {
        Row: {
          created_at: string | null
          day: string
          hour: string
          id: string
          subject_name: string
          year: number
        }
        Insert: {
          created_at?: string | null
          day: string
          hour: string
          id?: string
          subject_name: string
          year: number
        }
        Update: {
          created_at?: string | null
          day?: string
          hour?: string
          id?: string
          subject_name?: string
          year?: number
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          address: string | null
          cgpa: number | null
          email: string | null
          emergency_no: string | null
          ht_no: string | null
          id: string
          phone: string | null
          photo_url: string | null
          role: string
          section: string | null
          semester: string | null
          status: string | null
          student_name: string | null
          year: string | null
        }
        Insert: {
          address?: string | null
          cgpa?: number | null
          email?: string | null
          emergency_no?: string | null
          ht_no?: string | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          role: string
          section?: string | null
          semester?: string | null
          status?: string | null
          student_name?: string | null
          year?: string | null
        }
        Update: {
          address?: string | null
          cgpa?: number | null
          email?: string | null
          emergency_no?: string | null
          ht_no?: string | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          section?: string | null
          semester?: string | null
          status?: string | null
          student_name?: string | null
          year?: string | null
        }
        Relationships: []
      }
      verified_students: {
        Row: {
          ht_no: string
          student_name: string | null
          year: string | null
        }
        Insert: {
          ht_no: string
          student_name?: string | null
          year?: string | null
        }
        Update: {
          ht_no?: string
          student_name?: string | null
          year?: string | null
        }
        Relationships: []
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

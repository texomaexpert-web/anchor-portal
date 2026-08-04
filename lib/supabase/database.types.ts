// TypeScript types for the existing Anchor Portal schema in Supabase Postgres.
// Written in the shape `supabase gen types typescript` produces so they can be
// regenerated from the live database later without touching call sites:
//   npx supabase gen types typescript --project-id yxmgbuxtpeprfysxqevb > lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AgentRole = "agent" | "broker";
export type LeadSide = "buyer" | "seller";
export type MessageDirection = "inbound" | "outbound";
export type MessageChannel = "sms" | "email";

export type Database = {
  public: {
    Tables: {
      agent: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          role: AgentRole;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          role?: AgentRole;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          role?: AgentRole;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      lead: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          email: string | null;
          side: LeadSide;
          status: string;
          source: string | null;
          agent_id: string | null;
          created_at: string;
          last_activity_at: string | null;
          last_contacted_at: string | null;
          notes_summary: string | null;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          email?: string | null;
          side: LeadSide;
          status?: string;
          source?: string | null;
          agent_id?: string | null;
          created_at?: string;
          last_activity_at?: string | null;
          last_contacted_at?: string | null;
          notes_summary?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          email?: string | null;
          side?: LeadSide;
          status?: string;
          source?: string | null;
          agent_id?: string | null;
          created_at?: string;
          last_activity_at?: string | null;
          last_contacted_at?: string | null;
          notes_summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent";
            referencedColumns: ["id"];
          },
        ];
      };
      message: {
        Row: {
          id: string;
          lead_id: string;
          direction: MessageDirection;
          channel: MessageChannel;
          body: string | null;
          sent_by: string | null;
          agent_id: string | null;
          sent_at: string;
          external_id: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          direction: MessageDirection;
          channel: MessageChannel;
          body?: string | null;
          sent_by?: string | null;
          agent_id?: string | null;
          sent_at?: string;
          external_id?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string;
          direction?: MessageDirection;
          channel?: MessageChannel;
          body?: string | null;
          sent_by?: string | null;
          agent_id?: string | null;
          sent_at?: string;
          external_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "message_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "lead";
            referencedColumns: ["id"];
          },
        ];
      };
      task: {
        Row: {
          id: string;
          lead_id: string;
          agent_id: string | null;
          type: string;
          detail: string | null;
          due_at: string | null;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          agent_id?: string | null;
          type: string;
          detail?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          agent_id?: string | null;
          type?: string;
          detail?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "lead";
            referencedColumns: ["id"];
          },
        ];
      };
      note: {
        Row: {
          id: string;
          lead_id: string;
          agent_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          agent_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          agent_id?: string | null;
          body?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "lead";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment: {
        Row: {
          id: string;
          lead_id: string;
          agent_id: string | null;
          type: string;
          location: string | null;
          starts_at: string;
          ends_at: string | null;
          reminder_sent_at: string | null;
          outcome: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          agent_id?: string | null;
          type: string;
          location?: string | null;
          starts_at: string;
          ends_at?: string | null;
          reminder_sent_at?: string | null;
          outcome?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          agent_id?: string | null;
          type?: string;
          location?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          reminder_sent_at?: string | null;
          outcome?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointment_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "lead";
            referencedColumns: ["id"];
          },
        ];
      };
      status_history: {
        Row: {
          id: string;
          lead_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          agent_id: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by?: string | null;
          agent_id?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          from_status?: string | null;
          to_status?: string;
          changed_by?: string | null;
          agent_id?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "status_history_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "status_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "lead";
            referencedColumns: ["id"];
          },
        ];
      };
      activity: {
        Row: {
          id: string;
          lead_id: string | null;
          session_id: string | null;
          event_type: string;
          listing_id: string | null;
          listing_address: string | null;
          search_criteria: Json | null;
          page_url: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          session_id?: string | null;
          event_type: string;
          listing_id?: string | null;
          listing_address?: string | null;
          search_criteria?: Json | null;
          page_url?: string | null;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          session_id?: string | null;
          event_type?: string;
          listing_id?: string | null;
          listing_address?: string | null;
          search_criteria?: Json | null;
          page_url?: string | null;
          occurred_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "lead";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      agent_role: AgentRole;
      lead_side: LeadSide;
      message_direction: MessageDirection;
      message_channel: MessageChannel;
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Agent = Tables<"agent">;
export type Lead = Tables<"lead">;
export type Message = Tables<"message">;
export type Task = Tables<"task">;
export type Note = Tables<"note">;
export type Appointment = Tables<"appointment">;
export type StatusHistory = Tables<"status_history">;
export type Activity = Tables<"activity">;

// Database types - these will be generated from your Supabase schema
// For now, we'll define the basic structure for your three main features

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      services: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          title: string;
          summary: string | null;
          details: string | null;
          category: string;
          price_range: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          location: string | null;
          website: string | null;
          status: 'active' | 'inactive';
          image_url: string | null;
        };
        Insert: {
          user_id: string;
          title: string;
          summary: string | null;
          details: string | null;
          category: string;
          price_range?: string | null; // optional when inserting
          contact_email: string | null;
          contact_phone: string | null;
          location: string | null;
          website: string | null;
          status: 'active' | 'inactive';
          image_url: string | null;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      marketplace_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          price: number;
          condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
          location: string;
          status: 'available' | 'pending' | 'sold';
          images: string[];
          contact: string | null;
        };
        Insert: Omit<Database['public']['Tables']['marketplace_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['marketplace_items']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          title: string;
          description: string;
          category: string;
          event_date: string;
          end_date: string | null;
          location: string;
          address: string | null;
          max_attendees: number | null;
          current_attendees: number;
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
          image_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at' | 'current_attendees'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      event_attendees: {
        Row: {
          id: string;
          created_at: string;
          event_id: string;
          user_id: string;
          status: 'attending' | 'maybe' | 'not_attending';
        };
        Insert: Omit<Database['public']['Tables']['event_attendees']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['event_attendees']['Insert']>;
      };
      comments: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          parent_id: string | null;
          content: string;
        };
        Insert: {
          user_id: string;
          entity_type: string;
          entity_id: string;
          parent_id?: string | null;
          content: string;
        };
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };
      service_reviews: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          service_id: string;
          user_id: string;
          rating: number; // 1..5
          comment: string | null;
          author_name: string | null;
        };
        Insert: {
          service_id: string;
          user_id: string;
          rating: number; // 1..5
          comment?: string | null;
          author_name?: string | null;
        };
        Update: Partial<Database['public']['Tables']['service_reviews']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}


// Database types - these will be generated from your Supabase schema
// For now, we'll define the basic structure for your three main features

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
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
          contact_email: string | null;
          contact_phone: string | null;
          location: string | null;
          website: string | null;
          status: 'active' | 'inactive';
          image_url: string | null;
          tags: string[];
        };
        Insert: {
          user_id: string;
          title: string;
          summary: string | null;
          details: string | null;
          category: string;
          contact_email: string | null;
          contact_phone: string | null;
          location: string | null;
          website: string | null;
          status: 'active' | 'inactive';
          image_url: string | null;
          tags?: string[]; // optional when inserting; defaults to empty array
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
        Relationships: [];
      };
      marketplace_items: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          title: string;
          description: string;
          category:
            | 'furniture'
            | 'electronics'
            | 'appliances'
            | 'home_garden'
            | 'clothing'
            | 'kids'
            | 'toys_games'
            | 'sports_outdoors'
            | 'tools'
            | 'vehicles'
            | 'pets'
            | 'free'
            | 'general';
          price: number;
          condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
          location: string;
          status: 'available' | 'pending' | 'sold';
          images: string[];
          contact: string | null;
        };
        Insert: Omit<Database['public']['Tables']['marketplace_items']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['marketplace_items']['Insert']>;
        Relationships: [];
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
          group_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at' | 'current_attendees' | 'group_id'> & { group_id?: string | null };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
        Relationships: [];
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
        Relationships: [];
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
          images: string[];
        };
        Insert: {
          user_id: string;
          entity_type: string;
          entity_id: string;
          parent_id?: string | null;
          content: string;
          images?: string[];
        };
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
        Relationships: [];
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
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          title: string;
          description: string;
          type: string;
          location: string | null;
          /** 'pending' is a proposal awaiting a superadmin. */
          status: 'active' | 'inactive' | 'pending';
          image_url: string | null;
          /** Key from lib/data/group-icons.ts; null shows the type's icon. */
          icon: string | null;
          /** Content is members-only and joining takes an approved request. */
          is_private: boolean;
        };
        Insert: {
          user_id: string;
          title: string;
          description: string;
          type: string;
          location?: string | null;
          status?: 'active' | 'inactive' | 'pending';
          image_url?: string | null;
          icon?: string | null;
          is_private?: boolean;
        };
        Update: Partial<Database['public']['Tables']['groups']['Insert']>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          role: 'superadmin' | 'admin' | 'client';
        };
        Insert: {
          user_id: string;
          role?: 'superadmin' | 'admin' | 'client';
        };
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          created_at: string;
          group_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          status: 'active' | 'inactive';
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          status?: 'active' | 'inactive';
        };
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>;
        Relationships: [];
      };
      group_join_requests: {
        Row: {
          id: string;
          created_at: string;
          group_id: string;
          user_id: string;
          /** The requester's note about themselves, 1-500 characters. */
          message: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          message: string;
        };
        Update: Partial<Database['public']['Tables']['group_join_requests']['Insert']>;
        Relationships: [];
      };
      group_polls: {
        Row: {
          id: string;
          created_at: string;
          group_id: string;
          user_id: string;
          question: string;
          allow_multiple: boolean;
          allow_member_options: boolean;
          closes_at: string | null;
          closed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['group_polls']['Row'], 'id' | 'created_at' | 'closed_at'> & { closed_at?: string | null };
        Update: Partial<Database['public']['Tables']['group_polls']['Insert']>;
        Relationships: [];
      };
      group_poll_options: {
        Row: {
          id: string;
          created_at: string;
          poll_id: string;
          user_id: string;
          label: string;
          position: number;
        };
        Insert: Omit<Database['public']['Tables']['group_poll_options']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['group_poll_options']['Insert']>;
        Relationships: [];
      };
      group_poll_votes: {
        Row: {
          id: string;
          created_at: string;
          poll_id: string;
          option_id: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['group_poll_votes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['group_poll_votes']['Insert']>;
        Relationships: [];
      };
      group_signups: {
        Row: {
          id: string;
          created_at: string;
          group_id: string;
          user_id: string;
          title: string;
          description: string | null;
          closed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['group_signups']['Row'], 'id' | 'created_at' | 'closed_at'> & { closed_at?: string | null };
        Update: Partial<Database['public']['Tables']['group_signups']['Insert']>;
        Relationships: [];
      };
      group_signup_slots: {
        Row: {
          id: string;
          created_at: string;
          signup_id: string;
          label: string;
          /** Null means unlimited. */
          capacity: number | null;
          position: number;
        };
        Insert: Omit<Database['public']['Tables']['group_signup_slots']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['group_signup_slots']['Insert']>;
        Relationships: [];
      };
      group_signup_claims: {
        Row: {
          id: string;
          created_at: string;
          slot_id: string;
          user_id: string;
          note: string | null;
        };
        Insert: Omit<Database['public']['Tables']['group_signup_claims']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['group_signup_claims']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      /** Service role only. The old owner becomes a group admin. */
      transfer_group_ownership: {
        Args: { p_group_id: string; p_new_owner: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};


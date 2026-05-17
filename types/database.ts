export type ProfileRole = "buyer" | "seller" | "admin";
export type KycStatus = "pending" | "submitted" | "verified" | "failed";
export type ListingPlatform =
  | "ios"
  | "android"
  | "macos"
  | "windows"
  | "ios-gaming"
  | "android-gaming"
  | "pc-gaming";
export type ListingStatus = "draft" | "live" | "under_offer" | "sold" | "withdrawn";
export type ListingNdaStatus = "none" | "requested" | "approved" | "rejected";
export type NdaRequestStatus = "pending_nda" | "pending_review" | "approved" | "declined" | "expired";
export type NdaDealType = "acquire" | "cofound" | "merge" | "undecided";
export type DealType = "acquire" | "cofound" | "merge";
export type DealStatus =
  | "negotiating"
  | "loi_sent"
  | "loi_accepted"
  | "payment_pending"
  | "in_escrow"
  | "ip_transferred"
  | "completed"
  | "disputed"
  | "cancelled";

export type Profile = {
  id: string;
  role: ProfileRole;
  full_name: string | null;
  email: string | null;
  country: string | null;
  company: string | null;
  primary_platform: string | null;
  kyc_status: KycStatus;
  kyc_session_id: string | null;
  verified_budget_min: number | null;
  verified_budget_max: number | null;
  deal_count: number;
  avatar_initials: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_charges_enabled: boolean;
  sanctions_flagged: boolean;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Listing = {
  id: string;
  seller_id: string;
  platform: ListingPlatform;
  category_label: string;
  completion_pct: number;
  asking_price_gbp: number;
  deal_types: string[];
  tech_stack: string[];
  public_summary: string;
  status: ListingStatus;
  is_anonymous: boolean;
  views_count: number;
  dev_background: string | null;
  screenshots_urls: string[];
  demo_video_url: string | null;
  tech_stack_detail: string | null;
  git_stats: Json;
  dev_timeline: string | null;
  project_name: string | null;
  source_code_url: string | null;
  architecture_doc: string | null;
  revenue_data: Json;
  roadmap: string | null;
  seller_name: string | null;
  created_at: string;
  updated_at: string;
  listed_at: string | null;
  sold_at: string | null;
};

export type ListingNdaAccess = {
  listing_id: string;
  user_id: string;
  status: Exclude<ListingNdaStatus, "none">;
  created_at: string;
  updated_at: string;
};

export type NdaRequest = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  deal_type: NdaDealType;
  budget_min_gbp: number | null;
  budget_max_gbp: number | null;
  message: string | null;
  pandadoc_doc_id: string | null;
  pandadoc_status: string;
  pandadoc_signed_at: string | null;
  buyer_copy_url: string | null;
  seller_copy_url: string | null;
  status: NdaRequestStatus;
  auto_approved: boolean;
  seller_decided_at: string | null;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type SellerSettings = {
  seller_id: string;
  auto_approve: boolean;
  auto_approve_min_budget: number;
  auto_approve_deal_types: string[];
  response_message: string;
  created_at: string;
  updated_at: string;
};

export type Deal = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  nda_request_id: string | null;
  deal_type: DealType;
  agreed_price_gbp: number;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  platform_fee_gbp: number | null;
  status: DealStatus;
  noshop_activated_at: string | null;
  noshop_expires_at: string | null;
  voyage_manager_assigned: boolean;
  voyage_manager_name: string | null;
  voyage_manager_email: string | null;
  loi_sent_at: string | null;
  loi_accepted_at: string | null;
  payment_made_at: string | null;
  ip_transferred_at: string | null;
  completed_at: string | null;
  loi_data: Json;
  loi_counter: number;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  deal_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: "listing" | "nda_request" | "deal" | "user" | "admin";
  entity_id: string | null;
  metadata: Json;
  ip_address: string | null;
  created_at: string;
};

export type SarFlag = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  flag_reason: string;
  severity: "low" | "medium" | "high" | "critical";
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      listings: {
        Row: Listing;
        Insert: Omit<
          Partial<Listing>,
          "id" | "created_at" | "updated_at" | "views_count" | "deal_types" | "tech_stack" | "screenshots_urls"
        > &
          Pick<
            Listing,
            | "seller_id"
            | "platform"
            | "category_label"
            | "completion_pct"
            | "asking_price_gbp"
            | "public_summary"
          > & {
            deal_types?: string[];
            tech_stack?: string[];
            screenshots_urls?: string[];
          };
        Update: Partial<Listing>;
        Relationships: [];
      };
      listing_nda_access: {
        Row: ListingNdaAccess;
        Insert: Partial<ListingNdaAccess> & Pick<ListingNdaAccess, "listing_id" | "user_id">;
        Update: Partial<ListingNdaAccess>;
        Relationships: [];
      };
      nda_requests: {
        Row: NdaRequest;
        Insert: Omit<Partial<NdaRequest>, "id" | "created_at" | "updated_at"> &
          Pick<NdaRequest, "listing_id" | "buyer_id" | "seller_id">;
        Update: Partial<NdaRequest>;
        Relationships: [];
      };
      seller_settings: {
        Row: SellerSettings;
        Insert: Partial<SellerSettings> & Pick<SellerSettings, "seller_id">;
        Update: Partial<SellerSettings>;
        Relationships: [];
      };
      deals: {
        Row: Deal;
        Insert: Omit<Partial<Deal>, "id" | "created_at" | "updated_at"> &
          Pick<Deal, "listing_id" | "buyer_id" | "seller_id" | "deal_type" | "agreed_price_gbp">;
        Update: Partial<Deal>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Omit<Partial<Message>, "id" | "created_at"> & Pick<Message, "deal_id" | "sender_id" | "body">;
        Update: Partial<Message>;
        Relationships: [];
      };
      audit_log: {
        Row: AuditLog;
        Insert: Omit<Partial<AuditLog>, "id" | "created_at"> & Pick<AuditLog, "action" | "entity_type">;
        Update: Partial<AuditLog>;
        Relationships: [];
      };
      sar_flags: {
        Row: SarFlag;
        Insert: Omit<Partial<SarFlag>, "id" | "created_at"> & Pick<SarFlag, "entity_type" | "flag_reason">;
        Update: Partial<SarFlag>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_listing_views: {
        Args: {
          listing_id: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

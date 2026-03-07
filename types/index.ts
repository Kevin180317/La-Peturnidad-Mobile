// types/index.ts
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
  postal_code: string;
  city: string;
  profile_picture_url: string | null;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  type: "perro" | "gato";
  color: string;
  size: string;
  features?: string;
  image_url: string | null;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  user_id: string;
  pet_name: string;
  type: string;
  description: string;
  last_seen_location: string;
  disappearance_date: string;
  image_url: string | null;
  created_at: string;
}

export interface EmergencyAlertWithOwner extends EmergencyAlert {
  owner_name: string;
  owner_phone: string;
  owner_address: string;
}

export interface FoundPet {
  id: string;
  pet_id: string;
  user_id: string;
  created_at: string;
}

export interface FoundPetWithDetails {
  id: string;
  pet_id: string;
  pet_name: string;
  image_url: string | null;
  created_at: string;
}

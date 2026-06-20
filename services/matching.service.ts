import { type ServiceResult } from "@/types";
import { supabase } from "@/utils/supabase";

interface MatchResult {
  alert_id: string;
  alert_pet_name: string;
  alert_owner_id: string;
  alert_owner_name: string;
  alert_owner_phone: string;
  alert_image_url: string | null;
  found_pet_id: string;
  found_reporter_id: string;
  found_pet_name: string;
  found_image_url: string | null;
  score: number;
  reasons: string[];
}

class MatchingService {
  async findMatches(): Promise<ServiceResult<MatchResult[]>> {
    try {
      const { data: alerts } = await supabase
        .from("emergency_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: foundPets } = await supabase
        .from("found_pets")
        .select("*, pets(*)")
        .order("created_at", { ascending: false });

      if (!alerts || !foundPets) return { success: true, data: [] };

      const matches: MatchResult[] = [];

      for (const alert of alerts) {
        for (const found of foundPets) {
          const pet = (found as any).pets;
          if (!pet) continue;

          const score: number[] = [];
          const reasons: string[] = [];

          if (alert.pet_name.toLowerCase() === pet.name.toLowerCase()) {
            score.push(30);
            reasons.push("Mismo nombre");
          }

          if (alert.type === pet.type) {
            score.push(20);
            reasons.push("Mismo tipo");
          }

          if (alert.last_seen_location && pet.features) {
            const locLower = alert.last_seen_location.toLowerCase();
            const featLower = pet.features.toLowerCase();
            if (locLower.includes(featLower) || featLower.includes(locLower)) {
              score.push(15);
              reasons.push("Misma ubicación/color");
            }
          }

          if (alert.image_url && pet.image_url) {
            score.push(10);
            reasons.push("Ambos tienen foto");
          }

          if (score.length > 0) {
            const { data: ownerProfile } = await supabase
              .from("user_profiles")
              .select("first_name, last_name, phone")
              .eq("user_id", alert.user_id)
              .single();

            matches.push({
              alert_id: alert.id,
              alert_pet_name: alert.pet_name,
              alert_owner_id: alert.user_id,
              alert_owner_name:
                ownerProfile
                  ? `${ownerProfile.first_name || ""} ${ownerProfile.last_name || ""}`.trim()
                  : "Usuario",
              alert_owner_phone: ownerProfile?.phone || "No disponible",
              alert_image_url: alert.image_url,
              found_pet_id: found.id,
              found_reporter_id: found.user_id,
              found_pet_name: pet.name,
              found_image_url: pet.image_url,
              score: score.reduce((a, b) => a + b, 0),
              reasons,
            });
          }
        }
      }

      matches.sort((a, b) => b.score - a.score);

      return { success: true, data: matches };
    } catch (error: any) {
      return { success: false, error: error.message, data: [] };
    }
  }
}

export const matchingService = new MatchingService();

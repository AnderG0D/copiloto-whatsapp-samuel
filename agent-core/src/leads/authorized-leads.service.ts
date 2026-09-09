import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthorizedLeadsService {
  private readonly logger = new Logger(AuthorizedLeadsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async isAuthorized(businessId: string, phone: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('authorized_leads')
        .select('business_id, phone, is_active')
        .eq('business_id', businessId)
        .eq('phone', phone)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        this.logger.warn(
          `Lead authorization denied: ${error?.message ?? 'authorized_lead_not_found'}`,
        );
        return false;
      }

      return (
        data.business_id === businessId &&
        data.phone === phone &&
        data.is_active === true
      );
    } catch (error) {
      this.logger.error(
        `Lead authorization lookup failed: ${
          error instanceof Error ? error.message : 'unknown_error'
        }`,
      );
      return false;
    }
  }
}

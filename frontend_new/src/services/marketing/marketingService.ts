import axios from 'axios';
import { MarketingCampaign, CampaignAd } from '@/types/marketing';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/v1/marketing/campaigns';

export const marketingService = {
  getCampaigns: async (accessToken: string) => {
    const response = await axios.get<MarketingCampaign[]>(API_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  createCampaign: async (campaign: MarketingCampaign, accessToken: string) => {
    const response = await axios.post<MarketingCampaign>(API_URL, campaign, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  getCampaignById: async (id: number, accessToken: string) => {
    const response = await axios.get<MarketingCampaign>(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  getAdsByCampaign: async (campaignId: number, accessToken: string) => {
    const response = await axios.get<CampaignAd[]>(`${API_URL}/${campaignId}/ads`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  },

  createAd: async (campaignId: number, ad: CampaignAd, accessToken: string) => {
    const response = await axios.post<CampaignAd>(`${API_URL}/${campaignId}/ads`, ad, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.data;
  }
};

const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request('GET', endpoint);
  }

  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  async startScraper(company, jobTitles = []) {
    return this.post('/campaigns/start-scraper', { company, jobTitles });
  }

  async getScraperStatus(campaignId) {
    return this.get(`/campaigns/${campaignId}/scraper-status`);
  }

  async uploadEmailList(campaignId, emails) {
    return this.post(`/campaigns/${campaignId}/upload-emails`, { emails });
  }

  async generateEmails(campaignId, companyInfo, tone = 'professional') {
    return this.post(`/campaigns/${campaignId}/generate-emails`, { companyInfo, tone });
  }

  async sendCampaign(campaignId) {
    return this.post(`/campaigns/${campaignId}/send`, {});
  }

  async getCampaignAnalytics(campaignId) {
    return this.get(`/campaigns/${campaignId}/analytics`);
  }

  async getResponses(campaignId) {
    return this.get(`/campaigns/${campaignId}/responses`);
  }

  async markAsResponded(campaignId, emailId) {
    return this.put(`/campaigns/${campaignId}/emails/${emailId}/respond`, {});
  }

  async getQueueStatus() {
    return this.get('/queue/status');
  }
}

export const api = new APIClient(API_URL);

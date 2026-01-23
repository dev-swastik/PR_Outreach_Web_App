import { getSupabaseClient } from './supabase.js';
import { sendEmailWithTracking } from './resend.service.js';

/**
 * Rate Limiter Configuration
 *
 * Safe sending limits to protect sender reputation:
 * - Resend free tier: 100 emails/day, 1 email/second
 * - Recommended for cold outreach: 50-100 emails/day
 * - Spacing: 30-60 seconds between emails to appear human
 *
 * Production recommendations:
 * - Start with 20-30 emails/day for new domains
 * - Gradually increase as reputation builds
 * - Monitor bounce rates (keep under 5%)
 * - Track spam complaints (keep under 0.1%)
 */

const RATE_LIMITS = {
  // Maximum emails per minute (conservative)
  emailsPerMinute: 2,

  // Delay between individual emails (milliseconds)
  delayBetweenEmails: 30000, // 30 seconds

  // Maximum emails per day
  maxEmailsPerDay: 100,

  // Maximum concurrent sends
  maxConcurrent: 1
};

class RateLimiter {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.emailsSentToday = 0;
    this.lastResetDate = new Date().toDateString();
    this.currentlySending = 0;
  }

  /**
   * Reset daily counter if it's a new day
   */
  checkDailyReset() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.emailsSentToday = 0;
      this.lastResetDate = today;
      console.log('Daily email counter reset');
    }
  }

  /**
   * Add email to sending queue
   */
  async queueEmail(emailData) {
    this.checkDailyReset();

    // Check daily limit
    if (this.emailsSentToday >= RATE_LIMITS.maxEmailsPerDay) {
      throw new Error(`Daily email limit reached (${RATE_LIMITS.maxEmailsPerDay}). Please try again tomorrow.`);
    }

    this.queue.push(emailData);
    console.log(`Email queued. Queue size: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return {
      queued: true,
      position: this.queue.length,
      estimatedWaitTime: this.queue.length * (RATE_LIMITS.delayBetweenEmails / 1000)
    };
  }

  /**
   * Process the email queue with rate limiting
   */
  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    console.log('Starting queue processor...');

    while (this.queue.length > 0) {
      this.checkDailyReset();

      // Check if we've hit daily limit
      if (this.emailsSentToday >= RATE_LIMITS.maxEmailsPerDay) {
        console.log('Daily limit reached. Pausing queue until tomorrow.');
        break;
      }

      // Check concurrent limit
      if (this.currentlySending >= RATE_LIMITS.maxConcurrent) {
        await this.sleep(1000);
        continue;
      }

      const emailData = this.queue.shift();
      this.currentlySending++;

      // Send email
      try {
        await this.sendEmail(emailData);
        this.emailsSentToday++;
        console.log(`Email sent. Total today: ${this.emailsSentToday}/${RATE_LIMITS.maxEmailsPerDay}`);
      } catch (error) {
        console.error('Failed to send email:', error);
      }

      this.currentlySending--;

      // Wait before sending next email (rate limiting)
      if (this.queue.length > 0) {
        console.log(`Waiting ${RATE_LIMITS.delayBetweenEmails / 1000} seconds before next email...`);
        await this.sleep(RATE_LIMITS.delayBetweenEmails);
      }
    }

    this.processing = false;
    console.log('Queue processor finished');
  }

  /**
   * Send individual email
   */
  async sendEmail(emailData) {
    const { to, subject, html, emailId, campaignId } = emailData;

    console.log(`Sending email to ${to}...`);

    const result = await sendEmailWithTracking(to, subject, html, emailId);

    if (result.success) {
      // Update campaign sent count
      const supabase = getSupabaseClient();
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('sent_count')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        await supabase
          .from('campaigns')
          .update({
            sent_count: (campaign.sent_count || 0) + 1
          })
          .eq('id', campaignId);
      }
    }

    return result;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue status
   */
  getStatus() {
    this.checkDailyReset();
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      emailsSentToday: this.emailsSentToday,
      dailyLimit: RATE_LIMITS.maxEmailsPerDay,
      remainingToday: RATE_LIMITS.maxEmailsPerDay - this.emailsSentToday,
      currentlySending: this.currentlySending
    };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export { rateLimiter, RATE_LIMITS };

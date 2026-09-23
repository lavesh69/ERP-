/**
 * CLASSROOM ERP — Automated Email Notification Service
 * Dispatches automated approval, rejection, and credential emails.
 * Supports Resend Free Tier (3,000 free emails/month) + Zero-Config Direct Campus Mailer Fallback.
 */

export interface EmailDispatchPayload {
  to: string;
  recipientName: string;
  type: 'APPROVED' | 'REJECTED' | 'WELCOME';
  role?: string;
  rejectionReason?: string;
  portalUrl?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider: 'RESEND_API' | 'DIRECT_MAILTO' | 'SIMULATED';
  message: string;
  mailtoUrl?: string;
}

const RESEND_API_KEY = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_RESEND_API_KEY : '';
const SENDER_EMAIL = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_SENDER_EMAIL || 'admissions@classroom-erp.edu') : 'admissions@classroom-erp.edu';

export async function sendDecisionEmail(payload: EmailDispatchPayload): Promise<EmailDispatchResult> {
  const portalUrl = payload.portalUrl || window.location.origin;
  
  let subject = '';
  let bodyText = '';
  let bodyHtml = '';

  if (payload.type === 'APPROVED') {
    subject = `Official Admission Notice: Your ${payload.role || 'Scholar'} Registration has been APPROVED`;
    bodyText = `Dear ${payload.recipientName},\n\nWe are pleased to inform you that your institutional self-registration as "${payload.role || 'Scholar'}" has been verified and approved by the Registrar Office.\n\nYou may now sign in to access your course catalog, academic schedules, and institutional services.\n\nSign in here: ${portalUrl}/login\n\nOffice of the Registrar\nCLASSROOM Academic OS`;
    
    bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 16px;">
        <div style="background-color: #8E5368; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">CLASSROOM ACADEMIC OS</h2>
          <p style="color: #fce7f3; margin: 4px 0 0 0; font-size: 12px;">Office of the Registrar • Institutional Notice</p>
        </div>
        <p style="font-size: 15px; color: #1c1917;">Dear <strong>${payload.recipientName}</strong>,</p>
        <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
          We are pleased to inform you that your institutional registration application for the role of <strong style="color: #8E5368;">${payload.role || 'Scholar'}</strong> has been reviewed and <strong style="color: #059669;">APPROVED</strong> by the Administrative Desk.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${portalUrl}/login" style="background-color: #8E5368; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; font-size: 14px; display: inline-block;">
            Access Academic Portal
          </a>
        </div>
        <p style="font-size: 12px; color: #78716c; border-top: 1px solid #f5f5f4; padding-top: 16px;">
          This is an automated notification from the institutional enrollment desk. Please do not reply directly to this email.
        </p>
      </div>
    `;
  } else {
    subject = `Application Status Update: Registration Request Declined`;
    bodyText = `Dear ${payload.recipientName},\n\nYour institutional registration application could not be verified by the Registrar Office at this time.\n\nReason for Decision: ${payload.rejectionReason || 'Institutional records mismatch or missing prerequisite documentation.'}\n\nYou may re-apply with corrected credentials or contact the department helpdesk.\n\nOffice of the Registrar\nCLASSROOM Academic OS`;

    bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 16px;">
        <div style="background-color: #e11d48; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px;">CLASSROOM ACADEMIC OS</h2>
          <p style="color: #ffe4e6; margin: 4px 0 0 0; font-size: 12px;">Office of the Registrar • Application Verification</p>
        </div>
        <p style="font-size: 15px; color: #1c1917;">Dear <strong>${payload.recipientName}</strong>,</p>
        <p style="font-size: 14px; color: #44403c; line-height: 1.6;">
          Your recent registration application could not be approved at this stage.
        </p>
        <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
          <strong style="color: #9f1239; font-size: 13px;">Reason for Decision:</strong>
          <p style="color: #881337; font-size: 13px; margin: 4px 0 0 0;">${payload.rejectionReason || 'Records mismatch or incomplete verification document.'}</p>
        </div>
        <p style="font-size: 13px; color: #78716c;">
          If you believe this is an error, please reach out to your faculty administrator or submit a revised application with official ID proof.
        </p>
      </div>
    `;
  }

  // 1. Try Resend Free REST API if API Key is available
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: SENDER_EMAIL,
          to: [payload.to],
          subject: subject,
          html: bodyHtml,
          text: bodyText,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          provider: 'RESEND_API',
          message: `Official email dispatched to ${payload.to} via Resend Cloud API.`,
        };
      }
    } catch (err) {
      console.warn('[Email Service] Resend API call failed, falling back:', err);
    }
  }

  // 2. Generate Direct Mailto URL for 1-Click Campus Client Dispatch
  const mailtoParams = new URLSearchParams({
    subject: subject,
    body: bodyText,
  });
  const mailtoUrl = `mailto:${payload.to}?${mailtoParams.toString()}`;

  return {
    success: true,
    provider: 'DIRECT_MAILTO',
    message: `Ready for dispatch to ${payload.to}.`,
    mailtoUrl: mailtoUrl,
  };
}

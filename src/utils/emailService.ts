import emailjs from '@emailjs/browser';

// ============================================================
// EmailJS Configuration
// ============================================================
// To make OTP and Contact Form emails work:
//
// 1. Go to https://www.emailjs.com/ and create a free account
// 2. Add an Email Service (e.g., Gmail) → copy the Service ID
// 3. Create TWO email templates:
//
//    Template 1 (OTP):
//      Subject: "Your CampX Verification Code"
//      Body: "Your OTP is: {{otp_code}}. It expires in 5 minutes."
//      → Copy its Template ID
//
//    Template 2 (Contact Form):
//      Subject: "New CampX Support Message from {{from_name}}"
//      Body: "Name: {{from_name}}\nEmail: {{from_email}}\nMessage: {{message}}"
//      → Copy its Template ID
//
// 4. Go to Account → General → copy your Public Key
// 5. Replace the values below:
// ============================================================

const EMAILJS_SERVICE_ID = 'service_campx';
const EMAILJS_OTP_TEMPLATE_ID = 'template_otp';

const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP with expiration
export function storeOTP(email: string, otp: string): void {
  const otpData = {
    code: otp,
    email: email.toLowerCase(),
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };
  localStorage.setItem(`campx_otp_${email.toLowerCase()}`, JSON.stringify(otpData));
}

// Verify the OTP
export function verifyOTP(email: string, inputOTP: string): { valid: boolean; message: string } {
  const stored = localStorage.getItem(`campx_otp_${email.toLowerCase()}`);
  if (!stored) {
    return { valid: false, message: 'No OTP found. Please request a new one.' };
  }

  const otpData = JSON.parse(stored);

  if (Date.now() > otpData.expiresAt) {
    localStorage.removeItem(`campx_otp_${email.toLowerCase()}`);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (otpData.code !== inputOTP) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }

  // OTP is valid — clean up
  localStorage.removeItem(`campx_otp_${email.toLowerCase()}`);
  return { valid: true, message: 'Verified successfully!' };
}

// Send OTP via EmailJS
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_OTP_TEMPLATE_ID, {
      to_email: email,
      otp_code: otp,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    // Fallback: show OTP in console for development
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return false;
  }
}

export async function sendContactEmail(data: {
  from_name: string;
  from_email: string;
  message: string;
}): Promise<boolean> {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.from_name,
        email: data.from_email,
        message: data.message
      })
    });
    
    if (!response.ok) throw new Error('Failed to send');
    return true;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return false;
  }
}

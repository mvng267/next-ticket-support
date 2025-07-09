/**
 * Validation cho environment variables
 */
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'HUBSPOT_API_KEY',
    'GEMINI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Gọi validation khi khởi động
if (typeof window === 'undefined') {
  validateEnv();
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  HUBSPOT_API_KEY: process.env.HUBSPOT_API_KEY!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  WEBHOOK_URL: process.env.WEBHOOK_URL
};
// Vercel serverless function: GET /api/health
// Used by the frontend to show the DeepSeek connection status badge.

export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    apiKeyConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  });
}

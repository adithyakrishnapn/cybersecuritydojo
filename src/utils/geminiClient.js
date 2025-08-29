// src/utils/geminiClient.js
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function generatePhishingLinks(count = 6) {
  try {
    const prompt = `Generate exactly ${count} example website links for a phishing awareness game. 
    Return ONLY a JSON array of objects with this structure: 
    [{text: "example.com", isPhish: boolean, explanation: "brief explanation"}] 
    
    Requirements:
    - ${Math.round(count * 0.6)} should be phishing examples
    - ${Math.round(count * 0.4)} should be legitimate examples
    - Phishing examples should show common tactics: typosquatting, suspicious TLDs, hyphens, etc.
    - Legitimate examples should be well-known trustworthy sites
    - Return ONLY valid JSON, no other text`;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Clean the response (remove markdown code blocks if present)
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    try {
      const links = JSON.parse(cleanText);
      return links.slice(0, count);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Response:", text);
      return getDefaultLinks().slice(0, count);
    }
  } catch (error) {
    console.error("Error generating phishing links:", error);
    return getDefaultLinks().slice(0, count);
  }
}

export async function generateEducationalContent(topic, score, totalAttempts) {
  try {
    let prompt;
    
    if (topic === "phishing") {
      prompt = `Create educational content about phishing awareness for someone who scored ${score} out of ${totalAttempts} in a phishing detection game.
      Focus on: common phishing techniques, how to spot suspicious URLs, and best practices.
      Return HTML-formatted content with <h3>, <p>, <ul>, <li> tags. Keep it concise and engaging (about 150 words).`;
    } else {
      prompt = `Create educational content about password security for someone who ${score > 70 ? 'did well' : 'needs improvement'} in a password strength game.
      Focus on: password best practices, common vulnerabilities, and creating strong passwords.
      Return HTML-formatted content with <h3>, <p>, <ul>, <li> tags. Keep it concise and engaging (about 150 words).`;
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating educational content:", error);
    return getFallbackContent(topic);
  }
}

// Fallback functions (same as before)
function getDefaultLinks() {
  return [
    { text: "paypal-login.com", isPhish: true, explanation: "Typosquatting - mimics PayPal but wrong domain" },
    { text: "google.com", isPhish: false, explanation: "Legitimate Google domain" },
    { text: "amaz0n-support.net", isPhish: true, explanation: 'Uses "0" instead of "o" and wrong TLD' },
    { text: "microsoft.com", isPhish: false, explanation: "Legitimate Microsoft domain" },
    { text: "bank-secure-login.net", isPhish: true, explanation: "Attempts to mimic bank login with suspicious TLD" },
    { text: "github.com", isPhish: false, explanation: "Legitimate GitHub domain" },
    { text: "apple-verify-account.com", isPhish: true, explanation: "Uses brand name with hyphens for phishing" },
    { text: "netflix.com", isPhish: false, explanation: "Legitimate Netflix domain" }
  ];
}

function getFallbackContent(topic) {
  if (topic === "phishing") {
    return `
      <h3>🎓 Phishing Awareness Tips</h3>
      <p>Phishing attacks try to trick you into revealing sensitive information. Here's how to stay safe:</p>
      <ul>
        <li>Check URLs carefully for misspellings or wrong domains</li>
        <li>Look for HTTPS and security indicators</li>
        <li>Be wary of urgent or threatening language</li>
        <li>Never enter credentials on unfamiliar sites</li>
        <li>Use multi-factor authentication when available</li>
      </ul>
    `;
  } else {
    return `
      <h3>🎓 Password Security Best Practices</h3>
      <p>Strong passwords are your first line of defense:</p>
      <ul>
        <li>Use at least 12 characters with mixed character types</li>
        <li>Avoid common words, patterns, or personal information</li>
        <li>Use a unique password for each important account</li>
        <li>Consider using a password manager</li>
        <li>Enable two-factor authentication whenever possible</li>
      </ul>
    `;
  }
}
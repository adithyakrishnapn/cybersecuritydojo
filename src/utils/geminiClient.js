// src/utils/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "your-api-key-here";
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to generate phishing links
export async function generatePhishingLinks(count = 6) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Generate ${count} website links for a cybersecurity educational game. 
      Return a JSON array where each object has:
      - "text": the website URL (mix of legitimate and phishing examples)
      - "isPhish": boolean (true for phishing, false for legitimate)
      - "explanation": short explanation why it's phishing or legitimate
      
      Phishing examples should include techniques like:
      - Typosquatting (amaz0n.com instead of amazon.com)
      - Wrong TLDs (paypal.security-update.net instead of paypal.com)
      - Subdomain tricks (google.com.login-security.xyz)
      - HTTPS deception (secure-https-bank.com)
      
      Legitimate examples should be well-known reputable sites.
      
      Return ONLY valid JSON, no other text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("No JSON found in response");
  } catch (error) {
    console.error("Error generating phishing links:", error);
    // Fallback to default links
    return [
      { text: "paypal-login.com", isPhish: true, explanation: "Typosquatting - mimics PayPal but wrong domain" },
      { text: "google.com", isPhish: false, explanation: "Legitimate Google domain" },
      { text: "amaz0n-support.net", isPhish: true, explanation: 'Uses "0" instead of "o" and wrong TLD' },
      { text: "microsoft.com", isPhish: false, explanation: "Legitimate Microsoft domain" },
      { text: "bank-secure-login.net", isPhish: true, explanation: "Attempts to mimic bank login with suspicious TLD" },
      { text: "github.com", isPhish: false, explanation: "Legitimate GitHub domain" }
    ];
  }
}

// Function to generate educational content
export async function generateEducationalContent(gameType, score, totalQuestions) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    let prompt = "";
    if (gameType === "phishing") {
      prompt = `
        Create educational content about phishing awareness for someone who scored ${score} out of ${totalQuestions} in a phishing detection game.
        Provide tips to identify phishing attempts, common techniques used by attackers, and best practices for staying safe online.
        Format the response in HTML with headings, bullet points, and key points emphasized.
        Keep it concise (around 200 words) and engaging.
      `;
    } else if (gameType === "password") {
      prompt = `
        Create educational content about password security for someone who defended a fortress in a password strength game.
        Provide tips for creating strong passwords, common password mistakes to avoid, and best practices for password management.
        Format the response in HTML with headings, bullet points, and key points emphasized.
        Keep it concise (around 200 words) and engaging.
      `;
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating educational content:", error);
    
    // Fallback content
    if (gameType === "phishing") {
      return `
        <h3>Phishing Awareness Tips</h3>
        <p>Phishing attacks attempt to trick you into revealing sensitive information. Here's how to stay safe:</p>
        <ul>
          <li><strong>Check URLs carefully</strong> - Look for misspellings or wrong domains</li>
          <li><strong>Be wary of urgent requests</strong> - Legitimate companies rarely need immediate action</li>
          <li><strong>Don't click suspicious links</strong> - Hover to see the actual URL first</li>
          <li><strong>Look for HTTPS</strong> - But remember, attackers can get SSL certificates too</li>
          <li><strong>Verify unexpected messages</strong> - Contact the company through official channels</li>
        </ul>
      `;
    } else {
      return `
        <h3>Password Security Tips</h3>
        <p>Strong passwords are your first line of defense. Follow these best practices:</p>
        <ul>
          <li><strong>Use long passwords</strong> - At least 12 characters</li>
          <li><strong>Mix character types</strong> - Upper/lowercase, numbers, symbols</li>
          <li><strong>Avoid common words</strong> - Don't use dictionary words or personal info</li>
          <li><strong>Use unique passwords</strong> - Different for each account</li>
          <li><strong>Consider a password manager</strong> - For generating and storing strong passwords</li>
        </ul>
      `;
    }
  }
}
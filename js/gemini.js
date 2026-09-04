/* ============================================================
   gemini.js
  
   ============================================================
   >>> INSERT API KEY HERE <<<
   Get a free key from https://aistudio.google.com/apikey
   and paste it below. Fine for a hackathon demo; swap to a
   backend proxy before shipping anything real, since this key
   is visible in the browser's page source.
   ============================================================ */

// Reads the key from config.js if that file exists (window.GEMINI_API_KEY),
// and safely falls back to an empty string if config.js is missing entirely —
// e.g. on GitHub Pages, where config.js is gitignored and never gets deployed.
const GEMINI_API_KEY = window.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * @param {string} text     free-text sentence describing the expense
 * @param {string[]} members  the group's members, so Gemini can
 *        match names to real options instead of guessing
 */
async function parseExpenseWithGemini(text, members) {
    if (!GEMINI_API_KEY) {
        return parseExpenseLocally(text, members);
    }

    const prompt = `
You convert a short sentence about a shared expense into JSON.
Group members available: ${JSON.stringify(members)}.
Sentence: "${text}"

Return ONLY a JSON object, no other text, in exactly this shape:
{"description": string, "amount": number, "paidBy": one of the members,
 "splitBetween": array of members}
If the sentence says "split between all" or similar, include every member.
If a name in the sentence isn't an exact member match, pick the closest one.
`.trim();

    try {
        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = rawText.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch (err) {
        console.error("Gemini parsing failed, falling back to local parser.", err);
        return parseExpenseLocally(text, members);
    }
}

/**
 * Small rule-based fallback so the feature still works with no API key.
 * Handles things like "Disha paid 1200 for dinner split between all 4".
 */
function parseExpenseLocally(text, members) {
    const amountMatch = text.match(/(\d+(\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    const paidBy =
        members.find(m => text.toLowerCase().includes(m.toLowerCase())) || members[0];

    const forMatch = text.match(/for\s+([a-zA-Z ]+?)(\s+split|\s*$)/i);
    const description = forMatch ? forMatch[1].trim() : "Expense";

    const splitBetween = /all|everyone/i.test(text) ? members : [paidBy];

    return { description, amount, paidBy, splitBetween };
}
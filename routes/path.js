const express = require('express');
const axios = require('axios');

const careerRouter = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

const generateCareerAdvice = async (domain, results) => {
    const summarizedResults = results.map((r, i) => 
      `Q${i + 1}: ${r.question}\nYour Answer: ${r.selected}\nCorrect Answer: ${r.correct}\nResult: ${r.isCorrect ? "Correct" : "Incorrect"}`
    ).join("\n\n");
  
    const prompt = `
  The following are quiz results for a user in the domain "${domain}". Suggest a suitable tech career path based on their performance:
  
  ${summarizedResults}
  
  Give concise and practical advice in 2-3 sentences.
  `;
  
    try {
      const response = await axios.post(GEMINI_URL, {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      });
  
      const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      return textResponse?.trim() || "No recommendation available.";
    } catch (error) {
      console.error("Gemini error:", error.response?.data || error.message);
      return "Could not generate career advice. Try again later.";
    }
  };
  

careerRouter.post('/careeradvice', async (req, res) => {
  const { domain, results } = req.body;

  if (!domain || !results) {
    return res.status(400).json({ error: "Missing domain or results in request body." });
  }

  const advice = await generateCareerAdvice(domain, results);
  res.json({ advice });
});

module.exports = careerRouter;

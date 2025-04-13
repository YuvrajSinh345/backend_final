const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// System prompt for resume analysis
const SYSTEM_PROMPT = `You are an expert resume analyzer and ATS (Applicant Tracking System) specialist. 
Analyze the provided resume and provide a detailed analysis in the following format:

ATS SCORE: [number between 0-100]

STRENGTHS:
- [List key strengths, one per line with hyphen prefix]

AREAS FOR IMPROVEMENT:
- [List areas needing improvement, one per line with hyphen prefix]

SUGGESTIONS:
- [List specific suggestions for optimization, one per line with hyphen prefix]

Focus on:
- Keyword optimization
- Formatting and structure
- Content relevance
- Professional experience presentation
- Education and skills presentation
- ATS compatibility factors

Provide specific, actionable feedback.`;

router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Convert file buffer to text (you might need a PDF/DOC parser here)
    const fileContent = req.file.buffer.toString('utf-8');

    // Prepare the request to Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${SYSTEM_PROMPT}\n\nResume Content:\n${fileContent}`
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Parse the response to extract structured data
    const analysis = parseGeminiResponse(text);

    res.json({
      success: true,
      analysis: analysis.analysis,
      atsScore: analysis.atsScore
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze resume',
      error: error.message
    });
  }
});

// Helper function to parse Gemini's response
function parseGeminiResponse(text) {
  console.log('Raw response:', text); // Debug log

  // Extract ATS score
  const atsScoreMatch = text.match(/ATS SCORE:\s*(\d+)/i);
  const atsScore = atsScoreMatch ? parseInt(atsScoreMatch[1]) : 0;

  // Extract strengths
  const strengthsMatch = text.match(/STRENGTHS:([\s\S]*?)(?=AREAS FOR IMPROVEMENT|$)/i);
  const strengths = strengthsMatch 
    ? strengthsMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(s => s.replace('-', '').trim())
    : [];

  // Extract improvements
  const improvementsMatch = text.match(/AREAS FOR IMPROVEMENT:([\s\S]*?)(?=SUGGESTIONS|$)/i);
  const improvements = improvementsMatch 
    ? improvementsMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(i => i.replace('-', '').trim())
    : [];

  // Extract suggestions
  const suggestionsMatch = text.match(/SUGGESTIONS:([\s\S]*?)$/i);
  const suggestions = suggestionsMatch 
    ? suggestionsMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(s => s.replace('-', '').trim())
    : [];

  // Debug logs
  console.log('Parsed ATS Score:', atsScore);
  console.log('Parsed Strengths:', strengths);
  console.log('Parsed Improvements:', improvements);
  console.log('Parsed Suggestions:', suggestions);

  return {
    analysis: {
      strengths,
      improvements,
      suggestions
    },
    atsScore
  };
}

module.exports = router; 
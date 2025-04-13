const express = require('express');
const quizRouter = express.Router();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Generate quiz questions
quizRouter.post('/generate', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { domain } = req.body;
    
    if (!domain) {
      console.error('No domain object in request');
      return res.status(400).json({ error: 'No domain object provided' });
    }

    if (!domain.skills || !Array.isArray(domain.skills)) {
      console.error('Invalid skills array:', domain.skills);
      return res.status(400).json({ error: 'Invalid skills array in domain object' });
    }

    // Get all skills from the array
    const skills = domain.skills.map(skill => skill.name).filter(Boolean);
    if (skills.length === 0) {
      console.error('No valid skills found');
      return res.status(400).json({ error: 'No valid skills provided' });
    }

    // Generate questions for each skill
    const allQuestions = [];
    for (const skill of skills) {
      const prompt = `You're a quiz generator. Generate 5 multiple choice questions about ${skill}.
      Each question should have 4 options and one correct answer.
      Format the response as a JSON array of objects with the following structure:
      [
        {
          "id": "unique_id_1",
          "question": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correctAnswer": "correct option"
        }
      ]
      Return only the JSON array.`;

      console.log('Sending request to Gemini API for skill:', skill);
      const response = await axios.post(GEMINI_URL, {
        contents: [{
          parts: [{ text: prompt }]
        }]
      });

      const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('Received Gemini response:', textResponse);
      
      // Clean the response to get valid JSON
      const cleanJSON = (rawText) => {
        return rawText
          .replace(/```json\n?/gi, '')
          .replace(/```/g, '')
          .trim();
      };

      const cleaned = cleanJSON(textResponse);
      const questions = JSON.parse(cleaned);
      allQuestions.push(...questions);
    }
    
    res.json({ 
      success: true,
      questions: allQuestions,
      domain: {
        name: domain.name,
        profession: domain.profession,
        skills: skills
      }
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    if (error.response) {
      console.error('Gemini API Error:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to generate quiz questions',
      details: error.message 
    });
  }
});

// Evaluate quiz answers
quizRouter.post('/evaluate', async (req, res) => {
  try {
    const { name, skill, answers } = req.body;

    // Get the questions again to verify answers
    const prompt = `You're a quiz generator. Generate 10 multiple choice questions about ${skill}.
    Each question should have 4 options and one correct answer.
    Format the response as a JSON array of objects with the following structure:
    [
      {
        "id": "unique_id_1",
        "question": "question text",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": "correct option"
      },
      {
        "id": "unique_id_2",
        "question": "question text",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": "correct option"
      }
    ]
    Return only the JSON array.`;

    const response = await axios.post(GEMINI_URL, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    });

    const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Clean the response to get valid JSON
    const cleanJSON = (rawText) => {
      return rawText
        .replace(/```json\n?/gi, '')
        .replace(/```/g, '')
        .trim();
    };

    const cleaned = cleanJSON(textResponse);
    const questions = JSON.parse(cleaned);
    
    // Calculate score
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);

    // Store the result in database (optional)
    // await storeQuizResult(name, skill, score);

    res.json({ score });
  } catch (error) {
    console.error('Error evaluating quiz:', error);
    res.status(500).json({ error: 'Failed to evaluate quiz' });
  }
});

module.exports = quizRouter;

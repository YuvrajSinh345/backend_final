const express = require('express');
const chatRouter = express.Router();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SEARCH_API_KEY = process.env.SEARCH_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}
if (!SEARCH_API_KEY) {
  console.error('SEARCH_API_KEY is not set in environment variables');
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
const SEARCH_API_URL = 'https://www.searchapi.io/api/v1/search';

// System prompt to guide the chatbot's behavior
const SYSTEM_PROMPT = `You are a career assessment assistant with web search capabilities. Your role is to:
1. Help users identify their skills and interests
2. Provide career path suggestions based on their skills
3. Generate relevant quiz questions to assess their knowledge
4. Offer guidance on skill development
5. Keep responses concise and focused on career development
6. Use web search results to provide up-to-date information

When using web search results:
- Cite sources when providing information
- Summarize key points from multiple sources
- Focus on recent and relevant information
- Format your response with markdown for better readability

Format your responses in a friendly, conversational tone while maintaining professionalism.`;

async function performWebSearch(query) {
  try {
    const response = await axios.get(SEARCH_API_URL, {
      params: {
        engine: 'google',
        q: query,
        api_key: SEARCH_API_KEY,
        num: 5 // Number of results to fetch
      }
    });

    return response.data.organic_results.map(result => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet
    }));
  } catch (error) {
    console.error('Search API error:', error);
    return [];
  }
}

chatRouter.post('/', async (req, res) => {
  try {
    console.log('Received chat request:', req.body);
    const { message } = req.body;
    
    if (!message) {
      console.error('No message provided in request');
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!GEMINI_API_KEY || !SEARCH_API_KEY) {
      console.error('API keys are missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Perform web search
    const searchResults = await performWebSearch(message);
    let searchContext = '';
    
    if (searchResults.length > 0) {
      searchContext = '\n\nRecent web search results:\n' + 
        searchResults.map((result, index) => 
          `[${index + 1}] ${result.title}\n${result.snippet}\nSource: ${result.link}`
        ).join('\n\n');
    }

    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${message}${searchContext}\n\nAssistant:`;
    console.log('Sending prompt to Gemini:', prompt);

    const response = await axios.post(GEMINI_URL, {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Gemini API response:', response.data);

    const textResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      console.error('No text response from Gemini API');
      throw new Error('No response from Gemini API');
    }

    console.log('Sending response to client:', textResponse);
    res.json({ 
      success: true,
      response: textResponse.trim(),
      searchResults: searchResults // Include search results in response
    });
  } catch (error) {
    console.error('Chat error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    let errorMessage = 'Failed to process chat message';
    if (error.response) {
      errorMessage = `API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`;
    } else if (error.request) {
      errorMessage = 'No response received from Gemini API';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

module.exports = chatRouter; 
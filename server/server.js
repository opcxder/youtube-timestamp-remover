const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { fetchTranscript } = require('youtube-transcript-plus');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Security middleware
app.use(express.json({ limit: '1mb' })); // Reduced limit for security
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting (basic implementation)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per window

app.use('/api', (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, { count: 1, firstRequest: now });
    return next();
  }
  
  const clientData = requestCounts.get(clientIp);
  
  if (now - clientData.firstRequest > RATE_LIMIT_WINDOW) {
    requestCounts.set(clientIp, { count: 1, firstRequest: now });
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
  
  clientData.count++;
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
  if (!url) return null;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7] && match[7].length === 11) ? match[7] : null;
}

// Helper function to decode HTML entities
function decodeHtmlEntities(text) {
  const htmlEntities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&#x3C;': '<',
    '&#x3E;': '>',
    '&#x26;': '&',
    '&#x22;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&#x3C;': '<',
    '&#x3E;': '>',
    '&#x26;': '&',
    '&#x22;': '"'
  };
  
  // First decode numeric entities
  let decoded = text.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  
  // Then decode hex entities
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Finally decode named entities
  decoded = decoded.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return htmlEntities[entity] || entity;
  });
  
  return decoded;
}

// Helper function to remove timestamps from transcript
function removeTimestamps(transcript) {
  if (!Array.isArray(transcript)) {
    return '';
  }
  return transcript
    .map(item => item.text || '')
    .join(' ')
    .trim();
}

// Helper function to clean and process transcript
function cleanTranscript(transcript) {
  if (!Array.isArray(transcript)) {
    return '';
  }
  
  return transcript
    .map(item => {
      let text = item.text || '';
      // Decode HTML entities
      text = decodeHtmlEntities(text);
      // Remove extra whitespace
      text = text.replace(/\s+/g, ' ').trim();
      return text;
    })
    .join(' ')
    .trim();
}

// Helper function to extract transcript using youtube-transcript-plus
async function extractTranscript(videoId) {
  console.log('🔍 Attempting to extract transcript for video:', videoId);
  
  try {
    console.log('📝 Fetching transcript...');
    const transcript = await fetchTranscript(videoId);
    
    if (transcript && transcript.length > 0) {
      console.log('✅ Success! Transcript length:', transcript.length);
      return transcript;
    } else {
      throw new Error('Empty transcript received');
    }
  } catch (error) {
    console.log('❌ Transcript fetch failed:', error.message);
    throw new Error(`No transcript available for this video. ${error.message}`);
  }
}

// Helper function to sanitize input
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
}

app.post('/api/remove-timestamps', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📥 Received request:', { 
      timestamp: new Date().toISOString(),
      body: req.body 
    });
    
    const { videoUrl } = req.body;
    
    // Validate and sanitize input
    if (!videoUrl || typeof videoUrl !== 'string') {
      console.log('❌ Invalid input: videoUrl missing or not a string');
      return res.status(400).json({ 
        error: 'Video URL is required and must be a valid string',
        code: 'MISSING_VIDEO_URL'
      });
    }
    
    const sanitizedUrl = sanitizeInput(videoUrl);
    if (sanitizedUrl !== videoUrl) {
      console.log('❌ Invalid input: videoUrl contains potentially harmful characters');
      return res.status(400).json({ 
        error: 'Video URL contains invalid characters',
        code: 'INVALID_URL_CHARACTERS'
      });
    }

    const videoId = extractVideoId(sanitizedUrl);
    console.log('🔍 Extracted Video ID:', videoId);

    if (!videoId) {
      console.log('❌ Invalid YouTube URL format');
      return res.status(400).json({ 
        error: 'Invalid YouTube URL format. Please provide a valid YouTube video URL.',
        code: 'INVALID_URL_FORMAT'
      });
    }

    // Check if YouTube API key is available
    if (!process.env.YOUTUBE_API_KEY) {
      console.log('❌ YouTube API key not configured');
      return res.status(500).json({ 
        error: 'Server configuration error. YouTube API key is missing.',
        code: 'MISSING_API_KEY'
      });
    }

    console.log('📡 Fetching captions...');
    const captionsResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
      { timeout: 10000 }
    );

    if (!captionsResponse.data.items || captionsResponse.data.items.length === 0) {
      console.log('❌ No captions available for video:', videoId);
      return res.status(404).json({ 
        error: 'No captions available for this video. The video may not have subtitles or they may be disabled.',
        code: 'NO_CAPTIONS_AVAILABLE'
      });
    }

     console.log('📝 Fetching transcript...');
     let transcript;
     try {
       transcript = await extractTranscript(videoId);
       console.log('✅ Transcript fetched successfully:', transcript.length, 'items');
     } catch (transcriptError) {
       console.error('❌ Error fetching transcript:', transcriptError.message);
       return res.status(500).json({ 
         error: 'Failed to fetch transcript. The video may not have available transcripts or they may be disabled.',
         code: 'TRANSCRIPT_FETCH_FAILED',
         details: process.env.NODE_ENV === 'development' ? transcriptError.message : undefined
       });
     }

    // Process transcript to remove timestamps and clean HTML entities
    const cleanedTranscript = cleanTranscript(transcript);
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Transcript processed successfully:', {
      originalLength: transcript.length,
      processedLength: cleanedTranscript.length,
      processingTime: `${processingTime}ms`
    });

    // Send successful response
    res.json({ 
      transcript: cleanedTranscript,
      videoId: videoId,
      originalLength: transcript.length,
      processedLength: cleanedTranscript.length,
      processingTime: processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Error processing request:', {
      error: error.message,
      stack: error.stack,
      processingTime: `${processingTime}ms`
    });
    
    res.status(500).json({ 
      error: 'An error occurred while processing the request', 
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : error.message
  });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🔑 YouTube API Key: ${process.env.YOUTUBE_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

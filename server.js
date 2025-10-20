const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.csv', '.txt', '.docx', '.xlsx'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, CSV, TXT, DOCX, and XLSX files are allowed.'));
        }
    }
});

// File content extraction functions
async function extractTextFromFile(filePath, originalName) {
    const extension = path.extname(originalName).toLowerCase();
    let extractedText = '';

    try {
        switch (extension) {
            case '.pdf':
                const pdfBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(pdfBuffer);
                extractedText = pdfData.text;
                break;

            case '.txt':
                extractedText = fs.readFileSync(filePath, 'utf8');
                break;

            case '.csv':
                return new Promise((resolve, reject) => {
                    const results = [];
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', (data) => results.push(data))
                        .on('end', () => {
                            const csvText = `CSV Data Summary:\nTotal rows: ${results.length}\nColumns: ${Object.keys(results[0] || {}).join(', ')}\n\nFirst few rows:\n${JSON.stringify(results.slice(0, 5), null, 2)}`;
                            resolve(csvText);
                        })
                        .on('error', reject);
                });

            case '.docx':
                const docxBuffer = fs.readFileSync(filePath);
                const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
                extractedText = docxResult.value;
                break;

            case '.xlsx':
                const workbook = xlsx.readFile(filePath);
                const sheetNames = workbook.SheetNames;
                let xlsxText = `Excel file with ${sheetNames.length} sheet(s): ${sheetNames.join(', ')}\n\n`;
                
                sheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
                    xlsxText += `Sheet: ${sheetName}\nRows: ${jsonData.length}\nData preview:\n${JSON.stringify(jsonData.slice(0, 5), null, 2)}\n\n`;
                });
                extractedText = xlsxText;
                break;

            default:
                throw new Error(`Unsupported file type: ${extension}`);
        }

        return extractedText;
    } catch (error) {
        console.error(`Error extracting text from ${originalName}:`, error);
        throw new Error(`Failed to extract content from ${originalName}: ${error.message}`);
    }
}

// Analyze content with Groq AI
async function analyzeWithGroq(content, fileName) {
    try {
        const prompt = `You are an expert AI analyst. Please analyze the following content from the file "${fileName}" and provide:

1. A comprehensive summary of the key information
2. Important insights and patterns you identify
3. Actionable recommendations based on the content
4. Any potential issues or areas of concern

Content to analyze:
${content.substring(0, 4000)}${content.length > 4000 ? '\n\n[Content truncated due to length...]' : ''}

Please format your response in a clear, structured manner with appropriate headings and bullet points.`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false
        });

        return completion.choices[0]?.message?.content || 'No analysis generated';
    } catch (error) {
        console.error('Groq API Error:', error);
        throw new Error(`AI analysis failed: ${error.message}`);
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Friday File Sense API is running' });
});

// Clear all temporary files endpoint
app.delete('/api/clear', async (req, res) => {
    try {
        const uploadDir = 'uploads/';
        
        // Clear local upload directory
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            let deletedCount = 0;
            
            files.forEach(file => {
                const filePath = path.join(uploadDir, file);
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                } catch (error) {
                    console.error(`Error deleting file ${file}:`, error);
                }
            });
            
            res.json({ 
                success: true, 
                message: `Cleared ${deletedCount} temporary files`,
                deletedFiles: deletedCount
            });
        } else {
            res.json({ 
                success: true, 
                message: 'No temporary files to clear',
                deletedFiles: 0
            });
        }
    } catch (error) {
        console.error('Clear endpoint error:', error);
        res.status(500).json({ 
            error: 'Failed to clear temporary files',
            message: error.message 
        });
    }
});

// Delete specific Groq cloud files (if you upload files to Groq for storage)
app.delete('/api/groq-files/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'Groq API key not configured' });
        }
        
        // Delete file from Groq cloud storage
        const response = await fetch(`https://api.groq.com/openai/v1/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        res.json({
            success: true,
            message: `File ${fileId} deleted from Groq cloud storage`,
            result: result
        });
        
    } catch (error) {
        console.error('Groq file deletion error:', error);
        res.status(500).json({ 
            error: 'Failed to delete file from Groq cloud',
            message: error.message 
        });
    }
});

// List all files in Groq cloud storage
app.get('/api/groq-files', async (req, res) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'Groq API key not configured' });
        }
        
        const response = await fetch('https://api.groq.com/openai/v1/files', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        res.json({
            success: true,
            files: result.data || [],
            count: result.data?.length || 0
        });
        
    } catch (error) {
        console.error('Groq files list error:', error);
        res.status(500).json({ 
            error: 'Failed to list files from Groq cloud',
            message: error.message 
        });
    }
});

// File upload and analysis endpoint
app.post('/api/analyze', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'Groq API key not configured' });
        }

        const analysisResults = [];

        for (const file of req.files) {
            try {
                console.log(`Processing file: ${file.originalname}`);
                
                // Extract text content from file
                const extractedContent = await extractTextFromFile(file.path, file.originalname);
                
                if (!extractedContent || extractedContent.trim().length === 0) {
                    analysisResults.push({
                        fileName: file.originalname,
                        error: 'No content could be extracted from this file'
                    });
                    continue;
                }

                // Analyze with Groq AI
                const analysis = await analyzeWithGroq(extractedContent, file.originalname);
                
                analysisResults.push({
                    fileName: file.originalname,
                    fileSize: file.size,
                    analysis: analysis
                });

                // Clean up uploaded file
                fs.unlinkSync(file.path);
                
            } catch (fileError) {
                console.error(`Error processing ${file.originalname}:`, fileError);
                analysisResults.push({
                    fileName: file.originalname,
                    error: fileError.message
                });
                
                // Clean up file even if processing failed
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        res.json({
            success: true,
            results: analysisResults,
            processedFiles: req.files.length
        });

    } catch (error) {
        console.error('Analysis endpoint error:', error);
        
        // Clean up any uploaded files in case of error
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        
        res.status(500).json({ 
            error: 'Server error during analysis',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Friday File Sense server running on http://localhost:${PORT}`);
    console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/analyze`);
    console.log(`🤖 AI-powered file analysis ready`);
    
    if (!process.env.GROQ_API_KEY) {
        console.warn('⚠️  WARNING: GROQ_API_KEY environment variable not set!');
        console.log('   Please create a .env file with your Groq API key:');
        console.log('   GROQ_API_KEY=your_api_key_here');
    }
});

module.exports = app;

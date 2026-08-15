# Changelog

All notable changes to DocSense AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-15

### Changed
- **Renamed the project from Friday File Sense to DocSense AI.** Package name, docs,
  UI strings, banner image, and repository URLs all updated. The GitHub repository was
  renamed too; GitHub redirects the old URL.
- **Migrated off the deprecated `llama-3.1-8b-instant` model.** Groq shuts it down on
  2026-08-16. Now defaults to `openai/gpt-oss-20b`, Groq's recommended replacement.
- **Raised `max_tokens` from 1024 to 3000.** Analyses were being truncated mid-sentence
  at the old limit. See the rate-limit note in the README before raising further — Groq's
  8,000 tokens/minute on-demand cap, not the model, is the binding constraint.
- Model and token limit are now configurable via `GROQ_MODEL` and `MAX_TOKENS` env vars,
  so a future model change needs no code edit.

### Added
- 📸 Real screenshots in the README (upload and results, light and dark).
- 📝 Markdown rendering for analysis results via `marked`, so headings, tables, and lists
  display properly instead of appearing as raw `##` and pipe-table syntax.
- 🛡️ `DOMPurify` sanitization of rendered analysis output.

### Fixed
- Analysis results showed raw markdown syntax rather than formatted content.
- The file input was missing the `multiple` attribute, so the UI accepted only one file
  at a time despite the backend and docs both supporting up to 10.
- Analysis output was silently truncated by the low `max_tokens` ceiling.

## [1.0.0] - 2024-10-19

### Added
- 🎨 Modern AI avatar with gradient animations (purple to cyan)
- 🤖 AI-powered document analysis using Groq's Llama-3.1-8B-instant
- 📄 Multi-format file support (PDF, CSV, TXT, DOCX, XLSX)
- 🌙 Dark mode with automatic theme persistence
- 📥 Drag-and-drop file upload interface
- 📊 Structured analysis results with insights and recommendations
- 📑 PDF export functionality for analysis results
- 🎯 Copy to clipboard feature
- 🧹 Clear all functionality with server-side cleanup
- 🛡️ Comprehensive error handling and user feedback
- 🔒 Secure API key management via environment variables
- 📱 Responsive design for mobile and desktop
- ⚡ Fast processing with optimized file handling
- 🎨 Beautiful UI with TailwindCSS and Feather Icons
- 📝 Comprehensive documentation (README, CONTRIBUTING, LICENSE)
- 🔧 Development setup with nodemon support

### Technical Details
- Express.js backend server
- Groq SDK integration
- Multer for file uploads
- Multiple file parsers (pdf-parse, csv-parser, mammoth, xlsx)
- Client-side PDF generation with jsPDF
- Environment-based configuration
- Proper .gitignore for security

### Security
- API key protection via .env file
- File type validation
- File size limits (10MB per file)
- Secure file handling with automatic cleanup

---

## Future Releases

See [GitHub Issues](https://github.com/gruntcode/DocSense-AI/issues) for planned features and improvements.

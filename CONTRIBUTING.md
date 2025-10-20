# Contributing to Friday File Sense

Thank you for your interest in contributing to Friday File Sense! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Node version, browser)

### Suggesting Enhancements

We welcome feature suggestions! Please open an issue with:
- A clear description of the feature
- Use cases and benefits
- Any implementation ideas you have

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/FridayFileSense.git
   cd FridayFileSense
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Test your changes thoroughly

4. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of your changes"
   ```
   
   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates to existing features
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Include screenshots for UI changes

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Add your Groq API key to `.env`

4. Start the development server:
   ```bash
   npm run dev
   ```

## Code Style Guidelines

- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for functions
- Use ES6+ features where appropriate
- Follow existing indentation (2 spaces)

## Testing

Before submitting a PR:
- Test all file types (PDF, CSV, TXT, DOCX, XLSX)
- Test in both light and dark modes
- Test error handling scenarios
- Verify the app works on different browsers

## Questions?

Feel free to open an issue for any questions or clarifications!

---

Thank you for contributing! 🙏

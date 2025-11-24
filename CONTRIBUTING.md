# Contributing to Costco Receipt Downloader

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the problem
- Expected vs actual behavior
- Browser version and operating system
- Screenshots if applicable
- Console error messages (if any)

### Suggesting Enhancements

Feature requests are welcome! Please open an issue with:
- A clear description of the feature
- Why this feature would be useful
- Examples of how it would work
- Any implementation ideas you have

### Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Comment your code where necessary
   - Keep changes focused and atomic

3. **Test your changes**
   - Test in both Firefox and Chrome
   - Ensure the extension still loads correctly
   - Verify downloads work as expected
   - Check that the UI appears correctly

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference issues if applicable
   ```bash
   git commit -m "Add feature: CSV export functionality (#123)"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description of the changes
   - Link to any related issues
   - Describe how you tested the changes

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/harrykhh/Costco-Receipt-Downloader.git
   cd costco-receipt-downloader
   ```

2. Load the extension in your browser (see README.md)

3. Make changes to the code

4. Reload the extension to test changes

## Code Style Guidelines

- Use 2 spaces for indentation
- Use descriptive variable names
- Add comments for complex logic
- Keep functions small and focused
- Use `const` and `let` instead of `var`
- Follow existing patterns in the codebase

## Testing Checklist

Before submitting a PR, ensure:
- [ ] Extension loads without errors in Firefox
- [ ] Extension loads without errors in Chrome
- [ ] UI appears correctly on the Costco page
- [ ] Date picker works and saves preferences
- [ ] Download button functions correctly
- [ ] Error states display properly
- [ ] No console errors
- [ ] Code is commented where necessary

## Project Structure

```
costco-receipt-downloader/
├── manifest-firefox.json    # Firefox-specific manifest
├── manifest-chrome.json     # Chrome-specific manifest
├── content.js              # Main extension logic
├── README.md               # Project documentation
├── CONTRIBUTING.md         # This file
└── LICENSE                 # MIT License
```

## Questions?

Feel free to open an issue with the `question` label if you need help or clarification.

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other contributors

Thank you for contributing! 🎉
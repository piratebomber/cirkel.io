===============================================
Contributing to Cirkel.io
===============================================

Thank you for your interest in contributing to Cirkel.io! This guide will help you get started with contributing to our next-generation social media platform.

Getting Started
===============

Before you begin contributing, please:

1. Read our `Code of Conduct <#code-of-conduct>`_
2. Check existing `issues <https://github.com/piratebomber/cirkel.io/issues>`_ and `pull requests <https://github.com/piratebomber/cirkel.io/pulls>`_
3. Set up your development environment

Development Environment Setup
=============================

Prerequisites
-------------

- Node.js 18.0 or higher
- npm 9.0 or higher
- Git
- A GitHub account

Initial Setup
-------------

1. **Fork the repository**

   Click the "Fork" button on the GitHub repository page.

2. **Clone your fork**

   .. code-block:: bash

      git clone https://github.com/YOUR_USERNAME/cirkel.io
      cd platform

3. **Add upstream remote**

   .. code-block:: bash

      git remote add upstream https://github.com/piratebomber/cirkel.io

4. **Install dependencies**

   .. code-block:: bash

      npm install

5. **Set up environment variables**

   .. code-block:: bash

      cp .env.example .env.local

   Update `.env.local` with your configuration values.

6. **Run the development server**

   .. code-block:: bash

      npm run dev

Types of Contributions
======================

We welcome various types of contributions:

Bug Reports
-----------

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots or error messages
- Your environment details (OS, browser, Node.js version)

Use our `bug report template <https://github.com/piratebomber/cirkel.io/issues/new?template=bug_report.md>`_.

Feature Requests
----------------

For new features:

- Check if the feature already exists or is planned
- Describe the problem you're trying to solve
- Explain your proposed solution
- Consider the impact on existing users

Use our `feature request template <https://github.com/piratebomber/cirkel.io/issues/new?template=feature_request.md>`_.

Code Contributions
------------------

We accept contributions for:

- Bug fixes
- New features
- Performance improvements
- Documentation updates
- Test coverage improvements

Development Workflow
====================

1. **Create a branch**

   .. code-block:: bash

      git checkout -b feature/your-feature-name

   Branch naming conventions:
   - ``feature/`` for new features
   - ``fix/`` for bug fixes
   - ``docs/`` for documentation
   - ``test/`` for tests
   - ``refactor/`` for refactoring

2. **Make your changes**

   - Write clean, readable code
   - Follow our coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**

   .. code-block:: bash

      # Run type checking
      npm run type-check

      # Run linting
      npm run lint

      # Run tests
      npm test

      # Run E2E tests
      npm run test:e2e

4. **Commit your changes**

   We use conventional commits. Format: ``type(scope): description``

   .. code-block:: bash

      git commit -m "feat(auth): add OAuth2 integration"
      git commit -m "fix(ui): resolve mobile navigation issue"
      git commit -m "docs(api): update authentication endpoints"

   Types:
   - ``feat``: New feature
   - ``fix``: Bug fix
   - ``docs``: Documentation
   - ``style``: Formatting changes
   - ``refactor``: Code refactoring
   - ``test``: Adding tests
   - ``chore``: Maintenance tasks

5. **Push to your fork**

   .. code-block:: bash

      git push origin feature/your-feature-name

6. **Create a Pull Request**

   - Use a clear, descriptive title
   - Reference related issues
   - Describe your changes
   - Include screenshots for UI changes

Coding Standards
================

TypeScript
----------

- Use TypeScript strict mode
- Define proper types and interfaces
- Avoid ``any`` type when possible
- Use type imports: ``import type { User } from './types'``

React
-----

- Use functional components with hooks
- Follow React best practices
- Use proper prop types
- Implement proper error boundaries

Code Style
----------

- Use Prettier for formatting (configured in ``prettier.config.js``)
- Follow ESLint rules (configured in ``.eslintrc.js``)
- Use meaningful variable and function names
- Write self-documenting code
- Add comments for complex logic

File Organization
-----------------

.. code-block::

   components/
   ├── ui/           # Reusable UI components
   ├── forms/        # Form components
   ├── layout/       # Layout components
   └── feature/      # Feature-specific components

   lib/
   ├── utils.ts      # Utility functions
   ├── constants.ts  # Application constants
   └── validations.ts # Validation schemas

   types/
   ├── index.ts      # Main type definitions
   └── api.ts        # API-related types

Testing Guidelines
==================

Unit Tests
----------

- Write tests for all new functions and components
- Use Jest and React Testing Library
- Aim for 80%+ code coverage
- Test edge cases and error conditions

.. code-block:: typescript

   // Example test
   import { render, screen } from '@testing-library/react';
   import { Button } from './Button';

   describe('Button', () => {
     it('renders with correct text', () => {
       render(<Button>Click me</Button>);
       expect(screen.getByText('Click me')).toBeInTheDocument();
     });
   });

Integration Tests
-----------------

- Test component interactions
- Test API integrations
- Use realistic test data

E2E Tests
---------

- Test critical user flows
- Use Playwright for E2E testing
- Test across different browsers

Documentation
=============

Code Documentation
------------------

- Document public APIs
- Use JSDoc for functions and classes
- Include usage examples

.. code-block:: typescript

   /**
    * Formats a user's display name
    * @param user - The user object
    * @param includeUsername - Whether to include @username
    * @returns Formatted display name
    * @example
    * formatDisplayName(user, true) // "John Doe (@johndoe)"
    */
   export function formatDisplayName(user: User, includeUsername = false): string {
     // Implementation
   }

README Updates
--------------

- Update README.rst for significant changes
- Include new environment variables
- Document new scripts or commands

API Documentation
-----------------

- Document new API endpoints
- Include request/response examples
- Update OpenAPI specifications

Pull Request Guidelines
=======================

Before Submitting
-----------------

- Ensure all tests pass
- Update documentation
- Rebase on latest main branch
- Squash related commits

PR Description
--------------

Include:

- **What**: Brief description of changes
- **Why**: Reason for the changes
- **How**: Implementation approach
- **Testing**: How you tested the changes
- **Screenshots**: For UI changes

Example:

.. code-block::

   ## What
   Add OAuth2 authentication support for Google and GitHub

   ## Why
   Users requested social login options to simplify registration

   ## How
   - Integrated NextAuth.js with OAuth providers
   - Added provider configuration
   - Updated login UI with social buttons

   ## Testing
   - Tested Google OAuth flow
   - Tested GitHub OAuth flow
   - Added unit tests for auth utilities

   ## Screenshots
   [Include relevant screenshots]

Review Process
--------------

1. **Automated checks**: CI/CD pipeline runs tests and linting
2. **Code review**: Team members review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

Code of Conduct
===============

Our Pledge
----------

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

Our Standards
-------------

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

Enforcement
-----------

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@cirkel.io. All complaints will be reviewed and investigated promptly and fairly.

Getting Help
============

If you need help with contributing:

- **Discord**: Join our `Discord server <https://discord.gg/cirkel>`_
- **Discussions**: Use `GitHub Discussions <https://github.com/piratebomber/cirkel.io/discussions>`_
- **Email**: Contact us at contributors@cirkel.io

Resources
=========

- `GitHub Flow Guide <https://guides.github.com/introduction/flow/>`_
- `Conventional Commits <https://www.conventionalcommits.org/>`_
- `TypeScript Handbook <https://www.typescriptlang.org/docs/>`_
- `React Documentation <https://react.dev/>`_
- `Next.js Documentation <https://nextjs.org/docs>`_

Recognition
===========

Contributors are recognized in several ways:

- Listed in our `Contributors page <https://github.com/piratebomber/cirkel.io/graphs/contributors>`_
- Mentioned in release notes for significant contributions
- Invited to join our contributors Discord channel
- Eligible for contributor swag and rewards

Thank you for contributing to Cirkel.io! Your efforts help make this platform better for everyone.
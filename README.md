# Shivvyas Yadav's Portfolio

A personal portfolio website built with Next.js, React, TypeScript, and SCSS Modules.

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Navigation](#navigation)
- [Styling (SCSS)](#styling-scss)
- [Data Management](#data-management)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [License](#license)

## About

This is the personal portfolio website for Shivvyas Yadav. It showcases projects, skills, and contact information using modern web technologies.

## Tech Stack

- Next.js (Pages Router)
- React
- TypeScript
- SCSS Modules
- Node.js
- Vercel (for deployment)

## Project Structure

```
/components    # Reusable React components styled with SCSS modules
/data          # Static data files (e.g., project information)
/pages         # Next.js pages (/, /projects)
/public        # Static assets (images, fonts)
/styles        # Global SCSS files (variables and globals)
README.md      # Project overview and instructions
package.json   # Dependencies and scripts
```

## Navigation

- **Home** (`/`): Hero section, services overview, featured projects, and call-to-action.
- **Projects** (`/projects`): Full listing of projects with detailed descriptions.
- **Project Details**: Accessed by clicking on any project card.

Navigation is implemented in `components/Nav/Nav.tsx` using Next.js `<Link>` for client-side routing.

## Styling (SCSS)

- **Global Styles**: Defined in `styles/globals.scss`, including resets and base typography.
- **Variables & Mixins**: Stored in `styles/variables.scss` (colors, font-sizes, breakpoints).
- **CSS Modules**: Each component folder includes a `.module.scss` file (e.g., `HeroSection.module.scss`).
  Styles are imported as scoped objects and applied via `className` in TSX.
- Next.js compiles SCSS out of the box once you install the `sass` package.

## Data Management

Project details are stored in `data/projectsData.ts` as a TypeScript array of objects.
Both Home and Projects pages consume this data to render project cards dynamically.

## Getting Started

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/shivvyas.com.git
    ```

2. Install dependencies:

    ```bash
    npm install
    # or
yarn install
    # or
    pnpm install
    ```

3. Run the development server:

    ```bash
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Run the production build locally
- `npm run lint` - Run ESLint checks

## Deployment

This site is deployed on Vercel. Connect your GitHub repository to Vercel for automatic builds on push.

## License

This project is licensed under the MIT License.

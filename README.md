# MdEditor - Markdown Editor (Linux & macOs soon)

A modern Markdown editor built with Electron, React, and TypeScript. This application provides a clean and efficient environment for writing Markdown documents with real-time preview.

![](/screenshots/demo.png)

## Features

- Real-time Markdown preview
- Support for mathematical equations (KaTeX)
- GitHub Flavored Markdown (GFM) support
- Emoji support
- Clean, minimalist interface
- Light/Dark mode

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone git@github.com:achillebourgault/md-editor.git
cd markdown-editor
```

2. Install dependencies:
```bash
npm install
```

## Development

Run the application in development mode:
```bash
npm run electron:dev
```

## Building

Create a production build:
```bash
npm run electron:build
```
The built application will be available in the `release` directory.

## Technologies Used

- Electron
- React
- TypeScript
- Vite
- TailwindCSS
- Unified.js ecosystem for Markdown processing:
  - remark-parse
  - remark-gfm
  - remark-math
  - rehype-katex
  - rehype-highlight

## Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build the application
- `npm run electron:dev` - Start Electron in development mode
- `npm run electron:build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run clean` - Clean build directories

## Screenshots

![](/screenshots/dark.png)
![](/screenshots/light.png)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

This means you are free to:
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material

Under the following terms:
- Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- NonCommercial — You may not use the material for commercial purposes

The full license text can be found at: https://creativecommons.org/licenses/by-nc/4.0/

## Contact

For any questions or suggestions, please contact:
- Achille Bourgault - achille.bourgault@gmail.com

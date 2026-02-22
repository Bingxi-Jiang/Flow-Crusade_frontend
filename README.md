

# Flow Preview

A lightweight React application built with **Vite** and styled using **Tailwind CSS**.
This project demonstrates a modern frontend development workflow with fast hot-reload and optimized builds.

---

## 🚀 Tech Stack

* React
* Vite
* Tailwind CSS
* PostCSS
* ESLint

---

## 📦 Project Structure

```
flow-preview/
│
├── public/                # Static assets
├── src/
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles (Tailwind included)
│
├── index.html             # Root HTML template
├── package.json           # Project dependencies & scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
└── eslint.config.js       # Linting configuration
```

---

## 🛠 Installation

Clone the repository:

```bash
git clone <your-repo-url>
cd flow-preview
```

Install dependencies:

```bash
npm install
```

---

## 💻 Development

Start the development server:

```bash
npm run dev
```

Vite will start a local development server (usually at):

```
http://localhost:5173
```

The page reloads automatically when you edit files.

---

## 🏗 Build for Production

To generate an optimized production build:

```bash
npm run build
```

The build output will be generated inside the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

---

## 🎨 Tailwind CSS Usage

Tailwind directives are included in:

```
src/index.css
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

You can use Tailwind utility classes directly in your JSX:

```jsx
<div className="flex items-center justify-center h-screen bg-gray-100">
  <h1 className="text-3xl font-bold">Hello World</h1>
</div>
```

---

## 🧹 Linting

Run ESLint manually:

```bash
npm run lint
```

---

## 📌 Notes

* Do **not** commit `node_modules/`
* Do **not** commit `dist/`
* Make sure `.gitignore` includes:

  ```
  node_modules
  dist
  ```

---

## 📄 License

This project is for educational and personal use.

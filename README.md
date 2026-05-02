# QuizGenius AI 🧠✨

QuizGenius AI is a powerful web application that transforms your documents (PDF, DOCX, TXT) into interactive, AI-powered quizzes instantly. Perfect for students, teachers, and lifelong learners.

## 🚀 Getting Started

### Local Development
To run the project locally on your machine:
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser to the URL shown in your terminal (usually `http://localhost:5173`).

---

## 🏗️ Production & Deployment

### Build for Production
To create an optimized production build:
```bash
npm run build
```
The output will be stored in the `dist/` folder.

### Preview the Production Build
To test exactly how the website will behave once deployed:
```bash
npm run preview
```
This runs the `dist` folder locally so you can verify it before going live.

### How to Access Your Deployed Website
Once you have deployed to a service like **Vercel** or **Netlify**:
1. **The URL:** The platform will provide you with a unique, permanent URL (e.g., `https://quiz-genius-ai.vercel.app`).
2. **Always Online:** You don't need to "run" anything; the hosting provider keeps the site active 24/7.
3. **Sharing:** Simply send that URL to anyone you want to share the quiz with!

### Hosting on InfinityFree / Apache
If you are using InfinityFree:
1. Run `npm run build`.
2. Upload the **contents** of the `dist/` folder to your `htdocs/` directory via File Manager or FTP.
3. The `.htaccess` file (already in `public/`) will automatically handle the routing for you.

---

## 🛠️ Key Features
- **Document Extraction:** Parses text from PDF, Word, and Text files.
- **Smart Quiz Engine:** Generates plausible distractors based on your document content.
- **PDF Export:** Download professional results reports with your score and explanations.
- **Shareable Results:** Generate unique links to share your scores with others.
- **Responsive Design:** Beautiful, modern UI that works on all devices.

---

## 📦 Tech Stack
- **Frontend:** React 19, Vite, React Router 7.
- **Styling:** Vanilla CSS (Glassmorphism design).
- **Libraries:** jsPDF, Mammoth (Word), PDF.js (PDF extraction), Lucide React (Icons).
- **Storage:** LocalStorage (Client-side persistence).

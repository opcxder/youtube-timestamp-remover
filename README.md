# 🎬 CleanTranscribe

A modern web application that extracts clean transcripts from YouTube videos by automatically removing timestamps.

![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=for-the-badge&logo=next.js)
![Express.js](https://img.shields.io/badge/Express.js-4.19.2-green?style=for-the-badge&logo=express)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-blue?style=for-the-badge&logo=tailwind-css)

## ✨ Features

- 🎯 **One-Click Processing**: Simply paste a YouTube URL and get clean transcripts
- 🚀 **Lightning Fast**: Optimized for speed with efficient processing
- 📱 **Mobile Responsive**: Works perfectly on all devices
- 💾 **Multiple Export Formats**: Download as TXT, PDF, DOCX, or copy to clipboard
- 🎥 **Video Preview**: Embedded YouTube player for context
- 🎨 **Modern UI**: Beautiful, intuitive interface with smooth animations
- ⚡ **Real-time Validation**: Instant URL validation and error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- YouTube Data API Key ([Get one here](https://console.developers.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/opcxder/youtube-timestamp-remover.git
   cd youtube-timestamp-remover
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment**
   ```bash
   # In the server directory
   cp .env.example .env
   # Edit .env and add your YouTube API key
   ```

4. **Start the application**
   ```bash
   # Terminal 1 - Start server
   cd server
   npm start
   
   # Terminal 2 - Start client
   cd client
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
# YouTube Data API Key (Required)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 📁 Project Structure

```
youtube-timestamp-remover/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   └── public/           # Static assets
├── server/               # Express.js backend
│   ├── server.js         # Main server file
│   └── package.json      # Server dependencies
└── README.md
```

## 🎨 Export Formats

- **TXT**: Plain text format
- **PDF**: Formatted PDF document
- **DOCX**: Microsoft Word document
- **Copy to Clipboard**: One-click copying

## 🚀 Deployment

### Vercel (Recommended)

1. **Deploy Frontend**
   ```bash
   cd client
   vercel --prod
   ```

2. **Deploy Backend**
   - Deploy to Railway, Render, or Heroku
   - Set environment variables
   - Update CORS origins

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License  

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Express.js](https://expressjs.com/) - Node.js framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components

---

Made with ❤️ for content creators, researchers, and students.

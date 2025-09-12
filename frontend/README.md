# RankRx Light Frontend

A modern, professional React frontend for ERAS application analysis and ranking.

## 🚀 Features

- **Modern UI**: Clean, professional design with Tailwind CSS
- **PDF Upload**: Drag-and-drop file upload with validation
- **Real-time Parsing**: Instant analysis using Python backend
- **Interactive Ranking**: Compare against 200+ synthetic applicants
- **Responsive Design**: Works on all devices
- **Professional Branding**: RankRx Light branding throughout

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **Backend**: Python API (deployed on Vercel)

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Vercel account (for deployment)

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Main page
│   ├── components/
│   │   ├── FileUpload.tsx       # PDF upload component
│   │   ├── ParsedDataDisplay.tsx # Results display
│   │   └── RankingDisplay.tsx   # Ranking visualization
│   └── types/
│       └── index.ts             # TypeScript definitions
├── public/
│   └── synthetic_applicants.json # Test data
└── package.json
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app
```

### API Integration
The frontend expects a Python API at:
```
POST /api/parse-pdf
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Font**: Inter (Google Fonts)
- **Sizes**: Responsive scaling
- **Weights**: 300, 400, 500, 600, 700

## 📱 Components

### FileUpload
- Drag and drop interface
- File validation (PDF only, <10MB)
- Progress indicators
- Error handling

### ParsedDataDisplay
- Visa status visualization
- USMLE Step 1 & 2 results
- ECFMG certification status
- Professional card layouts

### RankingDisplay
- Rank position visualization
- Statistical comparisons
- Performance insights
- Action recommendations

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Deploy automatically
4. Get your production URL

### Manual Deployment
```bash
npm run build
npm run export
# Deploy dist/ folder to your hosting provider
```

## 🔍 API Endpoints

### Parse PDF
```typescript
POST /api/parse-pdf
Content-Type: application/octet-stream
Body: PDF file binary

Response:
{
  "visa": {
    "authorized_to_work_us": "Yes/No",
    "visa_sponsorship_needed": "Yes/No",
    // ... more fields
  },
  "usmle": {
    "step1": { "passed": true, "score": "245", "failures": 0 },
    "step2_ck": { "passed": true, "score": "265", "failures": 0 }
  },
  "ecfmg_status_report": { "certified": "Yes" }
}
```

## 🎯 User Flow

1. **Upload**: User drags/drops PDF file
2. **Validation**: File type and size check
3. **Processing**: Send to Python API for parsing
4. **Display**: Show parsed data in professional layout
5. **Ranking**: Calculate and display ranking vs synthetic data
6. **Insights**: Provide actionable recommendations

## 🐛 Troubleshooting

### Common Issues

**API Connection Failed**
- Check if Python API is deployed
- Verify API URL in environment variables
- Check CORS headers

**File Upload Issues**
- Ensure PDF is valid and under 10MB
- Check network connectivity
- Verify file permissions

**Ranking Not Showing**
- Check if synthetic_applicants.json is accessible
- Verify API response format
- Check browser console for errors

## 📈 Performance

- **First Load**: ~2s (with Tailwind CSS)
- **PDF Upload**: ~3-5s (depends on file size)
- **Ranking Calculation**: ~100ms (client-side)
- **Bundle Size**: ~200KB (optimized)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of RankRx Light - USMLE Application Ranking System.

---

**Built with ❤️ using Next.js, Tailwind CSS, and TypeScript**
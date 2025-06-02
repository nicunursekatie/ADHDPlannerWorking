# ADHD Planner

A comprehensive web application designed specifically for people with ADHD to manage tasks, projects, and time effectively. Built with modern web technologies and ADHD-friendly design principles.

## ✨ Features

### 🎯 Core Task Management
- **Smart Task Creation**: Quick capture with natural language parsing (`!today`, `!high`, `!tomorrow`)
- **Hierarchical Tasks**: Create subtasks and manage dependencies
- **Priority & Energy Levels**: Match tasks to your current capacity
- **Time Estimation**: Track and improve time awareness
- **Bulk Operations**: Efficiently manage multiple tasks at once

### 📅 Time Management
- **Daily Time Blocking**: Visual calendar for structured planning
- **Smart Scheduling**: Automatically account for buffer time and transitions
- **What Now? Wizard**: Get task recommendations based on available time and energy
- **Due Date Intelligence**: Smart parsing of dates from natural language

### 🧠 ADHD-Specific Features
- **Time Blindness Alerts**: Periodic time awareness reminders
- **Executive Function Support**: Structured workflows and guided task breakdown
- **Hyperfocus Management**: Visual cues and break reminders
- **Overwhelm Prevention**: Simplified interfaces and progressive disclosure

### 🗂️ Organization
- **Project Management**: Group related tasks and track progress
- **Category System**: Flexible tagging and filtering
- **Quick Filters**: Find tasks by status, project, category, or timeline
- **Archive System**: Keep completed tasks without clutter

### 🔄 Data Management
- **Cloud Sync**: Supabase integration for cross-device access
- **Local Storage Backup**: Offline functionality and data resilience
- **Import/Export**: JSON-based data portability
- **Duplicate Cleanup**: Intelligent duplicate detection and removal

### 🎨 Accessibility
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Reduce eye strain and support preferences
- **High Contrast Options**: Enhanced visibility for better focus
- **Keyboard Navigation**: Full accessibility support

## 🛠️ Technologies

### Frontend
- **React 18** - Modern UI framework with hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **DND Kit** - Accessible drag-and-drop functionality

### Backend & Data
- **Supabase** - PostgreSQL database with real-time features
- **LocalStorage** - Offline data persistence
- **Service Workers** - PWA capabilities and offline support

### Development Tools
- **ESLint** - Code linting and style enforcement
- **PostCSS** - CSS processing and optimization
- **PWA** - Progressive Web App features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser
- (Optional) Supabase account for cloud sync

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/adhd-planner.git
   cd adhd-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional for local development)
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials if using cloud sync
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

### Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

## 🗄️ Database Setup (Optional)

For cloud sync functionality, set up Supabase:

1. **Create Supabase project**
   - Visit [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Run database migrations**
   ```sql
   -- See supabase-schema.sql for complete schema
   -- Run in Supabase SQL editor
   ```

3. **Configure environment**
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

## 📖 Usage Examples

### Quick Task Creation
```
// In the quick capture input:
"Review project proposal !high !tomorrow"
"Call dentist !today"
"Shopping list !low"
```

### Time Blocking
1. Navigate to **Planning** → **Daily Planner**
2. Click on time slots to create blocks
3. Assign tasks to time blocks
4. Export blocks as tasks when ready

### Project Management
1. Go to **Projects** page
2. Create new project with color coding
3. Add tasks and assign to project
4. Track progress on project dashboard

### What Now? Workflow
1. Click **"What Now?"** when feeling overwhelmed
2. Select current energy level (high/medium/low)
3. Choose available time (15min/30min/1hr/2hr+)
4. Get personalized task recommendations

## 🔧 Configuration

### Settings Overview
The app includes comprehensive settings for ADHD-specific needs:

- **Time Management**: Buffer times, time blindness alerts, auto-adjust estimates
- **Visual Preferences**: Font size, layout density, reduced animations, high contrast
- **AI Integration**: Task breakdown assistance (configure your preferred AI provider)
- **Data Management**: Import/export, backup, and duplicate cleanup

### Customization
The app can be customized through:
- CSS custom properties for themes
- Settings panel for user preferences
- Project and category color schemes

## 🤝 Contributing

We welcome contributions! This project is designed to help the ADHD community.

### Development Guidelines

1. **Code Style**
   - Use TypeScript for type safety
   - Follow existing code formatting (Prettier + ESLint)
   - Write meaningful commit messages
   - Keep components small and focused

2. **ADHD-Friendly Design Principles**
   - Minimize cognitive load
   - Provide clear visual hierarchy
   - Include helpful defaults
   - Support multiple interaction patterns
   - Consider time blindness and executive function challenges

3. **Testing**
   - Test core user workflows
   - Verify accessibility features
   - Check mobile responsiveness
   - Test with various data states (empty, full, error)

### Contribution Process

1. **Fork the repository**
   ```bash
   git fork https://github.com/yourusername/adhd-planner.git
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes**
   - Follow code style guidelines
   - Add tests if applicable
   - Update documentation

4. **Test thoroughly**
   ```bash
   npm run lint
   npm run build
   # Test manually in browser
   ```

5. **Submit pull request**
   - Describe changes clearly
   - Reference any related issues
   - Include screenshots for UI changes

### Areas for Contribution

- **Accessibility improvements**
- **Mobile experience enhancements**
- **Additional AI integrations**
- **Performance optimizations**
- **New ADHD-helpful features**
- **Documentation and tutorials**
- **Internationalization (i18n)**

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Basic UI elements (Button, Card, Modal)
│   ├── tasks/           # Task-specific components
│   ├── projects/        # Project management components
│   ├── planning/        # Time blocking and planning
│   ├── settings/        # Configuration and preferences
│   └── layout/          # App layout and navigation
├── pages/               # Top-level page components
├── context/             # React Context for state management
├── hooks/               # Custom React hooks
├── services/            # External service integrations
├── utils/               # Helper functions and utilities
├── types/               # TypeScript type definitions
└── styles/              # Global styles and themes
```

## 🐛 Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
```bash
npm run type-check
# Fix reported type errors
```

**App won't start in development**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Supabase connection issues**
- Verify environment variables are set correctly
- Check Supabase project status
- Confirm API keys have proper permissions

**Performance issues with large datasets**
- Use the archive feature for old tasks
- Enable pagination in settings
- Consider using the duplicate cleanup tool

### Getting Help

- Check [Issues](https://github.com/yourusername/adhd-planner/issues) for known problems
- Create new issue with detailed description
- Include browser version, OS, and steps to reproduce

## 🚀 Deployment

### Netlify (Recommended)

1. **Connect repository**
   - Link your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment variables**
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

3. **Deploy**
   - Push to main branch for automatic deployment
   - Or use: `npm run netlify-deploy`

### Vercel

1. **Import project**
   - Connect GitHub repository
   - Vercel auto-detects Vite configuration

2. **Configure environment**
   - Add Supabase environment variables
   - Set Node.js version to 18+

### Self-Hosting

```bash
# Build for production
npm run build

# Serve static files from dist/ directory
# Use any web server (nginx, Apache, etc.)
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- ADHD community feedback and testing
- Open source libraries and tools
- Accessibility guidelines and standards
- UX research on neurodivergent-friendly design

## 📞 Support

For support, feature requests, or bug reports:
- [GitHub Issues](https://github.com/yourusername/adhd-planner/issues)
- [Discussions](https://github.com/yourusername/adhd-planner/discussions)

---

Built with ❤️ for the ADHD community
# 🌤️ Weather Wise - Real-Time Weather Forecast Application

A modern, feature-rich weather forecast web application built with **vanilla JavaScript, HTML, and CSS**. Weather Wise provides real-time weather information with an intuitive user interface, secure authentication, interactive weather maps, and multi-language support.

![Weather Wise](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Responsive](https://img.shields.io/badge/Responsive-Mobile%20Ready-brightgreen)

---

## ✨ Features

### 🌍 Core Weather Features
- **Real-Time Weather Data**: Get current weather conditions and detailed forecasts for cities worldwide
- **Comprehensive Weather Information**: Temperature, humidity, wind speed, pressure, UV index, and visibility
- **Extended Forecasts**: View weather predictions for the next 7-14 days
- **Smart City Search**: Autocomplete-enabled city search with support for thousands of global cities

### 🔐 User Experience
- **Secure Authentication**: User registration and login system with session management
- **User Profiles**: Personalized dashboard and favorite cities management
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI/UX**: Clean, intuitive interface with smooth animations and transitions

### 🗺️ Advanced Features
- **Interactive Weather Map**: Visual weather map integration for regional weather tracking
- **Multi-Language Support**: Available in multiple languages for global accessibility
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Weather Alerts**: Get notified about severe weather conditions
- **Favorite Cities**: Quick access to frequently checked locations

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have:
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Node.js and npm (optional, for local development server)
- API keys for:
  - **OpenWeatherMap**: [Get API Key](https://openweathermap.org/api)
  - **OpenAI** (optional, for chatbot feature): [Get API Key](https://platform.openai.com/api-keys)
  - **Firebase** (optional, for authentication): [Firebase Console](https://console.firebase.google.com/)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Dineshkavitha2005/Weather_wise.git
   cd Weather_wise
   ```

2. **Configure API Keys:**
   - Copy the example configuration file:
     ```bash
     cp config.example.js config.js
     ```
   - Edit `config.js` and add your API keys:
     ```javascript
     const CONFIG = {
       openWeatherMapKey: 'your-openweathermap-api-key',
       openAiKey: 'your-openai-api-key',
       openAiModel: 'gpt-3.5-turbo', // or gpt-4
       firebaseConfig: {
         // Your Firebase configuration
       }
     };
     ```

3. **Start a Local Development Server:**

   **Using Python:**
   ```bash
   python -m http.server 8000
   ```

   **Using Node.js (http-server):**
   ```bash
   npx http-server
   ```

   **Using Node.js (live-server):**
   ```bash
   npx live-server
   ```

4. **Access the Application:**
   - Open your browser and navigate to `http://localhost:8000`
   - Create an account or log in
   - Start checking weather conditions!

### Demo Video

https://github.com/user-attachments/assets/9a06e6c7-b20f-41f6-a3e4-d6375f3cc830

---

## 📁 Project Structure

```
Weather_wise/
│
├── index.html              # Main application dashboard
├── auth.html               # Authentication page (login/register)
│
├── js/
│   ├── app.js              # Main application logic and event handlers
│   ├── auth.js             # Authentication and user session management
│   ├── weatherMap.js       # Interactive weather map integration
│   ├── cities.js           # Comprehensive city database
│   └── translations.js     # Multi-language translation system
│
├── css/
│   ├── styles.css          # Main application styles
│   └── auth.css            # Authentication page styles
│
├── config.example.js       # Example configuration file (COPY and rename to config.js)
├── .gitignore              # Git ignore file
├── README.md               # This file
└── LICENSE                 # MIT License
```

---

## 🎯 Usage Guide

### Getting Started with Weather Wise

1. **User Authentication:**
   - Navigate to the authentication page
   - Create a new account with your email and password
   - Log in with your credentials
   - Your preferences and favorite cities are saved automatically

2. **Searching for Weather:**
   - Use the search bar to enter a city name
   - Select from autocomplete suggestions
   - View current weather, hourly forecast, and extended forecast
   - Check detailed weather parameters (humidity, wind, pressure, etc.)

3. **Using the Weather Map:**
   - Open the interactive weather map
   - Zoom in/out to explore different regions
   - Click on locations to get detailed weather information
   - View weather patterns and regional forecasts

4. **Managing Preferences:**
   - Add cities to your favorites for quick access
   - Switch between Celsius and Fahrenheit
   - Change your preferred language
   - Toggle dark/light mode based on your preference

5. **Using the AI Chatbot (if enabled):**
   - Ask weather-related questions
   - Get personalized weather insights
   - Receive recommendations based on current conditions

---

## 🛠️ Technologies Used

### Frontend Stack
| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic markup and structure |
| **CSS3** | Modern styling, animations, and responsive layouts |
| **JavaScript (ES6+)** | Application logic, interactivity, and API communication |

### External APIs & Services
| Service | Purpose |
|---------|---------|
| **OpenWeatherMap API** | Real-time weather data and forecasts |
| **OpenAI API** | AI-powered chatbot and weather insights |
| **Firebase** | User authentication and data storage |

### Additional Tools
- **Local Storage API** | Client-side data persistence
- **Geolocation API** | Auto-detect user location
- **Fetch API** | Asynchronous API calls

---

## 📦 Key Components

### `app.js`
The heart of the application. Handles:
- Weather data fetching and processing
- DOM manipulation and UI updates
- User interactions and event listeners
- Data caching and local storage management

### `auth.js`
Manages user authentication:
- User registration and login
- Session management and token handling
- Password security and validation
- User profile management

### `weatherMap.js`
Interactive weather mapping functionality:
- Map initialization and rendering
- Weather layer integration
- Marker management
- Region-specific forecasts

### `cities.js`
Comprehensive city database:
- City name search and autocomplete
- Geographic coordinates storage
- City alias handling
- Popular cities list

### `translations.js`
Multi-language support system:
- Translation strings for all UI elements
- Dynamic language switching
- Localization of date/time formats
- Number formatting based on locale

---

## 🎨 Features in Detail

### Current Weather Display
- Real-time temperature and "feels like" temperature
- Weather description with visual icons
- Humidity percentage
- Wind speed and direction
- Atmospheric pressure
- UV index and visibility
- Sunrise and sunset times

### Extended Forecasts
- Hourly weather breakdown
- 7-day weather forecast
- Temperature trends and highs/lows
- Precipitation probability
- Wind speed variations

### Interactive Features
- Smart city search with autocomplete
- One-click favorite cities
- Temperature unit conversion
- Visual weather condition icons
- Animated weather transitions
- Responsive mobile interface

### User Preferences
- Dark and light theme options
- Language selection
- Temperature unit preference (°C/°F)
- Notification settings
- Location auto-detection

---

## 🔒 Security & Configuration

### Important Security Notes

⚠️ **API Key Protection:**
- The `config.js` file containing API keys is listed in `.gitignore` and should NEVER be committed
- Always use `config.example.js` as a template
- Never share your API keys or commit them to version control

**For Production Deployment:**
1. **Backend Proxy:** Set up a backend server to proxy API requests and hide API keys
2. **Environment Variables:** Use environment variables for sensitive configuration
3. **CORS Handling:** Implement proper CORS policies
4. **Rate Limiting:** Add rate limiting to prevent abuse
5. **Data Validation:** Validate all user inputs

**Firebase Configuration:**
- The Firebase configuration in `config.js` contains only public web app settings
- In the Firebase Console, add every production domain under:
  - **Authentication → Settings → Authorized Domains**
- Restrict API key permissions at the Firebase Console level

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork the Repository**
   ```bash
   Click the "Fork" button on GitHub
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Weather_wise.git
   cd Weather_wise
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

4. **Make Your Changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic
   - Test your changes thoroughly

5. **Commit Your Changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

6. **Push to Your Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

7. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include before/after screenshots if applicable

### Contribution Guidelines
- Follow the existing code style and conventions
- Add comments to explain complex logic
- Test on multiple browsers and devices
- Keep commits atomic and descriptive
- Update documentation as needed

---

## 🐛 Known Issues & Troubleshooting

### Common Issues

**Weather data not loading:**
- Verify your OpenWeatherMap API key is correct
- Check API rate limits (free tier has limits)
- Ensure internet connection is active
- Check browser console for errors

**Location not detected:**
- Allow browser geolocation permission
- Check browser privacy settings
- Try manual city search as alternative

**Dark mode not persisting:**
- Clear browser cache and local storage
- Check if local storage is enabled
- Verify browser isn't in private mode

**Map not displaying:**
- Confirm map library is loaded
- Check browser console for errors
- Verify map API key configuration

---

## 📝 License

This project is open source and available under the **[MIT License](LICENSE)**.

You are free to:
- ✅ Use this software commercially
- ✅ Modify and distribute
- ✅ Use privately
- ❌ Hold liable (software is provided "as is")

---

## 👤 Author

**Dineshkavitha2005**

- 🔗 GitHub: [@Dineshkavitha2005](https://github.com/Dineshkavitha2005)
- 💼 Portfolio: [View Profile](https://github.com/Dineshkavitha2005)

---

## 🙏 Acknowledgments

- 🌤️ Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- 🤖 AI features powered by [OpenAI](https://openai.com/)
- 🔐 Authentication by [Firebase](https://firebase.google.com/)
- 🎨 Icons and design inspiration from various open-source projects
- 👥 Community contributors and testers
- 🌟 Everyone who has starred and supported this project

---

## 📞 Support & Feedback

Have questions or need help?

1. **Check Existing Issues:** Search [GitHub Issues](https://github.com/Dineshkavitha2005/Weather_wise/issues)
2. **Create New Issue:** Report bugs or request features
3. **Contact:** Open an issue with the label `question` or `help wanted`

### Reporting Issues
Please include:
- Browser and version
- Operating system
- Detailed description of the issue
- Steps to reproduce
- Screenshots or error messages

---

## 🌟 Show Your Support

If you find Weather Wise helpful:
- ⭐ Star this repository
- 🍴 Fork for your own use
- 🐛 Report bugs and issues
- 💡 Suggest improvements
- 🤝 Contribute code or documentation

---

## 📊 Project Statistics

- **Languages:** JavaScript (76.8%), CSS (15.1%), HTML (8.1%)
- **Type:** Web Application
- **Architecture:** Client-Side (Vanilla JS, no frameworks)
- **Status:** Active Development

---

## 🔗 Quick Links

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [Firebase Documentation](https://firebase.google.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [GitHub Repository](https://github.com/Dineshkavitha2005/Weather_wise)

---

**Made with ❤️ by [Dineshkavitha2005](https://github.com/Dineshkavitha2005)**

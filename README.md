# 🌤️ Weather Forecast

A modern, feature-rich weather forecast web application built with vanilla JavaScript, HTML, and CSS. This application provides real-time weather information with a beautiful user interface, authentication system, and multi-language support.

## ✨ Features

- **Real-Time Weather Data**: Get current weather conditions and forecasts for cities worldwide
- **User Authentication**: Secure login and registration system
- **Interactive Weather Map**: Visual weather map integration for enhanced weather tracking
- **Multi-Language Support**: Access the application in multiple languages
- **Comprehensive City Database**: Support for thousands of cities globally
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean and intuitive user interface with smooth animations

## Configuration

The browser loads OpenWeatherMap and Firebase client configuration from the local, untracked `config.js` file. The OpenAI key is never placed in `config.js` or sent to the browser; the chatbot uses the server endpoint at `/api/chat`.

1. Copy `config.example.js` to `config.js`.
2. Replace `your-openweathermap-api-key` with your OpenWeatherMap API key.
3. Set `OPENAI_API_KEY` in the server environment using `.env` locally or your hosting provider's environment settings.
4. Open the app through a serverless-capable local development server.

### Firebase Authentication

1. Create a Firebase project and register a Web app.
2. In **Authentication > Sign-in method**, enable **Email/Password**.
3. Copy the Web app settings into the `firebase` object in `config.js`.
4. Add the development host (for example, `localhost`) under **Authentication > Settings > Authorized domains**.
5. Run the app through a local server, then open `/auth.html` to sign up or log in.

Firebase manages password hashing and authentication tokens. The app uses Firebase Auth persistence: `LOCAL` when “Remember me” is selected and `SESSION` otherwise. No passwords or custom session objects are stored by the app in Web Storage.

Never commit `config.js` or `.env`; both are ignored by Git. OpenWeatherMap and Firebase browser values are client-side credentials and should be restricted by domain where supported. `OPENAI_API_KEY` is server-only.

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A weather API key (if required by the implementation)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dineshkavitha2005/Weather-forecast.git
```

2. Navigate to the project directory:
```bash
cd Weather-forecast
```

3. Open `index.html` in your web browser or use a local development server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server
```

4. Access the application at `http://localhost:8000` (or your server's port)

### Demo Video


https://github.com/user-attachments/assets/9a06e6c7-b20f-41f6-a3e4-d6375f3cc830



## 📁 Project Structure

```
Weather-forecast/
│
├── index.html          # Main application page
├── auth.html           # Authentication page (login/register)
│
├── app.js              # Main application logic
├── auth.js             # Authentication functionality
├── weatherMap.js       # Weather map integration
├── cities.js           # City database
├── translations.js     # Multi-language translations
│
├── styles.css          # Main application styles
└── auth.css            # Authentication page styles
```
# WeatherWise

WeatherWise is a responsive weather dashboard built with vanilla JavaScript, HTML, and CSS. It uses OpenWeatherMap for weather data and optionally integrates Firebase Authentication and OpenAI-powered weather assistance.

## Supported Features

- Current conditions, including temperature, feels-like temperature, humidity, wind, visibility, pressure, UV estimate, sunrise, and sunset
- City search with autocomplete, recent searches, and worldwide city data
- Automatic location detection through the browser Geolocation API
- 24-hour, six-day, and monthly forecast views
- Weather trends, alerts, recommendations, and an extended two-week view based on forecast data
- Interactive weather maps with standard, satellite, dark, temperature, precipitation, cloud, wind, and pressure layers
- Optional AI weather assistant and voice mode through OpenAI
- Voice city search and text-to-speech responses where the browser supports Web Speech APIs
- Firebase email/password login, registration, password reset, and session persistence
- English, Spanish, French, German, Hindi, Tamil, Chinese, Arabic, Portuguese, and Japanese translations
- Light and dark themes with preferences stored in `localStorage`
- Responsive layout and installable PWA assets

## Requirements

- Node.js 18 or newer
- npm
- An OpenWeatherMap API key
- A Firebase Web App configuration if authentication is needed
- An OpenAI API key only if the AI assistant is needed, stored server-side

## Installation

```bash
npm install
```

The application is a static site. It must be served over HTTP; opening `index.html` directly with a `file://` URL can prevent API requests, authentication, service workers, and geolocation from working correctly.

## Configuration

The browser loads runtime settings from the local, untracked `config.js` file. Create it from the example:

```bash
cp config.example.js config.js
```

On Windows PowerShell, use:

```powershell
Copy-Item config.example.js config.js
```

Edit `config.js` and set these values:

| Setting | Required | Purpose |
| --- | --- | --- |
| `openWeatherApiKey` | Yes | Current weather, forecasts, geocoding, and map tiles |
| `firebase` | No | Firebase email/password authentication |

### Using `.env`

The serverless chat endpoint reads the OpenAI key from the server environment. Create a local `.env` file from the repository template and set the key:

```dotenv
OPENAI_API_KEY=
```

The committed `.env.example` contains only `OPENAI_API_KEY=`. Do not add the OpenAI key to `config.js`, HTML, JavaScript, localStorage, or any browser bundle. For local serverless execution, use the Netlify CLI or Vercel CLI so the function receives the environment variable.

### Firebase Authentication Setup

1. Create a Firebase project and register a Web App.
2. In **Authentication > Sign-in method**, enable **Email/Password**.
3. Copy the Firebase Web App settings into the `firebase` object in `config.js`.
4. Add your local host, such as `localhost` or `127.0.0.1`, under **Authentication > Settings > Authorized domains**.
5. Start the local server and open `/auth.html` to register or sign in.

### OpenAI Setup

OpenAI is optional. Set `OPENAI_API_KEY` in the server environment. The browser sends the user's message and formatted current/forecast weather context to `/api/chat`; only the server endpoint calls OpenAI. `OPENAI_MODEL` may optionally override the default `gpt-3.5-turbo`.

## Run Locally

Start the included static server:

```bash
npx http-server . -p 4173 -c-1
```

Then open <http://127.0.0.1:4173/index.html>. The authentication page is available at <http://127.0.0.1:4173/auth.html>.

Other static servers work as well:

```bash
npx serve .
```

## Tests

```bash
npm test                 # All unit tests
npm run test:unit        # Unit tests only
npm run test:e2e         # Playwright end-to-end tests
npm run test:all         # Unit tests followed by end-to-end tests
```

The Playwright configuration starts `http-server` on port `4173` and mocks external API responses, so tests do not require live API keys.

## Deployment

WeatherWise can be deployed to Netlify or Vercel so the `/api/chat` function runs server-side. GitHub Pages and other static-only hosts cannot run the chatbot endpoint without a separate backend.

### Netlify

1. Create a new site from the repository in Netlify.
2. Set the publish directory to the repository root (`.`) and functions directory to `netlify/functions`.
3. Add `OPENAI_API_KEY` under **Site configuration > Environment variables**. Optionally add `OPENAI_MODEL`.
4. Provide `config.js` during deployment for OpenWeatherMap/Firebase client configuration only.
5. Add the deployed site domain to Firebase Authorized domains and restrict client API keys to that domain.

### Vercel

1. Import the repository into Vercel.
2. Select **Other** or a static framework preset and keep the output directory as `.`.
3. Add `OPENAI_API_KEY` under **Project Settings > Environment Variables**. Optionally add `OPENAI_MODEL`.
4. Vercel detects `api/chat.js` and exposes it as `/api/chat`.
5. Provide `config.js` during deployment for OpenWeatherMap/Firebase client configuration only, then add the Vercel domain to Firebase Authorized domains.

## Project Structure

```text
index.html          Main weather dashboard
auth.html           Login, registration, and password reset page
app.js              Weather dashboard and application logic
auth.js             Firebase Authentication logic
weatherMap.js       Leaflet weather map integration
cities.js           City search data
translations.js     Interface translations
weatherUtils.js     OpenWeatherMap request helpers
styles.css          Dashboard styles
auth.css            Authentication page styles
config.example.js   Configuration template
tests/              Unit and end-to-end tests
```

## APIs and Libraries

- [OpenWeatherMap](https://openweathermap.org/) for weather, geocoding, and map tile data
- [Firebase Authentication](https://firebase.google.com/docs/auth) for optional email/password accounts
- [OpenAI API](https://platform.openai.com/docs/) for optional AI assistance
- [Leaflet](https://leafletjs.com/) for interactive maps
- [Font Awesome](https://fontawesome.com/) for icons

## License

No license is currently specified for this repository.
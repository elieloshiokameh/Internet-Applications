require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

const API_KEY = '113e7529a5fc767ca4778b3fc0c0a05d';  // Your API Key

// Add CORS middleware to allow cross-origin requests
app.use(cors());

// Utility function to fetch weather data
const fetchWeatherDataByCity = async (city) => {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Weather API error:', error.response ? error.response.data : error.message);
    throw new Error('Error fetching weather data');
  }
};

const fetchWeatherDataByCoords = async (lat, lon) => {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Weather API error:', error.response ? error.response.data : error.message);
    throw new Error('Error fetching weather data by coordinates');
  }
};

// Utility function to fetch air pollution data
const fetchAirPollutionData = async (lat, lon) => {
  const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data.list[0].components;
  } catch (error) {
    console.error('Pollution API error:', error.response ? error.response.data : error.message);
    throw new Error('Error fetching air pollution data');
  }
};

// Function to extract daily forecast (every 8th forecast)
const getDailyForecast = (forecast) => {
  const dailyForecast = [];
  for (let i = 0; i < forecast.length; i += 8) {
    dailyForecast.push(forecast[i]);
  }
  return dailyForecast;
};

// Generate packing advice based on the forecast
const generatePackingAdvice = (forecast) => {
  let packingAdvice = 'Packing recommendation: ';
  const hasRain = forecast.some(day => day?.rain?.['3h'] > 0);
  const hasCold = forecast.some(day => day?.main?.temp_min < 8);
  const hasHot = forecast.some(day => day?.main?.temp_max > 24);

  if (hasRain) packingAdvice += 'Bring an umbrella. ';
  if (hasCold) packingAdvice += 'Pack for cold weather. ';
  if (hasHot) packingAdvice += 'Pack for hot weather. ';
  if (!hasCold && !hasHot) packingAdvice += 'Weather is mild.';

  return packingAdvice;
};

// Weather API route
app.get('/weather', async (req, res) => {
  const { city, lat, lon } = req.query;

  try {
    let weatherData;

    if (lat && lon) {
      weatherData = await fetchWeatherDataByCoords(lat, lon);
    } else if (city) {
      weatherData = await fetchWeatherDataByCity(city);
    } else {
      return res.status(400).json({ message: 'City or coordinates are required' });
    }

    const forecastData = weatherData.list;
    const { lat: cityLat, lon: cityLon } = weatherData.city.coord;

    const dailyForecast = getDailyForecast(forecastData);
    const packingAdvice = generatePackingAdvice(dailyForecast);
    const pollutionData = await fetchAirPollutionData(cityLat, cityLon);

    res.json({
      forecast: dailyForecast,
      packingAdvice,
      pollutionData
    });
  } catch (error) {
    console.error('Error handling request:', error.message);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

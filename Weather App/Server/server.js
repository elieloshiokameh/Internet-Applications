require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

const API_KEY = '113e7529a5fc767ca4778b3fc0c0a05d';

app.use(cors());

const fetchWeatherData = async (city) => {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Weather API error:', error.response ? error.response.data : error.message);
    throw new Error('Error fetching weather data');
  }
};

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

const getDailyForecastWithTempRange = (forecast) => {
  const dailyForecast = [];
  let tempMin = null;
  let tempMax = null;
  let currentDay = null;

  forecast.forEach((entry, index) => {
    const entryDate = new Date(entry.dt * 1000).toDateString();
    if (currentDay === null) {
      currentDay = entryDate;
      tempMin = entry.main.temp_min;
      tempMax = entry.main.temp_max;
    }
    if (currentDay === entryDate) {
      tempMin = Math.min(tempMin, entry.main.temp_min);
      tempMax = Math.max(tempMax, entry.main.temp_max);
    }
    if (index % 8 === 7 || index === forecast.length - 1) {
      dailyForecast.push({
        date: currentDay,
        temp_min: tempMin,
        temp_max: tempMax,
        wind_speed: entry.wind.speed,
        rain: entry.rain ? entry.rain['3h'] || 0 : 0
      });
      currentDay = null;
    }
  });
  return dailyForecast;
};

const checkForElevatedPollution = (pollutionData) => {
  const elevatedPollutants = [];

  // Example thresholds for "Good" air quality (adjust according to API documentation)
  if (pollutionData.pm2_5 > 12) elevatedPollutants.push('PM2.5');
  if (pollutionData.pm10 > 50) elevatedPollutants.push('PM10');
  if (pollutionData.o3 > 100) elevatedPollutants.push('O3');
  if (pollutionData.no2 > 100) elevatedPollutants.push('NO2');
  if (pollutionData.so2 > 20) elevatedPollutants.push('SO2');
  if (pollutionData.co > 4) elevatedPollutants.push('CO');

  return elevatedPollutants.length > 0 ? elevatedPollutants : null;
};


const generatePackingAdvice = (forecast) => {
  let packingAdvice = 'Packing recommendation: ';
  const hasRain = forecast.some(day => day.rain > 0);
  const hasCold = forecast.some(day => day.temp_min < 8);
  const hasHot = forecast.some(day => day.temp_max > 24);

  if (hasRain) packingAdvice += 'Bring an umbrella, rain is expected. \n';
  if (hasCold  && hasHot || hasCold && !hasHot) packingAdvice += 'Prepare for varying temperatures and pack accordingly. \n';
  else if (hasCold) packingAdvice += 'Prepare for cold weather and pack accordingly. \n';
  else if (hasHot) packingAdvice += 'Prepare for hot weather and pack accordingly. \n';
  else if (!hasCold && !hasHot) packingAdvice += 'Weather is mild.\n';

  return packingAdvice;
};
app.get('/hourly', async (req, res) => {
  const city = req.query.city;
  const date = req.query.date;

  try {
    const weatherData = await fetchWeatherData(city);
    const forecastData = weatherData.list;

    // Filter hourly data for the selected day
    const hourlyForecast = forecastData.filter(entry => {
      const entryDate = new Date(entry.dt * 1000).toDateString();
      return entryDate === date;
    }).map(entry => ({
      time: new Date(entry.dt * 1000).toLocaleTimeString(),
      temp: entry.main.temp,
      wind_speed: entry.wind.speed,
      rain: entry.rain ? entry.rain['3h'] || 0 : 0,
      description: entry.weather[0].description
    }));

    console.log(hourlyForecast)
    res.json({ hourlyForecast });
  } catch (error) {
    console.error('Error handling request:', error.message);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
});


app.get('/weather', async (req, res) => {
  const city = req.query.city;

  try {
    const weatherData = await fetchWeatherData(city);
    const forecastData = weatherData.list;

    const dailyForecast = getDailyForecastWithTempRange(forecastData);
    const packingAdvice = generatePackingAdvice(dailyForecast);

    const { lat, lon } = weatherData.city.coord;
    const pollutionData = await fetchAirPollutionData(lat, lon);
    const elevatedPollutants = checkForElevatedPollution(pollutionData);


    res.json({
      forecast: dailyForecast,
      packingAdvice,
      pollutionData,
      elevatedPollutants
    });
  } catch (error) {
    console.error('Error handling request:', error.message);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

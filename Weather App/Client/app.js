new Vue({
  el: '#app',
  data: {
    city: '',
    forecast: [],
    pollutionData: {},
    packingAdvice: '',
    errorMessage: '',
    showModal: false,
    selectedDay: null,
    hourlyForecast: [],
    showPollutionChart: false,
    pollutionChart: null,
    hourlyChart: null,
    citySuggestions: [],
    debounceTimeout: null,
    pollutionWarning: ''
  },
  methods: {
    async getWeather() {

      this.errorMessage = '';
      this.pollutionWarning = '';
      this.forecast = [];
      this.showPollutionChart = false;

      try {
        const response = await fetch(`http://localhost:3000/weather?city=${encodeURIComponent(this.city)}`);
        const data = await response.json();

        if (response.status === 200) {
          this.forecast = data.forecast;
          this.packingAdvice = data.packingAdvice;
          this.pollutionData = data.pollutionData;

          // Check for elevated pollution levels
          if (data.elevatedPollutants && data.elevatedPollutants.length > 0) {
            this.pollutionWarning = `Warning: Elevated levels of ${data.elevatedPollutants.join(', ')} detected.`;
          } else {
            this.pollutionWarning = '';  // No elevated pollution levels
          }

          if (this.pollutionData) {
            this.showPollutionChart = true;
            this.$nextTick(() => {
              this.updatePollutionChart(this.pollutionData);
            });
          }
        } else {
          this.errorMessage = data.message || 'An error occurred while fetching weather data.';
        }
      } catch (error) {
        this.errorMessage = 'Failed to fetch weather data. Please try again later.';
        console.error(error);
      }
    },
    async fetchCitySuggestions() {
      if (!this.city) {
        this.citySuggestions = [];
        return;
      }

      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(async () => {
        const apiKey = '113e7529a5fc767ca4778b3fc0c0a05d';
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${this.city}&limit=5&appid=${apiKey}`;

        try {
          const response = await fetch(url);
          const suggestions = await response.json();
          this.citySuggestions = suggestions.map(city => ({
            name: `${city.name}, ${city.country}`,
            lat: city.lat,
            lon: city.lon
          }));
        } catch (error) {
          console.error('Error fetching city suggestions:', error);
        }
      }, 300);
    },
    selectCity(cityName) {
      this.city = cityName;
      this.citySuggestions = [];
      this.getWeather();
    },
    closeModal() {
      this.showModal = false;
    },

    updatePollutionChart(pollutionData) {
      const ctx = document.getElementById('pollutionChart').getContext('2d');
      if (this.pollutionChart) {
        this.pollutionChart.destroy();
      }

      this.pollutionChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['PM2.5', 'PM10', 'O3', 'NO2', 'SO2', 'CO'],
          datasets: [{
            label: 'Pollutant Levels',
            data: [
              pollutionData.pm2_5,
              pollutionData.pm10,
              pollutionData.o3,
              pollutionData.no2,
              pollutionData.so2,
              pollutionData.co
            ],
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(251, 23, 237, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(251, 23, 237, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    },

    async showHourlyForecast(day) {
      this.selectedDay = day;
      this.showModal = true;

      const response = await fetch(`http://localhost:3000/hourly?city=${encodeURIComponent(this.city)}&date=${encodeURIComponent(day.date)}`);
      const data = await response.json();
      console.log(data)
      this.hourlyForecast = data.hourlyForecast;

      this.$nextTick(() => {
        this.updateHourlyForecastChart(this.hourlyForecast);
      });
    },

    updateHourlyForecastChart(hourlyData) {
      const ctx = document.getElementById('hourlyRainChart').getContext('2d');
      if (this.HourlyChart) {
        this.HourlyChart.destroy();
      }

      this.HourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: hourlyData.map(hour => hour.time),
          datasets: [
            {
              label: 'Rain (mm)',
              data: hourlyData.map(hour => hour.rain || 0),
              borderColor: 'rgba(54, 162, 235, 1)',
              fill: false
            },
            {
              label: 'Temperature (°C)',
              data: hourlyData.map(hour => hour.temp),
              borderColor: 'rgba(255, 99, 132, 1)',
              fill: false
            },
            {
              label: 'Wind Speed (m/s)',
              data: hourlyData.map(hour => hour.wind_speed),
              borderColor: 'rgba(75, 192, 192, 1)',
              fill: false
            }
          ]
        },
        options: {
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Value'
              },
              min: 0
            }
          }
        }
      });
    },

    closeModal() {
      this.showModal = false;
    }
  }
});

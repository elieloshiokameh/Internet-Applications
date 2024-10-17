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
    hourlyChart: null, // Added for hourly forecast chart
    citySuggestions: [],  // To store city suggestions
    debounceTimeout: null
  },
  methods: {
    async getWeather() {
      try {
        const response = await fetch(`http://localhost:3000/weather?city=${encodeURIComponent(this.city)}`);
        const data = await response.json();

        if (response.status === 200) {
          this.forecast = data.forecast;
          this.packingAdvice = data.packingAdvice;
          this.pollutionData = data.pollutionData;

          // Show pollution chart only if we have pollution data
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
      }, 300);  // Debounce input by 300ms
    },
    selectCity(cityName) {
      this.city = cityName;
      this.citySuggestions = [];
      this.getWeather();  // Automatically fetch the weather for the selected city
    },
    closeModal() {
      this.showModal = false;
    },

    // Method to update the pollution chart
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

    // Method to show the hourly forecast for the selected day
    async openModal(day) {
      this.showModal = true;
      this.selectedDay = day;

      // Fetch hourly forecast for the selected day
      try {
        const response = await fetch(`/hourly-forecast?city=${this.city}&date=${day.date}`);
        const data = await response.json();
        this.hourlyForecast = data.hourlyForecast;

        // Now display the chart
        this.displayHourlyChart(this.hourlyForecast);
      } catch (error) {
        this.errorMessage = 'Error fetching hourly forecast data.';
      }
    },
    closeModal() {
      this.showModal = false;
    },
    displayHourlyChart(hourlyData) {
      const ctx = document.getElementById('hourlyForecastChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: hourlyData.map(hour => new Date(hour.dt * 1000).toLocaleTimeString()),
          datasets: [{
            label: 'Temperature (°C)',
            data: hourlyData.map(hour => hour.main.temp),
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false,
          }]
        },
        options: {
          responsive: true,
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'hour',
                tooltipFormat: 'HH:mm',
              }
            }]
          }
        }
      });
    }
  }
});

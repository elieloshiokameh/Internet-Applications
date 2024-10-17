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
    hourlyChart: null // Added for hourly forecast chart
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
    showHourlyForecast(day) {
      this.selectedDay = day;
      this.showModal = true;

      // Filter the hourly forecast for the selected day
      const selectedDate = new Date(day.dt * 1000).toDateString();
      this.hourlyForecast = this.forecast.filter(item => {
        const itemDate = new Date(item.dt * 1000).toDateString();
        return itemDate === selectedDate;
      });

      this.$nextTick(() => {
        this.updateHourlyChart(this.hourlyForecast);
      });
    },

    // Method to update the hourly forecast chart
    updateHourlyChart(hourlyForecast) {
      const ctx = document.getElementById('hourlyRainChart').getContext('2d');
      if (this.hourlyChart) {
        this.hourlyChart.destroy();
      }

      this.hourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: hourlyForecast.map(item => new Date(item.dt * 1000).getHours() + ":00"),
          datasets: [{
            label: 'Rain (mm)',
            data: hourlyForecast.map(item => item.rain || 0),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.4
          }, {
            label: 'Temperature (°C)',
            data: hourlyForecast.map(item => item.main.temp),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            tension: 0.4
          }, {
            label: 'Wind Speed (m/s)',
            data: hourlyForecast.map(item => item.wind.speed),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4
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

    closeModal() {
      this.showModal = false;
      this.hourlyForecast = [];
    }
  }
});

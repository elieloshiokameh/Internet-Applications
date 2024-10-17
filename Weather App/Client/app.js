new Vue({
  el: '#app',
  data: {
    city: '',
    forecast: [],
    pollutionData: {},
    packingAdvice: '',
    errorMessage: ''
  },
  methods: {
    async getWeather() {
      try {
        const response = await fetch(`http://localhost:3000/weather?city=${encodeURIComponent(this.city)}`);
        const data = await response.json();
    
        if (response.status === 200) {
          // Process daily forecast data with temperature ranges
          this.forecast = data.forecast;
          this.packingAdvice = data.packingAdvice;
          this.pollutionData = data.pollutionData;
    
          this.$nextTick(() => {
            this.updatePollutionChart(data.pollutionData);
          });
        } else {
          this.errorMessage = data.message || 'An error occurred while fetching weather data.';
        }
      } catch (error) {
        this.errorMessage = 'Failed to fetch weather data. Please try again later.';
        console.error(error);
      }
    },
    
    updatePollutionChart(pollutionData) {
      const ctx = document.getElementById('pollutionChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['CO', 'NO', 'NO2', 'O3', 'SO2', 'PM2.5', 'PM10', 'NH3'],
          datasets: [{
            label: 'Pollutant Levels (μg/m³)',
            data: [
              pollutionData.co, pollutionData.no, pollutionData.no2,
              pollutionData.o3, pollutionData.so2, pollutionData.pm2_5,
              pollutionData.pm10, pollutionData.nh3
            ],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
              'rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)'
            ]
          }]
        }
      });
    }
  }
});

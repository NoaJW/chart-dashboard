import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Highcharts from 'highcharts';
import Drilldown from 'highcharts/modules/drilldown';
Drilldown(Highcharts);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  data: any;
  days: any;
  minTemp: any;
  maxTemp: any;
  days_hours: any;
  humidity: any;
  radiation: any;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=1.29&longitude=103.85&hourly=relativehumidity_2m,direct_radiation&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FSingapore&start_date=2023-10-01&end_date=2023-10-10';
    this.http.get(url).subscribe(response => {      // async callback
      this.data = response;
      this.days = this.data.daily["time"]
      this.days_hours = this.data.hourly["time"]
      this.minTemp = this.data.daily["temperature_2m_min"]
      this.maxTemp = this.data.daily["temperature_2m_max"]
      this.humidity = this.data.hourly["relativehumidity_2m"]
      this.radiation = this.data.hourly["direct_radiation"]

      // prepare values for charts
      // humidity values
      let averageDailyHumidity = [];
      for (let i = 0; i < this.humidity.length; i += 24) {
        const hourlyValues = this.humidity.slice(i, i + 24);
        const sum = hourlyValues.reduce((acc, val) => acc + val, 0);
        const averageHourlyValues = Math.round(sum / hourlyValues.length);
        averageDailyHumidity.push(averageHourlyValues);
      }

      const humiditySeriesData = this.days.map((day, idx) => [day, averageDailyHumidity[idx]]);

      const dailyHours = this.days_hours.slice(0, 24).map(dateTime => {    // fixed
        return dateTime.split('T')[1];
      });

      const timeHumidityPairs = this.humidity.map((value, idx) => {
        const time = dailyHours[idx % dailyHours.length];
        return [time, value];           // 240 values (must split in )
      });

      let drilldownSeriesData = [];
      for (let i = 0; i < this.days.length; i++) {
        const hourlyValues = timeHumidityPairs.slice(i * 24, (i + 1) * 24);
        drilldownSeriesData.push([this.days[i], hourlyValues]);
      }

      // Get first dateTime
      let firstDateTime = new Date(this.days_hours[0]);
      let firstDateTimeSplit = [];
      firstDateTimeSplit.push(firstDateTime.getFullYear(), firstDateTime.getMonth(), firstDateTime.getDate(), firstDateTime.getHours(), firstDateTime.getMinutes());

      // Create charts
      this.createTempChart();
      this.createHumidityChart(humiditySeriesData, drilldownSeriesData);
      this.createRadiationChart(firstDateTimeSplit);
    });
  }

  private createTempChart() {
    // @ts-ignore
    const chart = Highcharts.chart("temp-chart", {
      chart: {
        type: 'line',
      },
      title: {
        text: 'Daily Min and Max Temperature'
      },
      xAxis: {
        title: {
          text: 'Day (YYYY-MM-DD)'
        },
        categories: this.days
      },
      yAxis: {
        title: {
          text: 'Temperature (°C)'
        }
      },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: true
          },
          enableMouseTracking: false
        }
      },
      series: [{
        name: 'Min temperature',
        data: this.minTemp
      }, {
        name: 'Max temperature',
        data: this.maxTemp
      }]
    });
  }

  private createHumidityChart(humiditySeriesData, drilldownSeriesData) {
    // @ts-ignore
    const chart = Highcharts.chart('humidity-chart', {
      chart: {
        type: 'column',
      },
      title: {
        text: 'Hourly Relative Humidity'
      },
      subtitle: {
        text: 'Click a column to drilldown to its hourly view'
      },
      xAxis: {
        type: 'category',
      },
      yAxis: {
        title: {
          text: 'Total relative humidity (%)'
        }
      },
      legend: {
        enabled: true
      },
      plotOptions: {
        series: {
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            format: '{point.y}'
          }
        }
      },
      tooltip: {
        pointFormat: 'Relative humidity: {point.y}'
      },
      series: [
        {
          name: 'Day',
          colorByPoint: true,
          data: humiditySeriesData.map((data, index) => ({
            name: data[0],
            y: data[1],
            drilldown: data[0]
          }))
        }
      ],
      drilldown: {
        breadcrumbs: {
          position: {
            align: 'right'
          }
        },
        series: drilldownSeriesData.map((data, index) => ({
          name: data[0],
          id: data[0],
          data: data[1]
        }))
      },
    });
  }

  private createRadiationChart(startDateTime) {
    // @ts-ignore
    Highcharts.chart('radiation-chart', {
      chart: {
        type: 'area',
      },
      title: {
        text: 'Hourly Direct Radiation'
      },
      subtitle: {
        text: 'Hover over chart to see individual points'
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: 'Day'
        }
      },
      yAxis: {
        title: {
          text: 'Direct Radiation'
        }
      },
      tooltip: {
        pointFormat: 'Direct radiation: {point.y:,.1f}'
      },
      plotOptions: {
        area: {
          pointStart: Date.UTC(startDateTime[0], startDateTime[1], startDateTime[2], startDateTime[3], startDateTime[4]),
          pointInterval: 3600000,   // next point at the next hour
          marker: {
            enabled: false,
            symbol: 'circle',
            radius: 2,
            states: {
              hover: {
                enabled: true
              }
            }
          }
        }
      },
      series: [{
        name: 'Day',
        data: this.radiation
      }]
    });
  }
}








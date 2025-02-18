<template>
  <div class="analytics">
    <div class="charts-grid">
      <!-- Source Activity Chart -->
      <div class="chart-card">
        <h3>Source Activity</h3>
        <Line :data="sourceActivityData" :options="chartOptions" />
      </div>

      <!-- Content Metrics Chart -->
      <div class="chart-card">
        <h3>Content Metrics</h3>
        <Bar :data="contentMetricsData" :options="chartOptions" />
      </div>

      <!-- Event Distribution -->
      <div class="chart-card">
        <h3>Event Distribution</h3>
        <Pie :data="eventDistributionData" :options="chartOptions" />
      </div>
    </div>

    <!-- System Logs -->
    <div class="logs-section">
      <h3>System Logs</h3>
      <div class="log-filters">
        <select v-model="logCategory">
          <option value="all">All Categories</option>
          <option value="user">User</option>
          <option value="system">System</option>
          <option value="scraper">Scraper</option>
        </select>
        <select v-model="logLevel">
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>
      <div class="logs-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Level</th>
              <th>Category</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log._id" :class="log.level">
              <td>{{ formatDate(log.timestamp) }}</td>
              <td>{{ log.level }}</td>
              <td>{{ log.category }}</td>
              <td>{{ log.message }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { Line, Bar, Pie } from 'vue-chartjs'
import { useAnalyticsStore } from '../stores/analytics'

export default {
  name: 'Analytics',
  components: { Line, Bar, Pie },
  setup() {
    const analytics = useAnalyticsStore()
    const logCategory = ref('all')
    const logLevel = ref('all')

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false
    }

    const fetchData = async () => {
      await analytics.fetchMetrics()
      await analytics.fetchLogs()
    }

    // Chart data computeds...
    const sourceActivityData = computed(() => ({
      labels: analytics.sourceActivityLabels || [],
      datasets: [{
        label: 'Scrapes',
        data: analytics.sourceActivityData || [],
        borderColor: '#42b983',
        fill: false
      }]
    }))

    const contentMetricsData = computed(() => ({
      labels: ['Created', 'Updated', 'Deleted'],
      datasets: [{
        label: 'Content Actions',
        data: [0, 0, 0], // Default values until data loads
        backgroundColor: ['#42b983', '#2c3e50', '#dc3545']
      }]
    }))

    const eventDistributionData = computed(() => ({
      labels: ['Success', 'Failed', 'Pending'],
      datasets: [{
        data: [0, 0, 0], // Default values until data loads
        backgroundColor: ['#42b983', '#dc3545', '#ffc107']
      }]
    }))

    const filteredLogs = computed(() => {
      return analytics.logs.filter(log => {
        if (logCategory.value !== 'all' && log.category !== logCategory.value) return false
        if (logLevel.value !== 'all' && log.level !== logLevel.value) return false
        return true
      })
    })

    onMounted(fetchData)

    return {
      logCategory,
      logLevel,
      filteredLogs,
      sourceActivityData,
      contentMetricsData,
      eventDistributionData,
      chartOptions
    }
  }
}
</script>

<style scoped>
.analytics {
  padding: 1rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.logs-section {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.log-filters {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}

.logs-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

tr.error { color: #dc3545; }
tr.warn { color: #ffc107; }
</style>

<template>
  <div class="stats-container">
    <div class="stats-header">
      <h2>博客访问统计</h2>
      <div class="date-selector">
        <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="year">全年</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :disabled="timeRange !== 'custom'"
          @change="handleCustomRangeChange"
        />
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总访问量</span>
              <el-icon class="icon"><View /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="main-value">{{ formatNumber(overviewData.totalViews) }}</div>
            <div class="trend">
              <span>较前{{ timeRangeText }} </span>
              <span :class="overviewData.viewsTrend > 0 ? 'up' : 'down'">
                <el-icon><component :is="overviewData.viewsTrend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
                {{ Math.abs(overviewData.viewsTrend) }}%
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>访客数</span>
              <el-icon class="icon"><User /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="main-value">{{ formatNumber(overviewData.visitors) }}</div>
            <div class="trend">
              <span>较前{{ timeRangeText }} </span>
              <span :class="overviewData.visitorsTrend > 0 ? 'up' : 'down'">
                <el-icon><component :is="overviewData.visitorsTrend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
                {{ Math.abs(overviewData.visitorsTrend) }}%
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>页面浏览量</span>
              <el-icon class="icon"><Document /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="main-value">{{ formatNumber(overviewData.pageViews) }}</div>
            <div class="trend">
              <span>较前{{ timeRangeText }} </span>
              <span :class="overviewData.pageViewsTrend > 0 ? 'up' : 'down'">
                <el-icon><component :is="overviewData.pageViewsTrend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
                {{ Math.abs(overviewData.pageViewsTrend) }}%
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>平均停留时间</span>
              <el-icon class="icon"><Timer /></el-icon>
            </div>
          </template>
          <div class="card-content">
            <div class="main-value">{{ formatTime(overviewData.avgDuration) }}</div>
            <div class="trend">
              <span>较前{{ timeRangeText }} </span>
              <span :class="overviewData.durationTrend > 0 ? 'up' : 'down'">
                <el-icon><component :is="overviewData.durationTrend > 0 ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
                {{ Math.abs(overviewData.durationTrend) }}%
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图 -->
    <el-card class="chart-card">
      <div class="chart-header">
        <h3>访问趋势</h3>
        <el-radio-group v-model="trendMetric" size="small" @change="changeTrendMetric">
          <el-radio-button label="views">访问量</el-radio-button>
          <el-radio-button label="visitors">访客数</el-radio-button>
          <el-radio-button label="avgDuration">停留时间</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="trendChartRef" class="chart-container"></div>
    </el-card>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <h3>热门文章</h3>
          <div ref="topArticlesChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <h3>访问来源</h3>
          <div ref="sourceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <h3>设备分布</h3>
          <div ref="deviceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <h3>地域分布</h3>
          <div ref="locationChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 文章访问排行表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <h3>文章访问排行</h3>
          <el-select v-model="tableMetric" size="small" @change="changeTableMetric">
            <el-option label="访问量排序" value="views" />
            <el-option label="平均停留时间排序" value="duration" />
            <el-option label="转化率排序" value="conversion" />
          </el-select>
        </div>
      </template>
      <el-table :data="articleRankings" style="width: 100%" border stripe>
        <el-table-column type="index" label="排名" width="80" align="center" />
        <el-table-column prop="title" label="文章标题" min-width="250">
          <template #default="scope">
            <el-link type="primary" @click="viewArticle(scope.row.id)">{{ scope.row.title }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="views" label="访问量" width="100" align="center" sortable />
        <el-table-column prop="visitors" label="访客数" width="100" align="center" sortable />
        <el-table-column prop="avgDuration" label="平均停留时间" width="150" align="center" sortable>
          <template #default="scope">
            {{ formatTime(scope.row.avgDuration) }}
          </template>
        </el-table-column>
        <el-table-column prop="bounceRate" label="跳出率" width="100" align="center" sortable>
          <template #default="scope">
            {{ scope.row.bounceRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="conversionRate" label="转化率" width="100" align="center" sortable>
          <template #default="scope">
            {{ scope.row.conversionRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="date" label="发布日期" width="120" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.date) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, View, User, Document, Timer, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

// 时间范围类型
type TimeRangeType = 'today' | 'week' | 'month' | 'year' | 'custom'

// 数据指标类型
type MetricType = 'views' | 'visitors' | 'avgDuration'

// 概览数据接口
interface OverviewData {
  totalViews: number
  visitors: number
  pageViews: number
  avgDuration: number
  viewsTrend: number
  visitorsTrend: number
  pageViewsTrend: number
  durationTrend: number
}

// 文章排行接口
interface ArticleRanking {
  id: number
  title: string
  views: number
  visitors: number
  avgDuration: number
  bounceRate: number
  conversionRate: number
  date: string
}

// 趋势数据接口
interface TrendData {
  date: string
  views: number
  visitors: number
  avgDuration: number
}

// 响应式状态
const timeRange = ref<TimeRangeType>('week')
const customDateRange = ref<string[]>([])
const trendMetric = ref<MetricType>('views')
const tableMetric = ref<'views' | 'duration' | 'conversion'>('views')
const loading = ref(false)

// 图表引用
const trendChartRef = ref<HTMLElement>()
const topArticlesChartRef = ref<HTMLElement>()
const sourceChartRef = ref<HTMLElement>()
const deviceChartRef = ref<HTMLElement>()
const locationChartRef = ref<HTMLElement>()

// 图表实例
let trendChart: echarts.ECharts | null = null
let topArticlesChart: echarts.ECharts | null = null
let sourceChart: echarts.ECharts | null = null
let deviceChart: echarts.ECharts | null = null
let locationChart: echarts.ECharts | null = null

// 概览数据
const overviewData = reactive<OverviewData>({
  totalViews: 0,
  visitors: 0,
  pageViews: 0,
  avgDuration: 0,
  viewsTrend: 0,
  visitorsTrend: 0,
  pageViewsTrend: 0,
  durationTrend: 0
})

// 文章排行数据
const articleRankings = ref<ArticleRanking[]>([])

// 趋势数据
const trendData = ref<TrendData[]>([])

// 计算属性：时间范围文本
const timeRangeText = computed(() => {
  const map = {
    today: '日',
    week: '周',
    month: '月',
    year: '年',
    custom: '期'
  }
  return map[timeRange.value]
})

// 处理时间范围变化
const handleTimeRangeChange = (value: TimeRangeType) => {
  if (value === 'custom') {
    // 设置默认的自定义日期范围（例如：最近7天）
    const end = dayjs().format('YYYY-MM-DD')
    const start = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
    customDateRange.value = [start, end]
  }
  fetchData()
}

// 处理自定义时间范围变化
const handleCustomRangeChange = () => {
  if (timeRange.value === 'custom') {
    fetchData()
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
}

// 更换趋势指标
const changeTrendMetric = () => {
  renderTrendChart()
}

// 更换表格排序指标
const changeTableMetric = () => {
  sortArticleRankings()
}

// 查看文章详情
const viewArticle = (id: number) => {
  ElMessage.info(`查看文章ID: ${id}`)
}

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 格式化时间（秒转为mm:ss）
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 格式化日期
const formatDate = (date: string): string => {
  return dayjs(date).format('YYYY-MM-DD')
}

// 排序文章排行
const sortArticleRankings = () => {
  const sortMap = {
    views: 'views',
    duration: 'avgDuration',
    conversion: 'conversionRate'
  }
  const sortKey = sortMap[tableMetric.value] as keyof ArticleRanking
  
  articleRankings.value.sort((a, b) => {
    return (b[sortKey] as number) - (a[sortKey] as number)
  })
}

// 生成示例数据
const generateMockData = () => {
  // 生成概览数据
  overviewData.totalViews = Math.floor(Math.random() * 100000) + 50000
  overviewData.visitors = Math.floor(overviewData.totalViews * 0.7)
  overviewData.pageViews = Math.floor(overviewData.totalViews * 1.5)
  overviewData.avgDuration = Math.floor(Math.random() * 300) + 60
  
  overviewData.viewsTrend = Math.floor(Math.random() * 40) - 20
  overviewData.visitorsTrend = Math.floor(Math.random() * 40) - 20
  overviewData.pageViewsTrend = Math.floor(Math.random() * 40) - 20
  overviewData.durationTrend = Math.floor(Math.random() * 40) - 20
  
  // 生成趋势数据
  const days = timeRange.value === 'today' ? 24 : timeRange.value === 'week' ? 7 : timeRange.value === 'month' ? 30 : 12
  const format = timeRange.value === 'today' ? 'HH:00' : timeRange.value === 'year' ? 'YYYY-MM' : 'MM-DD'
  
  trendData.value = Array.from({ length: days }, (_, index) => {
    let date
    if (timeRange.value === 'today') {
      date = dayjs().hour(index).format(format)
    } else if (timeRange.value === 'week') {
      date = dayjs().subtract(6 - index, 'day').format(format)
    } else if (timeRange.value === 'month') {
      date = dayjs().date(index + 1).format(format)
    } else if (timeRange.value === 'year') {
      date = dayjs().month(index).format(format)
    } else {
      date = dayjs().subtract(days - 1 - index, 'day').format('MM-DD')
    }
    
    return {
      date,
      views: Math.floor(Math.random() * 1000) + 500,
      visitors: Math.floor(Math.random() * 800) + 300,
      avgDuration: Math.floor(Math.random() * 300) + 60
    }
  })
  
  // 生成文章排行数据
  articleRankings.value = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    title: `博客文章标题 ${index + 1}：这是一个示例文章标题，用于展示数据分析`,
    views: Math.floor(Math.random() * 5000) + 1000,
    visitors: Math.floor(Math.random() * 3000) + 500,
    avgDuration: Math.floor(Math.random() * 300) + 60,
    bounceRate: Math.floor(Math.random() * 60) + 20,
    conversionRate: Math.floor(Math.random() * 20) + 5,
    date: dayjs().subtract(Math.floor(Math.random() * 90), 'day').format('YYYY-MM-DD')
  }))
  
  sortArticleRankings()
}

// 获取数据
const fetchData = () => {
  loading.value = true
  
  // 模拟API请求
  setTimeout(() => {
    generateMockData()
    renderCharts()
    loading.value = false
  }, 800)
}

// 渲染所有图表
const renderCharts = () => {
  renderTrendChart()
  renderTopArticlesChart()
  renderSourceChart()
  renderDeviceChart()
  renderLocationChart()
}

// 渲染趋势图表
const renderTrendChart = () => {
  if (!trendChartRef.value) return
  
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  
  const metricMap = {
    views: '访问量',
    visitors: '访客数',
    avgDuration: '平均停留时间(秒)'
  }
  
  const option = {
    title: {
      text: `${metricMap[trendMetric.value]}趋势`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: trendData.value.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: metricMap[trendMetric.value],
        type: 'line',
        data: trendData.value.map(item => item[trendMetric.value]),
        smooth: true,
        areaStyle: {}
      }
    ],
    color: ['#409EFF']
  }
  
  trendChart.setOption(option)
}

// 渲染热门文章图表
const renderTopArticlesChart = () => {
  if (!topArticlesChartRef.value) return
  
  if (!topArticlesChart) {
    topArticlesChart = echarts.init(topArticlesChartRef.value)
  }
  
  const top5Articles = articleRankings.value.slice(0, 5)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: top5Articles.map(item => item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title).reverse()
    },
    series: [
      {
        name: '访问量',
        type: 'bar',
        data: top5Articles.map(item => item.views).reverse()
      }
    ],
    color: ['#67C23A']
  }
  
  topArticlesChart.setOption(option)
}

// 渲染来源图表
const renderSourceChart = () => {
  if (!sourceChartRef.value) return
  
  if (!sourceChart) {
    sourceChart = echarts.init(sourceChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: ['搜索引擎', '社交媒体', '直接访问', '外部链接', '其他']
    },
    series: [
      {
        name: '访问来源',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 1048, name: '搜索引擎' },
          { value: 735, name: '社交媒体' },
          { value: 580, name: '直接访问' },
          { value: 484, name: '外部链接' },
          { value: 300, name: '其他' }
        ]
      }
    ]
  }
  
  sourceChart.setOption(option)
}

// 渲染设备图表
const renderDeviceChart = () => {
  if (!deviceChartRef.value) return
  
  if (!deviceChart) {
    deviceChart = echarts.init(deviceChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: ['移动端', '桌面端', '平板', '其他']
    },
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1548, name: '移动端' },
          { value: 835, name: '桌面端' },
          { value: 310, name: '平板' },
          { value: 147, name: '其他' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  deviceChart.setOption(option)
}

// 渲染地域图表
const renderLocationChart = () => {
  if (!locationChartRef.value) return
  
  if (!locationChart) {
    locationChart = echarts.init(locationChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '南京']
    },
    series: [
      {
        name: '访问量',
        type: 'bar',
        data: [1862, 1531, 1283, 1120, 956, 824, 721, 634]
      }
    ],
    color: ['#E6A23C']
  }
  
  locationChart.setOption(option)
}

// 窗口大小变化时重新调整图表大小
const handleResize = () => {
  trendChart?.resize()
  topArticlesChart?.resize()
  sourceChart?.resize()
  deviceChart?.resize()
  locationChart?.resize()
}

// 组件挂载时
onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

// 组件卸载前
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  topArticlesChart?.dispose()
  sourceChart?.dispose()
  deviceChart?.dispose()
  locationChart?.dispose()
})
</script>

<style scoped>
.stats-container {
  padding: 20px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.date-selector {
  display: flex;
  gap: 15px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.trend {
  font-size: 14px;
  color: #909399;
}

.up {
  color: #67C23A;
}

.down {
  color: #F56C6C;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-container {
  height: 400px;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon {
  font-size: 20px;
  color: #409EFF;
}
</style> 
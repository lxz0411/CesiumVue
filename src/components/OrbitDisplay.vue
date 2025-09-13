<template>
  <div class="orbit-controls">
    <div class="control-panel">
      <div class="header-section">
        <h3>轨道显示控制</h3>
        <div class="header-buttons">
          <button class="toggle-panel-btn" @click="togglePanel" :title="isPanelCollapsed ? '展开面板' : '收起面板'">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" :class="{ 'rotated': !isPanelCollapsed }">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </button>
        <button class="quick-load-btn" @click="loadOrbitData" :disabled="loading">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {{ loading ? '加载中...' : '加载轨道' }}
        </button>
      </div>
      </div>
      <div class="panel-content" :class="{ 'collapsed': isPanelCollapsed }">
      <div class="control-group">
        <label>
          <input type="checkbox" v-model="showOrbit" @change="toggleOrbit" />
          显示轨道
        </label>
      </div>
      <div class="control-group">
        <label>
          <input type="checkbox" v-model="showSatellite" @change="toggleSatellite" />
          显示卫星
        </label>
      </div>
      <div class="control-group">
        <label>
          轨道颜色:
          <input type="color" v-model="orbitColor" @change="updateOrbitColor" />
        </label>
      </div>
      <div class="control-group">
        <label>
          轨道宽度:
          <input type="range" min="1" max="10" v-model="orbitWidth" @change="updateOrbitWidth" />
          {{ orbitWidth }}px
        </label>
      </div>
      
      <div class="control-group">
        <label>
          轨道透明度:
          <input type="range" min="0.1" max="1" step="0.1" v-model="orbitOpacity" @change="updateOrbitOpacity" />
          {{ Math.round(orbitOpacity * 100) }}%
        </label>
      </div>
      <div class="control-group">
        <label>
          选择卫星:
          <select v-model="selectedSatelliteIndex" @change="loadSelectedSatellite" :disabled="loading">
            <option value="-1">请选择卫星</option>
            <option v-for="(satellite, index) in satelliteList" :key="index" :value="index">
              {{ satellite.sateName }} ({{ satellite.sateId }})
            </option>
          </select>
        </label>
      </div>

      
      <div class="control-group" v-if="satelliteEntity">
        <label>
          <input type="checkbox" v-model="isPlaying" @change="toggleAnimation" />
          播放动画
        </label>
      </div>
      
      <div class="control-group" v-if="satelliteEntity">
        <label>
          播放速度:
          <input type="range" min="0.1" max="10" step="0.1" v-model="playbackSpeed" @change="updatePlaybackSpeed" />
          {{ playbackSpeed }}x
        </label>
      </div>
      
      <div class="control-group" v-if="satelliteEntity">
        <button @click="resetAnimation" :disabled="loading">
          重置动画
        </button>
      </div>
      
      <div class="control-group">
        <button @click="resetCamera" :disabled="loading">
          重置视角
        </button>
      </div>
      
      <div class="control-group">
        <label>
          <input type="checkbox" v-model="trackOrbit" @change="toggleOrbitTracking" />
          跟踪轨道
        </label>
      </div>
      
      <div class="control-group" v-if="satelliteEntity">
        <label>
          卫星大小:
          <input type="range" min="0.5" max="5" step="0.1" v-model="satelliteScale" @change="updateSatelliteScale" />
          {{ satelliteScale }}x
        </label>
      </div>
      
      <div class="control-group">
        <label>
          <input type="checkbox" v-model="showOrbitTrail" @change="toggleOrbitTrail" />
          显示轨道轨迹
        </label>
      </div>
        
        <div class="control-group">
          <button @click="showAllSatellites" :disabled="loading || satelliteList.length === 0">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            显示所有卫星
          </button>
        </div>
        
        <div class="control-group">
          <button @click="clearAllSatellites" :disabled="loading">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            清除所有显示
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as Cesium from 'cesium'

// 响应式数据
const showOrbit = ref(false)
const showSatellite = ref(false)
const orbitColor = ref('#0066ff')
const orbitWidth = ref(3)
const loading = ref(false)
const selectedSatelliteIndex = ref(-1)
const satelliteList = ref([])
const isPlaying = ref(false)
const playbackSpeed = ref(1.0)
const orbitOpacity = ref(1.0)
const satelliteScale = ref(1.0)
const showOrbitTrail = ref(true)
const trackOrbit = ref(false)
const isPanelCollapsed = ref(false)

// Cesium相关变量
let viewer = null
let orbitEntity = null
let satelliteEntity = null
let allSatelliteEntities = [] // 存储所有卫星实体
let allOrbitEntities = [] // 存储所有轨道实体

// 获取viewer实例
const getViewer = () => {
  console.log('getViewer 被调用')
  console.log('window.cesiumViewer 存在:', !!window.cesiumViewer)
  if (window.cesiumViewer) {
    console.log('返回 viewer 实例')
    return window.cesiumViewer
  }
  console.log('viewer 实例不存在，返回 null')
  return null
}

// 切换面板显示/收起
const togglePanel = () => {
  isPanelCollapsed.value = !isPanelCollapsed.value
  console.log('面板状态切换:', isPanelCollapsed.value ? '收起' : '展开')
}

// 显示所有卫星和轨道
const showAllSatellites = async () => {
  console.log('开始显示所有卫星和轨道...')
  loading.value = true
  
  try {
    viewer = getViewer()
    if (!viewer) {
      throw new Error('无法获取Cesium viewer实例')
    }
    
    // 先清除现有的所有实体
    clearAllSatellites()
    
    if (satelliteList.value.length === 0) {
      alert('没有可显示的卫星数据，请先加载轨道数据')
      return
    }
    
    console.log(`开始加载 ${satelliteList.value.length} 个卫星的轨道和实体...`)
    
    // 为每个卫星创建轨道和实体
    for (let i = 0; i < satelliteList.value.length; i++) {
      const satellite = satelliteList.value[i]
      console.log(`处理卫星 ${i + 1}/${satelliteList.value.length}: ${satellite.sateName}`)
      
      // 转换轨道数据
      const positions = convertOrbitDataToPositions(satellite.pointList)
      if (positions.length === 0) {
        console.warn(`卫星 ${satellite.sateName} 没有有效的轨道数据，跳过`)
        continue
      }
      
      // 创建轨道实体
      const orbitEntity = createOrbitEntityForAll(positions, satellite.sateName, i)
      if (orbitEntity && orbitEntity !== null) {
        allOrbitEntities.push(orbitEntity)
      }
      
      // 创建卫星实体
      const satelliteEntity = createSatelliteEntityForAll(positions, satellite.sateName, i)
      if (satelliteEntity && satelliteEntity !== null) {
        allSatelliteEntities.push(satelliteEntity)
      }
    }
    
    console.log(`成功创建 ${allOrbitEntities.length} 个轨道实体和 ${allSatelliteEntities.length} 个卫星实体`)
    
    // 自动勾选显示选项
    showOrbit.value = true
    showSatellite.value = true
    
  } catch (error) {
    console.error('显示所有卫星失败:', error)
    alert(`显示所有卫星失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 清除所有卫星和轨道显示
const clearAllSatellites = () => {
  console.log('清除所有卫星和轨道显示...')
  
  viewer = getViewer()
  if (!viewer) {
    console.warn('无法获取viewer实例')
    return
  }
  
  // 清除所有轨道实体
  allOrbitEntities.forEach(entity => {
    if (entity && entity !== null) {
      viewer.entities.remove(entity)
    }
  })
  allOrbitEntities = []
  
  // 清除所有卫星实体
  allSatelliteEntities.forEach(entity => {
    if (entity && entity !== null) {
      viewer.entities.remove(entity)
    }
  })
  allSatelliteEntities = []
  
  // 清除当前选中的实体
  if (orbitEntity) {
    viewer.entities.remove(orbitEntity)
    orbitEntity = null
  }
  if (satelliteEntity) {
    viewer.entities.remove(satelliteEntity)
    satelliteEntity = null
  }
  
  // 重置选择状态
  selectedSatelliteIndex.value = -1
  
  console.log('所有实体已清除')
}

// 为所有卫星创建轨道实体
const createOrbitEntityForAll = (positions, satelliteName, index) => {
  console.log(`为卫星 ${satelliteName} 创建轨道实体...`)
  
  if (!viewer) {
    console.error('无法获取viewer实例')
    return null
  }
  
  // 创建时间属性数组
  const timePositions = positions.map(pos => ({
    time: pos.time,
    position: Cesium.Cartesian3.fromRadians(pos.longitude, pos.latitude, pos.height)
  }))
  
  // 使用不同的颜色区分不同卫星
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#a29bfe'
  ]
  const color = Cesium.Color.fromCssColorString(colors[index % colors.length])
  color.alpha = orbitOpacity.value
  
  const orbitEntity = viewer.entities.add({
    name: `${satelliteName}轨道`,
    polyline: {
      positions: timePositions.map(tp => tp.position),
      width: orbitWidth.value,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.3,
        color: color
      }),
      clampToGround: false,
      show: showOrbit.value && showOrbitTrail.value,
      depthFailMaterial: color.withAlpha(0.3)
    }
  })
  
  console.log(`轨道实体创建成功: ${satelliteName}`)
  return orbitEntity
}

// 为所有卫星创建卫星实体
const createSatelliteEntityForAll = (positions, satelliteName, index) => {
  console.log(`为卫星 ${satelliteName} 创建卫星实体...`)
  
  if (!viewer) {
    console.error('无法获取viewer实例')
    return null
  }
  
  if (positions.length === 0) {
    console.log('没有位置数据，跳过卫星创建')
    return null
  }
  
  // 创建时间属性数组
  const timePositions = positions.map(pos => ({
    time: pos.time,
    position: Cesium.Cartesian3.fromRadians(pos.longitude, pos.latitude, pos.height)
  }))
  
  // 使用不同的颜色区分不同卫星
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#a29bfe'
  ]
  const pointColor = Cesium.Color.fromCssColorString(colors[index % colors.length])
  
  try {
    // 创建卫星实体
    const satelliteEntity = viewer.entities.add({
      name: satelliteName,
      position: timePositions[0].position,
      // 使用点显示（更稳定）
      point: {
        pixelSize: 15 * satelliteScale.value,
        color: pointColor,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.NONE,
        show: showSatellite.value
      },
      // 添加标签显示卫星名称
      label: {
        text: satelliteName,
        font: '10pt sans-serif',
        fillColor: pointColor,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        heightReference: Cesium.HeightReference.NONE,
        show: showSatellite.value
      },
      // 添加时间属性用于动画
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: timePositions[0].time,
          stop: timePositions[timePositions.length - 1].time
        })
      ])
    })
    
    // 设置位置属性用于动画
    const positionProperty = new Cesium.SampledPositionProperty()
    timePositions.forEach(tp => {
      positionProperty.addSample(tp.time, tp.position)
    })
    
    satelliteEntity.position = positionProperty
    
    // 设置方向属性，让卫星始终朝向运动方向
    const orientationProperty = new Cesium.VelocityOrientationProperty(positionProperty)
    satelliteEntity.orientation = orientationProperty
    
    console.log(`卫星实体创建成功: ${satelliteName}`)
    return satelliteEntity
    
  } catch (error) {
    console.error(`创建卫星实体失败: ${satelliteName}`, error)
    return null
  }
}

// 加载轨道数据
const loadOrbitData = async () => {
  loading.value = true
  try {
    console.log('开始加载轨道数据...')
    const response = await fetch('/data/satellites.json')
    console.log('响应状态:', response.status, response.statusText)
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('轨道数据加载成功:', data)
    console.log('数据结构:', {
      hasSatePVList: !!data.satePVList,
      satePVListLength: data.satePVList ? data.satePVList.length : 0,
      firstSatellite: data.satePVList && data.satePVList[0] ? {
        sateId: data.satePVList[0].sateId,
        sateName: data.satePVList[0].sateName,
        pointListLength: data.satePVList[0].pointList ? data.satePVList[0].pointList.length : 0
      } : null
    })
    
    // 保存卫星列表
    if (data.satePVList && data.satePVList.length > 0) {
      satelliteList.value = data.satePVList
      console.log('找到', data.satePVList.length, '个卫星')
      
      // 默认加载第一个卫星
      selectedSatelliteIndex.value = 0
      loadSelectedSatellite()
    } else {
      alert('未找到卫星轨道数据')
    }
  } catch (error) {
    console.error('加载轨道数据失败:', error)
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    alert(`加载轨道数据失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 加载选中的卫星
const loadSelectedSatellite = () => {
  console.log('loadSelectedSatellite 被调用')
  console.log('selectedSatelliteIndex:', selectedSatelliteIndex.value)
  console.log('satelliteList.length:', satelliteList.value.length)
  
  // 如果选择了"请选择卫星"或没有卫星列表，清理实体并退出
  if (selectedSatelliteIndex.value === -1 || !satelliteList.value.length) {
    console.log('清理之前的实体并退出')
    // 清理之前的实体
    viewer = getViewer()
    if (viewer) {
      if (orbitEntity) {
        viewer.entities.remove(orbitEntity)
        orbitEntity = null
      }
      if (satelliteEntity) {
        viewer.entities.remove(satelliteEntity)
        satelliteEntity = null
      }
    }
    return
  }
  
  // 检查索引是否有效
  if (selectedSatelliteIndex.value < 0 || selectedSatelliteIndex.value >= satelliteList.value.length) {
    console.error('无效的卫星索引:', selectedSatelliteIndex.value)
    return
  }
  
  // 清理之前的实体
  viewer = getViewer()
  if (viewer) {
    console.log('清理之前的实体')
    if (orbitEntity) {
      viewer.entities.remove(orbitEntity)
      orbitEntity = null
    }
    if (satelliteEntity) {
      viewer.entities.remove(satelliteEntity)
      satelliteEntity = null
    }
  }
  
  const selectedSatellite = satelliteList.value[selectedSatelliteIndex.value]
  console.log('使用卫星:', selectedSatellite.sateName, 'ID:', selectedSatellite.sateId)
  console.log('轨道点数量:', selectedSatellite.pointList ? selectedSatellite.pointList.length : 0)
  
  // 转换轨道数据为Cesium格式
  const positions = convertOrbitDataToPositions(selectedSatellite.pointList)
  console.log('转换后的位置数量:', positions.length)
  
  if (positions.length === 0) {
    console.error('没有有效的轨道位置数据')
    alert('轨道数据转换失败，没有有效的位置点')
    return
  }
  
  // 创建轨道实体
  createOrbitEntity(positions, selectedSatellite.sateName)
  
  // 创建卫星实体
  createSatelliteEntity(positions, selectedSatellite.sateName)
  
  // 不改变相机视角，保持地球在屏幕中央
  // 只加载轨道和卫星，让用户自己调整视角
  console.log('轨道和卫星已加载，地球保持在屏幕中央')
}







// 转换轨道数据为Cesium位置格式
const convertOrbitDataToPositions = (pointList) => {
  const positions = []
  
  if (!pointList || !Array.isArray(pointList)) {
    console.error('pointList 不是有效的数组:', pointList)
    return positions
  }
  
  console.log('开始转换轨道数据，点数量:', pointList.length)
  console.log('前3个点的原始数据:', pointList.slice(0, 3))
  
  // 使用简化的转换方法，避免复杂的J2000转换
  pointList.forEach((point, index) => {
    try {
      // 检查必要字段
      if (point.x === undefined || point.x === null || !point.epoch) {
        console.warn(`跳过无效点 ${index}:`, point)
        return
      }
      
      const x = point.x || 0
      const y = point.y || 0
      const z = point.z || 0
      
      // 检查坐标是否有效（不能全为0）
      if (x === 0 && y === 0 && z === 0) {
        console.warn(`跳过零坐标点 ${index}`)
        return
      }
      
      if (index < 3) { // 只打印前3个点的详细信息
        console.log(`处理点 ${index}:`, {x, y, z, epoch: point.epoch})
      }
      
      // 使用简化的转换方法：直接假设数据是ECEF格式
      const position = new Cesium.Cartesian3(x, y, z)
      const cartographic = Cesium.Cartographic.fromCartesian(position)
      
      if (!cartographic) {
        console.warn(`坐标转换失败，跳过点 ${index}:`, point)
        return
      }
      
      // 检查转换后的坐标是否有效
      if (isNaN(cartographic.longitude) || isNaN(cartographic.latitude) || isNaN(cartographic.height)) {
        console.warn(`转换后坐标无效，跳过点 ${index}:`, {
          longitude: cartographic.longitude,
          latitude: cartographic.latitude,
          height: cartographic.height
        })
        return
      }
      
      // 放宽高度检查范围
      if (cartographic.height < -1000000 || cartographic.height > 100000000) {
        console.warn(`高度异常，跳过点 ${index}:`, cartographic.height)
        return
      }
      
      // 修复时间格式
      let iso8601Epoch = point.epoch
      if (point.epoch.includes(' ') && !point.epoch.includes('T')) {
        iso8601Epoch = point.epoch.replace(' ', 'T') + 'Z'
      }
      
      positions.push({
        longitude: cartographic.longitude,
        latitude: cartographic.latitude,
        height: cartographic.height,
        time: Cesium.JulianDate.fromIso8601(iso8601Epoch),
        // 保存原始ECI坐标用于调试
        originalPosition: { x, y, z }
      })
      
      if (index < 3) { // 只打印前3个点的详细信息
        console.log(`点 ${index} 转换成功:`, {
          epoch: point.epoch,
          original: {x, y, z},
          converted: {
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            latitude: Cesium.Math.toDegrees(cartographic.latitude),
            height: cartographic.height
          }
        })
      }
    } catch (error) {
      console.error(`转换点 ${index} 时出错:`, error, point)
    }
  })
  
  console.log('转换完成，有效位置数量:', positions.length)
  if (positions.length === 0) {
    console.error('没有成功转换任何位置点！')
    console.error('可能的原因:')
    console.error('1. 数据格式不正确')
    console.error('2. 坐标值超出有效范围')
    console.error('3. 时间格式不正确')
  }
  return positions
}

// 创建轨道实体
const createOrbitEntity = (positions, satelliteName) => {
  console.log('createOrbitEntity 被调用')
  viewer = getViewer()
  if (!viewer) {
    console.error('无法获取viewer实例')
    return
  }
  
  console.log('创建轨道实体，位置数量:', positions.length)
  
  // 移除现有轨道
  if (orbitEntity) {
    console.log('移除现有轨道实体')
    viewer.entities.remove(orbitEntity)
  }
  
  // 创建时间属性数组
  const timePositions = positions.map(pos => ({
    time: pos.time,
    position: Cesium.Cartesian3.fromRadians(pos.longitude, pos.latitude, pos.height)
  }))
  
  console.log('轨道显示状态:', showOrbit.value)
  console.log('轨道颜色:', orbitColor.value)
  console.log('轨道宽度:', orbitWidth.value)
  
  // 创建轨道实体 - 使用更高级的材质
  const color = Cesium.Color.fromCssColorString(orbitColor.value)
  color.alpha = orbitOpacity.value
  
  orbitEntity = viewer.entities.add({
    name: `${satelliteName}轨道`,
    polyline: {
      positions: timePositions.map(tp => tp.position),
      width: orbitWidth.value,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.3,
        color: color
      }),
      clampToGround: false,
      show: true,  // 默认显示轨道
      // 添加深度测试，确保轨道在正确位置显示
      depthFailMaterial: color.withAlpha(0.3)
    }
  })
  
  console.log('轨道实体创建成功:', orbitEntity)
  
  // 检查实体是否真的被添加到场景中
  setTimeout(() => {
    const entities = viewer.entities.values
    console.log('场景中的实体数量:', entities.length)
    const orbitEntities = entities.filter(e => e.name && e.name.includes('轨道'))
    console.log('轨道实体数量:', orbitEntities.length)
    if (orbitEntities.length > 0) {
      console.log('轨道实体详情:', orbitEntities[0])
    }
  }, 100)
  
  // 自动勾选显示轨道复选框
  showOrbit.value = true
  
  // 强制刷新场景
  viewer.scene.requestRender()
}

// 创建卫星实体
const createSatelliteEntity = (positions, satelliteName) => {
  console.log('createSatelliteEntity 被调用')
  viewer = getViewer()
  if (!viewer) {
    console.error('无法获取viewer实例')
    return
  }
  
  // 移除现有卫星
  if (satelliteEntity) {
    console.log('移除现有卫星实体')
    viewer.entities.remove(satelliteEntity)
  }
  
  if (positions.length === 0) {
    console.log('没有位置数据，跳过卫星创建')
    return
  }
  
  // 创建时间属性数组
  const timePositions = positions.map(pos => ({
    time: pos.time,
    position: Cesium.Cartesian3.fromRadians(pos.longitude, pos.latitude, pos.height)
  }))
  
  console.log('卫星显示状态:', showSatellite.value)
  
  // 创建卫星实体 - 先尝试使用3D模型
  console.log('开始创建卫星实体...')
  
  try {
    // 尝试创建模型实体
    satelliteEntity = viewer.entities.add({
      name: satelliteName,
      position: timePositions[0].position,
      // 使用3D模型
      model: {
        uri: '/model/satellite.glb',
        scale: 1000, // 缩放模型
        minimumPixelSize: 32, // 最小像素大小
        maximumScale: 2000, // 最大缩放
        heightReference: Cesium.HeightReference.NONE,
        show: true // 默认显示模型
      },
      // 如果模型加载失败，使用点作为备选
      point: {
        pixelSize: 20, // 增大点的大小
        color: Cesium.Color.BLUE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.NONE,
        show: true // 默认显示点，等模型加载成功后再隐藏
      },
      // 添加标签显示卫星名称
      label: {
        text: satelliteName,
        font: '12pt sans-serif',
        fillColor: Cesium.Color.LIGHTBLUE,
        outlineColor: Cesium.Color.DARKBLUE,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -40),
        heightReference: Cesium.HeightReference.NONE,
        show: true
      },
      // 添加时间属性用于动画
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: timePositions[0].time,
          stop: timePositions[timePositions.length - 1].time
        })
      ])
    })
    
    console.log('卫星实体创建成功，检查模型属性...')
    console.log('模型属性:', satelliteEntity.model)
    console.log('模型URI:', satelliteEntity.model ? satelliteEntity.model.uri : 'undefined')
    console.log('模型show:', satelliteEntity.model ? satelliteEntity.model.show : 'undefined')
    
  } catch (modelError) {
    console.error('模型实体创建失败，使用点实体:', modelError)
    
    // 如果模型创建失败，直接创建点实体
    satelliteEntity = viewer.entities.add({
      name: satelliteName,
      position: timePositions[0].position,
      // 只使用点显示
      point: {
        pixelSize: 20, // 增大点的大小
        color: Cesium.Color.BLUE,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.NONE,
        show: true
      },
      // 添加标签显示卫星名称
      label: {
        text: satelliteName,
        font: '12pt sans-serif',
        fillColor: Cesium.Color.LIGHTBLUE,
        outlineColor: Cesium.Color.DARKBLUE,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -40),
        heightReference: Cesium.HeightReference.NONE,
        show: true
      },
      // 添加时间属性用于动画
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: timePositions[0].time,
          stop: timePositions[timePositions.length - 1].time
        })
      ])
    })
    
    console.log('点实体创建成功')
  }
  
  // 设置位置属性用于动画
  const positionProperty = new Cesium.SampledPositionProperty()
  timePositions.forEach(tp => {
    positionProperty.addSample(tp.time, tp.position)
  })
  
  satelliteEntity.position = positionProperty
  
  // 设置方向属性，让卫星始终朝向运动方向
  const orientationProperty = new Cesium.VelocityOrientationProperty(positionProperty)
  satelliteEntity.orientation = orientationProperty
  
  // 监听模型加载状态
  console.log('检查模型属性:', {
    hasModel: !!satelliteEntity.model,
    hasReadyPromise: !!(satelliteEntity.model && satelliteEntity.model.readyPromise),
    modelUri: satelliteEntity.model ? satelliteEntity.model.uri : 'undefined'
  })
  
  // 检查是否有模型属性
  if (satelliteEntity.model) {
    console.log('模型属性存在，检查readyPromise...')
    
    // 检查readyPromise是否存在
    if (satelliteEntity.model.readyPromise) {
      console.log('开始监听模型加载状态...')
      satelliteEntity.model.readyPromise.then(() => {
        console.log('✅ 卫星模型加载成功！')
        // 模型加载成功后隐藏点
        if (satelliteEntity && satelliteEntity.point) {
          satelliteEntity.point.show = false
          console.log('隐藏点显示')
        }
        if (satelliteEntity && satelliteEntity.model) {
          satelliteEntity.model.show = true
          console.log('显示模型')
        }
      }).catch((error) => {
        console.error('❌ 卫星模型加载失败，使用点显示:', error)
        console.error('错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        // 模型加载失败后显示点
        if (satelliteEntity && satelliteEntity.point) {
          satelliteEntity.point.show = true
          console.log('显示点作为备选')
        }
        if (satelliteEntity && satelliteEntity.model) {
          satelliteEntity.model.show = false
          console.log('隐藏模型')
        }
      })
    } else {
      console.warn('⚠️ 模型readyPromise不存在，可能是不支持的模型格式')
      console.warn('模型属性详情:', satelliteEntity.model)
      
      // 尝试直接显示模型，如果失败则使用点
      try {
        if (satelliteEntity && satelliteEntity.model) {
          satelliteEntity.model.show = true
          console.log('✅ 直接显示模型成功')
        }
        if (satelliteEntity && satelliteEntity.point) {
          satelliteEntity.point.show = true // 同时显示点，以防模型失败
          console.log('同时显示点作为备选')
        }
        
        // 立即检查模型是否真的显示了
        setTimeout(() => {
          // 由于GLB格式可能不被支持，直接保持点显示
          console.log('⚠️ GLB格式可能不被支持，保持点显示')
          if (satelliteEntity && satelliteEntity.point) {
            satelliteEntity.point.show = true
            console.log('保持点显示')
          }
          if (satelliteEntity && satelliteEntity.model) {
            satelliteEntity.model.show = false
            console.log('隐藏模型')
          }
        }, 500) // 等待0.5秒后立即检查
        
        // 等待一段时间后检查模型是否真的显示了
        setTimeout(() => {
          // 由于GLB格式可能不被支持，始终保持点显示
          console.log('⚠️ GLB格式可能不被支持，始终保持点显示')
          if (satelliteEntity && satelliteEntity.point) {
            satelliteEntity.point.show = true
            console.log('保持点显示')
          }
          if (satelliteEntity && satelliteEntity.model) {
            satelliteEntity.model.show = false
            console.log('隐藏模型')
          }
        }, 2000) // 等待2秒
        
      } catch (error) {
        console.error('直接显示模型失败:', error)
        if (satelliteEntity && satelliteEntity.point) {
          satelliteEntity.point.show = true
          console.log('显示点作为备选')
        }
        if (satelliteEntity && satelliteEntity.model) {
          satelliteEntity.model.show = false
          console.log('隐藏模型')
        }
      }
    }
  } else {
    console.warn('⚠️ 没有模型属性，使用点显示')
    if (satelliteEntity && satelliteEntity.point) {
      satelliteEntity.point.show = true
      console.log('显示点')
    }
  }
  
  // 强制确保点显示（作为最后的备选方案）
  setTimeout(() => {
    console.log('检查最终显示状态...')
    if (satelliteEntity) {
      console.log('模型显示状态:', satelliteEntity.model ? satelliteEntity.model.show : '无模型')
      console.log('点显示状态:', satelliteEntity.point ? satelliteEntity.point.show : '无点')
      
      // 如果模型和点都没有显示，强制显示点
      const modelVisible = satelliteEntity.model && satelliteEntity.model.show
      const pointVisible = satelliteEntity.point && satelliteEntity.point.show
      
      if (!modelVisible && !pointVisible) {
        console.warn('⚠️ 模型和点都没有显示，强制显示点')
        if (satelliteEntity.point) {
          satelliteEntity.point.show = true
          console.log('强制显示点成功')
        }
      }
    }
  }, 3000) // 等待3秒后检查
  
  if (satelliteEntity) {
    console.log('卫星实体创建成功:', satelliteEntity)
    console.log('卫星实体详细信息:', {
      name: satelliteEntity.name,
      position: satelliteEntity.position,
      hasModel: !!satelliteEntity.model,
      hasPoint: !!satelliteEntity.point,
      hasLabel: !!satelliteEntity.label,
      modelShow: satelliteEntity.model ? satelliteEntity.model.show : '无模型',
      pointShow: satelliteEntity.point ? satelliteEntity.point.show : '无点',
      labelShow: satelliteEntity.label ? satelliteEntity.label.show : '无标签'
    })
  }
  
  // 检查实体是否真的被添加到场景中
  setTimeout(() => {
    console.log('检查实体是否被添加到场景中...')
    const entities = viewer.entities.values
    console.log('场景中的实体数量:', entities.length)
    console.log('卫星实体是否在场景中:', entities.includes(satelliteEntity))
    
    const satelliteEntities = entities.filter(e => e.name && !e.name.includes('轨道'))
    console.log('卫星实体数量:', satelliteEntities.length)
    
    if (entities.includes(satelliteEntity)) {
      console.log('✅ 卫星实体已成功添加到场景中')
      
      // 再次检查显示状态
      console.log('再次检查显示状态:')
      console.log('- 模型显示:', satelliteEntity.model ? satelliteEntity.model.show : '无模型')
      console.log('- 点显示:', satelliteEntity.point ? satelliteEntity.point.show : '无点')
      console.log('- 标签显示:', satelliteEntity.label ? satelliteEntity.label.show : '无标签')
      
      // 如果点没有显示，强制显示
      if (satelliteEntity.point && !satelliteEntity.point.show) {
        console.log('强制显示点...')
        satelliteEntity.point.show = true
        console.log('点显示状态已更新:', satelliteEntity.point.show)
      }
      
    } else {
      console.error('❌ 卫星实体没有添加到场景中')
    }
  }, 100)
  
  // 自动勾选显示卫星复选框
  showSatellite.value = true
  
  // 强制刷新场景
  viewer.scene.requestRender()
}

// 切换轨道显示
const toggleOrbit = () => {
  // 控制当前选中的轨道
  if (orbitEntity) {
    orbitEntity.polyline.show = showOrbit.value && showOrbitTrail.value
  }
  
  // 控制所有卫星的轨道
  allOrbitEntities.forEach(entity => {
    if (entity && entity !== null && entity.polyline) {
      entity.polyline.show = showOrbit.value && showOrbitTrail.value
    }
  })
}

// 切换卫星显示
const toggleSatellite = () => {
  // 控制当前选中的卫星
  if (satelliteEntity) {
    // 切换模型显示
    if (satelliteEntity.model) {
      satelliteEntity.model.show = showSatellite.value
    }
    // 切换点显示
    if (satelliteEntity.point) {
      satelliteEntity.point.show = showSatellite.value
    }
    // 切换标签显示
    if (satelliteEntity.label) {
      satelliteEntity.label.show = showSatellite.value
    }
  }
  
  // 控制所有卫星的显示
  allSatelliteEntities.forEach(entity => {
    if (entity && entity !== null) {
      if (entity.point) {
        entity.point.show = showSatellite.value
      }
      if (entity.label) {
        entity.label.show = showSatellite.value
      }
      // 安全地检查模型属性
      if (entity.model) {
        entity.model.show = showSatellite.value
      }
    }
  })
}

// 更新轨道颜色
const updateOrbitColor = () => {
  if (orbitEntity) {
    const color = Cesium.Color.fromCssColorString(orbitColor.value)
    color.alpha = orbitOpacity.value
    orbitEntity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.3,
      color: color
    })
  }
}

// 更新轨道透明度
const updateOrbitOpacity = () => {
  if (orbitEntity) {
    const color = Cesium.Color.fromCssColorString(orbitColor.value)
    color.alpha = orbitOpacity.value
    orbitEntity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.3,
      color: color
    })
  }
}

// 更新轨道宽度
const updateOrbitWidth = () => {
  if (orbitEntity) {
    orbitEntity.polyline.width = orbitWidth.value
  }
}

// 切换动画播放
const toggleAnimation = () => {
  viewer = getViewer()
  if (!viewer) {
    console.error('无法获取viewer实例')
    return
  }
  
  if (isPlaying.value) {
    viewer.clock.shouldAnimate = true
    console.log('开始播放动画')
  } else {
    viewer.clock.shouldAnimate = false
    console.log('暂停动画')
  }
}

// 更新播放速度
const updatePlaybackSpeed = () => {
  viewer = getViewer()
  if (!viewer) {
    console.error('无法获取viewer实例')
    return
  }
  
  viewer.clock.multiplier = playbackSpeed.value
  console.log('播放速度设置为:', playbackSpeed.value)
}

// 重置动画
const resetAnimation = () => {
  viewer = getViewer()
  if (!viewer) {
    console.error('无法获取viewer实例')
    return
  }
  
  // 重置到开始时间
  viewer.clock.currentTime = viewer.clock.startTime.clone()
  isPlaying.value = false
  viewer.clock.shouldAnimate = false
  console.log('动画已重置')
}

// 重置相机视角
const resetCamera = () => {
  viewer = getViewer()
  if (!viewer) {
    console.error('无法获取viewer实例')
    return
  }
  
  // 设置全局视角，地球居中
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000), // 20000km高度
    orientation: {
      heading: 0.0,
      pitch: Cesium.Math.toRadians(-30),
      roll: 0.0
    }
  })
  
  console.log('相机视角已重置到全局视角，地球居中')
}

// 切换轨道跟踪
const toggleOrbitTracking = () => {
  if (trackOrbit.value) {
    // 启用轨道跟踪
    console.log('启用轨道跟踪')
    // 这里可以添加轨道跟踪逻辑，但保持地球居中
  } else {
    // 禁用轨道跟踪，重置到全局视角
    console.log('禁用轨道跟踪')
    resetCamera()
  }
}

// 更新卫星大小
const updateSatelliteScale = () => {
  // 更新当前选中的卫星
  if (satelliteEntity) {
    if (satelliteEntity.model) {
      satelliteEntity.model.scale = 1000 * satelliteScale.value
      console.log('卫星模型大小设置为:', satelliteScale.value)
    }
    if (satelliteEntity.point) {
      satelliteEntity.point.pixelSize = 16 * satelliteScale.value
      console.log('卫星点大小设置为:', satelliteScale.value)
    }
  }
  
  // 更新所有卫星的大小
  allSatelliteEntities.forEach(entity => {
    if (entity && entity !== null) {
      if (entity.point) {
        entity.point.pixelSize = 15 * satelliteScale.value
      }
      if (entity.model) {
        entity.model.scale = 1000 * satelliteScale.value
      }
    }
  })
}

// 切换轨道轨迹显示
const toggleOrbitTrail = () => {
  // 控制当前选中的轨道
  if (orbitEntity) {
    orbitEntity.polyline.show = showOrbitTrail.value && showOrbit.value
  }
  
  // 控制所有卫星的轨道
  allOrbitEntities.forEach(entity => {
    if (entity && entity !== null && entity.polyline) {
      entity.polyline.show = showOrbitTrail.value && showOrbit.value
    }
  })
}

onMounted(() => {
  console.log('OrbitDisplay组件已挂载')
  // 等待viewer初始化
  setTimeout(() => {
    console.log('检查viewer初始化状态...')
    viewer = getViewer()
    if (viewer) {
      console.log('OrbitDisplay组件已连接到Cesium viewer')
    } else {
      console.log('警告: 无法获取Cesium viewer实例')
    }
  }, 1000)
})

onBeforeUnmount(() => {
  // 清理实体
  if (viewer) {
    if (orbitEntity) {
      viewer.entities.remove(orbitEntity)
    }
    if (satelliteEntity) {
      viewer.entities.remove(satelliteEntity)
    }
  }
})
</script>

<style scoped>
.orbit-controls {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

.control-panel {
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 250px;
  font-family: Arial, sans-serif;
  border: 2px solid #0066ff;
  box-shadow: 0 0 20px rgba(0, 102, 255, 0.3);
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  gap: 10px;
}

.header-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-panel h3 {
  margin: 0;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.quick-load-btn {
  background-color: #0066ff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  white-space: nowrap;
}

.quick-load-btn:hover:not(:disabled) {
  background-color: #0052cc;
  transform: translateY(-1px);
}

.quick-load-btn:disabled {
  background-color: #666;
  cursor: not-allowed;
  transform: none;
}

.quick-load-btn svg {
  flex-shrink: 0;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.control-group input[type="checkbox"] {
  margin: 0;
  accent-color: #0066ff;
}

.control-group input[type="color"] {
  width: 30px;
  height: 20px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.control-group input[type="range"] {
  width: 100px;
  margin: 0 5px;
  accent-color: #0066ff;
}

.control-group select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #0066ff;
  border-radius: 4px;
  background-color: white;
  color: black;
  font-size: 14px;
}

.control-group select:focus {
  outline: none;
  border-color: #0052cc;
  box-shadow: 0 0 5px rgba(0, 102, 255, 0.3);
}

.control-group button {
  background-color: #0066ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.control-group button:hover:not(:disabled) {
  background-color: #0052cc;
}

.control-group button:disabled {
  background-color: #666;
  cursor: not-allowed;
}

.toggle-panel-btn {
  background-color: transparent;
  color: white;
  border: 1px solid #0066ff;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  min-width: 32px;
  height: 32px;
}

.toggle-panel-btn:hover {
  background-color: #0066ff;
  border-color: #0052cc;
}

.toggle-panel-btn svg {
  transition: transform 0.3s ease;
}

.toggle-panel-btn svg.rotated {
  transform: rotate(180deg);
}

.panel-content {
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: 1000px;
  opacity: 1;
}

.panel-content.collapsed {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
}
</style>

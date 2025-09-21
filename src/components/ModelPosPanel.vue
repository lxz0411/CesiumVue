<template>
  <!-- 弹窗遮罩层 -->
  <div class="model-overlay" id="model-overlay" style="display: none;">
    <!-- 弹窗内容 -->
    <div class="model-content" id="model-content">
      <div class="title-box">
        <div class="title">添加模型</div>
        <button class="close-button" id="close-button" @click="closePanel">
          <img src="/images/close_icon.png" alt="关闭">
        </button>
      </div>
      
      <!-- 输入框区域 -->
      <div class="input-section">
        <div class="input-group">
          <label>时间：</label>
          <input type="datetime-local" id="time-input" class="input-field">
        </div>
        
        <div class="input-group">
          <label>经度(-180~180)：</label>
          <input type="number" id="longitude-input" class="input-field" placeholder="请输入经度" step="0.000001">
        </div>
        
        <div class="input-group">
          <label>纬度(-90~90)：</label>
          <input type="number" id="latitude-input" class="input-field" placeholder="请输入纬度" step="0.000001">
        </div>
        
        <div class="input-group">
          <label>高度(≥0)：</label>
          <input type="number" id="height-input" class="input-field" placeholder="请输入高度" step="0.1" min="0">
        </div>
      </div>
      <!-- 错误提示区域（默认不显示） -->
      <div class="error-message" v-if="errorMsg">{{ errorMsg }}</div>
      <div class="confirm-button">
        <button @click="confirmPanel">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
  import * as Cesium from 'cesium'
  import { ref } from 'vue'
  import { getViewer } from '@/utils/utils'


  // 全局状态：等待触发的添加任务（仅保留最近一次）
  let pendingAdd = null
  let tickHandler = null

  // 错误提示信息（默认不显示）
  const errorMsg = ref('')

  // 关闭弹窗函数
  function closePanel() {
    const overlay = document.getElementById('model-overlay')
    if (overlay) {
      overlay.style.display = 'none'
    }
  }

  // 将 datetime-local 值按 UTC 解析为 JulianDate（与Cesium时间轴一致）
  function toJulianDateFromUTC(inputValue){
    if(!inputValue){
      return null
    }
    // 将无时区的字符串按UTC解读
    const d = new Date(inputValue + 'Z')
    if (isNaN(d.getTime())) return null
    return Cesium.JulianDate.fromDate(d)
  }

  // 在场景时间到达指定时间时添加模型或红点（模型失败时）
  function scheduleAddModelAt(targetTimeJD, longitudeDeg, latitudeDeg, heightMeter, entityName){
    const viewer = getViewer()
    if(!viewer){
      alert('无法获取Cesium viewer 实例')
      return
    }

    // 记录待处理任务
    pendingAdd = {
      targetTime: targetTimeJD,
      longitude: longitudeDeg,
      latitude: latitudeDeg,
      height: heightMeter,
      name: entityName
    }

    // 注册或复用 onTick 监听
    if(!tickHandler){
      tickHandler = function(){
        if(!pendingAdd) return
        const now = viewer.clock.currentTime
        if(Cesium.JulianDate.greaterThanOrEquals(now, pendingAdd.targetTime)){
          // 触发添加
          const position = Cesium.Cartesian3.fromDegrees(pendingAdd.longitude, pendingAdd.latitude, pendingAdd.height)
          // 参考 OrbitDisplay 的逻辑：创建带模型与点的实体，监听模型加载结果
          let entity = null
          try {
            entity = viewer.entities.add({
              name: pendingAdd.name || '自定义模型',
              position,
              model: {
                url: '/model/satellite.glb',
                scale: 1000,
                minimumPixelSize: 24,
                maximumScale: 2000,
                heightReference: Cesium.HeightReference.NONE,
                show: true
              },
              point: {
                pixelSize: 14,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.NONE,
                show: true
              },
              label: {
                text: pendingAdd.name || '',
                font: '11pt sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -28),
                heightReference: Cesium.HeightReference.NONE,
                show: !!(pendingAdd.name)
              }
            })
          } catch (e) {
            entity = null
          }

          // 模型加载成功隐藏点，失败隐藏模型显示点
          const ensurePointVisible = () => {
            if (!entity) return
            if (entity.point) { entity.point.show = true }
            if (entity.model) { entity.model.show = false }
          }

          if (entity && entity.model && entity.model.readyPromise) {
            entity.model.readyPromise.then(() => {
              if (entity && entity.point) { entity.point.show = false }
              if (entity && entity.model) { entity.model.show = true }
              viewer.scene.requestRender()
            }).catch(() => {
              ensurePointVisible()
              viewer.scene.requestRender()
            })
          } else {
            // 与 OrbitDisplay 一致：若无 readyPromise，延时兜底，保持点显示
            setTimeout(() => {
              try {
                const modelVisible = !!(entity && entity.model && entity.model.show)
                if (!modelVisible) {
                  ensurePointVisible()
                }
              } catch (_) {
                ensurePointVisible()
              }
              viewer.scene.requestRender()
            }, 1500)
          }

          // 完成一次性任务，清理挂起
          pendingAdd = null
          // 不移除监听，允许后续再次使用；若无挂起任务时监听开销极低
          viewer.scene.requestRender()
        }
      }
      viewer.clock.onTick.addEventListener(tickHandler)
    }
  }

  function confirmPanel(){
    const viewer = getViewer()
    if(!viewer){
      alert('无法获取Cesium viewer 实例')
      return
    }

    // 1) 获取来源按钮名称
    const sourceName = window.selectedModelName || ''

    // 2) 读取输入
    const timeVal = (document.getElementById('time-input') || {}).value
    const lonVal = parseFloat((document.getElementById('longitude-input') || {}).value)
    const latVal = parseFloat((document.getElementById('latitude-input') || {}).value)
    const hgtVal = parseFloat((document.getElementById('height-input') || {}).value)

    // 重置错误提示
    errorMsg.value = ''

    // 收集所有错误信息
    const errors = []

    // 基础校验
    if(!timeVal){
      errors.push('请输入时间')
    }
    if(!isFinite(lonVal) || !isFinite(latVal) || !isFinite(hgtVal)){
      errors.push('请输入有效的经度/纬度/高度')
    }
    if(lonVal < -180 || lonVal > 180){
      errors.push('经度范围应为 [-180, 180]')
    }
    if(latVal < -90 || latVal > 90){
      errors.push('纬度范围应为 [-90, 90]')
    }
    if(hgtVal < 0){
      errors.push('高度不能为负数')
    }

    const targetJD = toJulianDateFromUTC(timeVal)
    if(!targetJD){
      errors.push('时间格式无效')
    }

    // 时间与当前场景时间比较（早于当前则报错）
    if(targetJD){
      const now = viewer.clock.currentTime
      const diffSec = Cesium.JulianDate.secondsDifference(targetJD, now)
      if(diffSec < -0.5){
        errors.push('输入时间早于当前场景时间，请重新输入')
      }
    }

    // 如果有错误，显示所有错误并返回
    if(errors.length > 0){
      errorMsg.value = errors.join('\n')
      return
    }

    // 4) 安排在目标时间添加模型（或红点），模型保持静止
    scheduleAddModelAt(targetJD, lonVal, latVal, hgtVal, sourceName)

    closePanel()
  }
</script>

<style scoped>
.model-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
}

.model-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.title-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.close-button img {
  width: 20px;
  height: 20px;
}

.input-section {
  margin-top: 20px;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.input-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.input-field::placeholder {
  color: #999;
}

.confirm-button {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.confirm-button button {
  padding: 8px 16px;
  font-size: 14px;
  line-height: 1.2;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.05s, box-shadow 0.2s;
}

.confirm-button button:hover {
  background-color: #0069d9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.error-message {
  margin-top: 8px;
  color: #e02e2e;
  text-align: center;
  font-size: 13px;
  white-space: pre-line;
}
</style>
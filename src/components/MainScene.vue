<template>
  <div ref="cesiumContainer" class="cesium-container"></div>
</template>

<script setup>
  import { onMounted, ref, onBeforeUnmount } from 'vue'
  import * as Cesium from 'cesium'

  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NWRkMWY5MC00NTQ5LTQxZDUtYmZlOS00YjZlN2EyZjdmMDIiLCJpZCI6MjkzNzk3LCJpYXQiOjE3NDcwODA5OTJ9.iy0AeAVh1PklRnt8ULJU2UynAdbLjjL3Jh2XOuASYAs'

  const cesiumContainer = ref(null)
  let viewer = null

  onMounted(() => {
  viewer = new Cesium.Viewer(cesiumContainer.value, {
    animation: true,            // 左下角动画播放控件
    timeline: true,             // 底部时间轴
    baseLayerPicker: true,      // 图层选择
    geocoder: true,             // 搜索框
    homeButton: true,           // 返回初始视角
    sceneModePicker: true,      // 2D/3D切换
    navigationHelpButton: true, // 帮助按钮
    fullscreenButton: true,     // 全屏按钮
    vrButton: true,             // VR模式按钮
    infoBox: true,
    selectionIndicator: true,
    shouldAnimate: true,        // 默认启用动画
    })
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableTilt = false;
    
    // 将viewer实例存储到全局，供其他组件使用
    window.cesiumViewer = viewer;
    
    // 设置初始时间范围（根据轨道数据调整）
    const start = Cesium.JulianDate.fromIso8601('2025-06-26T00:00:00Z');
    const stop = Cesium.JulianDate.fromIso8601('2025-06-26T23:59:59Z');
    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.timeline.zoomTo(start, stop);
  })


  onBeforeUnmount(() => {
    if (viewer) {
      viewer.destroy()
      viewer = null
      window.cesiumViewer = null;
    }
  })
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100%;
  display: flex;
  margin: 0;
  padding: 0;
}
</style>
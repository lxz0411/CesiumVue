<template>
  <div class="app-container">
    <!--场景-->
    <MainScene />
    <!--模型面板-->
    <ModelPanel />
    <!--轨道显示控制-->
    <OrbitDisplay />
  </div>
</template>

<script setup>
  /* eslint-disable */
  import * as Cesium from 'cesium'
  import "./Widgets/widgets.css"
  import { onMounted } from 'vue';
  import ModelPanel from './components/ModelPanel.vue';
  import MainScene from './components/MainScene.vue';
  import OrbitDisplay from './components/OrbitDisplay.vue';

  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NWRkMWY5MC00NTQ5LTQxZDUtYmZlOS00YjZlN2EyZjdmMDIiLCJpZCI6MjkzNzk3LCJpYXQiOjE3NDcwODA5OTJ9.iy0AeAVh1PklRnt8ULJU2UynAdbLjjL3Jh2XOuASYAs';

  window.CESIUM_BASE_URL = "/";
</script>
 
<style>
  html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

  .app-container {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
</style>
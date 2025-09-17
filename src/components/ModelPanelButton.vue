<template>
  <div class="model-panel-button-container">
    <button class="model-panel-button" @click="openModelPanel">
      <!-- <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg> -->
      模型列表
    </button>
  </div>
</template>

<script setup>
  function openModelPanel() {
    // 通过DOM操作打开ModelPanel中的弹窗
    const overlay = document.getElementById('model-panel-overlay')
    if (overlay) {
      overlay.style.display = 'flex'
    }
    // 暂停场景动画
    const viewer = window.cesiumViewer
    if (viewer) {
      viewer.clock.shouldAnimate = false
    }
  }
</script>

<style scoped>
.model-panel-button-container {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.model-panel-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
  transition: all 0.3s ease;
  user-select: none;
}

.model-panel-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
  background: #0056b3;
}

.model-panel-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(0, 123, 255, 0.3);
}

.model-panel-button svg {
  flex-shrink: 0;
}
</style>

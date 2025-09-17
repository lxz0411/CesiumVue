<template>
  <div>
    <!-- 弹窗遮罩层 -->
    <div class="model-panel-overlay" id="model-panel-overlay" style="display: none;">
      <!-- 弹窗内容 -->
      <div class="model-panel-content">
        <div class="panel-header">
          <div class="panel-title">模型列表</div>
          <button class="close-button" @click="closePanel">
            <img src="/images/close_icon.png" alt="关闭">
          </button>
        </div>
        
        <div class="model-grid">
          <button v-for="i in 14" :key="i" class="model-button" @click="openModelPosPanel(i)">
            <img :src="getImagePath(i)" alt="模型图片" class="model-image" />
            <span class="model-name">模型{{ i }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 引入ModelPosPanel组件 -->
    <ModelPosPanel />
  </div>
</template>

<script setup>
  // import { ref } from 'vue'
  import ModelPosPanel from './ModelPosPanel.vue'
  import { getViewer } from '@/utils/utils'

  //根据模型名称获取对应icon，当前还是使用序列号进行索引，后续要改
  const getImagePath = (index) =>{return `/images/${index}.png`}

  function openModelPosPanel(index) {
    // 通过DOM操作打开ModelPosPanel中的弹窗
    const overlay = document.getElementById('model-overlay')
    if (overlay) {
      overlay.style.display = 'flex'
    }
    const viewer = getViewer()
    if(viewer) {
      viewer.clock.shouldAnimate = false
    }
    // 记录当前点击的按钮名称/索引，供弹窗读取
    window.selectedModelIndex = index
    window.selectedModelName = `模型${index}`
  }

  function closePanel() {
    const overlay = document.getElementById('model-panel-overlay')
    if (overlay) {
      overlay.style.display = 'none'
    }
    const viewer = getViewer()
    if(viewer && !viewer.clock.shouldAnimate){
      viewer.clock.shouldAnimate = true
    }
  }
</script>

<style scoped>
.model-panel-overlay {
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

.model-panel-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.panel-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.close-button img {
  width: 24px;
  height: 24px;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  overflow-y: auto;
  padding-right: 8px;
}

.model-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.model-button:hover {
  border-color: #007bff;
  background-color: #f8f9ff;
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.model-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 8px;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

/* 滚动条样式 */
.model-grid::-webkit-scrollbar {
  width: 6px;
}

.model-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.model-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.model-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
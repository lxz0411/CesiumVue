<template>
  <div>
    <!-- 面板展开时 -->
    <div v-if="!collapsed" class="button-panel">
      <div class="content">
        <div class="title">模型列表</div>
        <div class="button-grid">
          <button v-for="i in 14" :key="i" class="grid-button">
            <img :src="getImagePath(i)" alt="模型图片" class="button-image" />
          </button>
        </div>
      </div>
      <button class="arrow-btn arrow-left" @click="toggleCollapsed" title="收起面板">
        <!-- 左箭头SVG -->
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white" aria-hidden="true" focusable="false">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
        </svg>
      </button>
    </div>

    <!-- 面板收起时，屏幕右侧的展开箭头 -->
    <button v-if="collapsed" class="arrow-btn arrow-right" @click="toggleCollapsed" title="展开面板">
      <!-- 右箭头SVG -->
      <svg viewBox="0 0 24 24" width="20" height="20" fill="white" aria-hidden="true" focusable="false">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  const collapsed = ref(false)

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
  }



  //根据模型名称获取对应icon，当前还是使用序列号进行索引，后续要改
  const getImagePath = (index) =>{return `/images/${index}.png`}
</script>

<style scoped>
.button-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 300px;
  background-color: rgba(0, 0, 0, 0.6);
  /* border-left: 1px solid #ccc; */
  box-sizing: border-box;
  user-select: none;
  z-index: 9999;
  padding: 16px 10px 10px 10px; /* 左侧留40px给箭头 */
  display: flex;
  flex-direction: column;
}

.content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
  color: white;
}



.button-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(auto, 100px);
  gap: 18px 12px;
  overflow-y: scroll;
}

.grid-button {
  font-size: 14px;
  border: 1px solid #999;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1 / 1;
}

.grid-button:hover {
  background-color: #ddd;
  scale: 0.98;
}

.button-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.arrow-btn {
  width: 30px;
  height: 60px;
  background-color: rgba(100, 100, 100, 0.5);
  border: none;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  outline: none;
  padding: 0;
}

.arrow-btn:hover {
  background-color: rgba(100, 100, 100, 0.8);
}

.arrow-left {
  position: absolute;
  left: -31px;
  top: 50%;
  transform: translateY(-50%) 0.3s;
  width: 30px;
  height: 60px;
  background-color: rgba(100, 100, 100, 0.5);
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 24px;
  user-select: none;
  border: none;
  transition: background-color 0.3s ease;
}

.arrow-right {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  border-radius:  4px 0 0 4px;
  z-index: 10000;
}
</style>

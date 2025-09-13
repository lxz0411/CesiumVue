<template>
  <div class="title-box">
    <div class="title">添加模型</div>
    <button class="close-button">
      <img src="/images/close_icon.png">
    </button>
  </div>
  <div class="model-img-box">
    <img :src="getImagePath(i)" alt="模型图片" class="button-image">
  </div>
  <div class="input-box">
    
  </div>
</template>

<script setup>
  //根据模型名称获取对应icon，当前还是使用序列号进行索引，后续要改
  const getImagePath = (index) =>{return `/images/${index}.png`}
</script>
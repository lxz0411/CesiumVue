export const getViewer = () => {
  console.log('getViewer 被调用')
  console.log('window.cesiumViewer 存在:', !!window.cesiumViewer)
  if (window.cesiumViewer) {
    console.log('返回 viewer 实例')
    return window.cesiumViewer
  }
  console.log('viewer 实例不存在，返回 null')
  return null
}
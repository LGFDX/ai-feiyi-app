<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { costumeItems } from '../data/costumeData'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const themes = [
  {
    id: 'xichai',
    name: '细钗礼衣',
    desc: '金银细钗与礼衣轮廓，强调端雅仪制感。',
    defaultCostumeId: 'tang-ruqun',
  },
  {
    id: 'juanhua',
    name: '绢花点翠',
    desc: '花丝绢花与点翠色层，突出头饰层次。',
    defaultCostumeId: 'ming-aoqun',
  },
  {
    id: 'danqing',
    name: '丹青折枝',
    desc: '以戏曲脸谱线条强化眼部与面部走笔。',
    defaultCostumeId: 'jingju-danjue-gongzhuang',
  },
]

const colorPresets = [
  { id: 'zhusha', name: '朱砂', hex: '#E63946' },
  { id: 'shiqing', name: '石青', hex: '#1D3557' },
  { id: 'liujin', name: '鎏金', hex: '#FFB703' },
  { id: 'mohei', name: '墨黑', hex: '#000000' },
]

const fileInputRef = ref(null)
const videoRef = ref(null)
const sliderCompareRef = ref(null)

const uploadMethod = ref('local')
const dragActive = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')

const cameraOpened = ref(false)
const cameraError = ref('')

const selectedFileName = ref('未上传图片')
const selectedFileSize = ref(0)

const sourceImageBlob = ref(null)
const originalImageUrl = ref('')

const activeThemeId = ref(themes[0].id)
const makeupStrength = ref(72)
const ornamentDensity = ref(58)
const lightingMood = ref(66)
const activeColorPreset = ref(colorPresets[0].id)

const generationMode = ref('makeup')
const selectedCostumeId = ref(themes[0].defaultCostumeId)

const generationStatus = ref('idle')
const generationProgress = ref(0)
const generationError = ref('')
const generationMessage = ref('上传后可开始生成。')

const compareMode = ref('side')
const compareSlider = ref(50)
const isCompareDragging = ref(false)

const generatedHistory = ref([])
const activeHistoryId = ref('')

const showNoFaceModal = ref(false)
const noFaceReason = ref('')

const viewerOpen = ref(false)
const viewerSrc = ref('')
const viewerTitle = ref('')
const viewerScale = ref(1)
const viewerRotate = ref(0)

const noticeMessage = ref('')
const networkOffline = ref(typeof navigator !== 'undefined' ? !navigator.onLine : false)

let stream = null
let progressTimer = null
let timeoutTimer = null
let toastTimer = null

const activeTheme = computed(() =>
  themes.find((item) => item.id === activeThemeId.value) ?? themes[0],
)

const activeColor = computed(
  () => colorPresets.find((item) => item.id === activeColorPreset.value) ?? colorPresets[0],
)

const activeResult = computed(
  () => generatedHistory.value.find((item) => item.id === activeHistoryId.value) ?? null,
)

const canGenerate = computed(
  () =>
    !isUploading.value &&
    generationStatus.value !== 'generating' &&
    !!originalImageUrl.value &&
    !!activeTheme.value,
)

const generationStageText = computed(() => {
  const progress = generationProgress.value

  if (progress < 20) {
    return '正在解析人像面部特征...'
  }

  if (progress < 50) {
    return '正在提取非遗妆造元素...'
  }

  if (progress < 80) {
    return '正在融合妆容与服饰细节...'
  }

  return '正在优化最终效果...'
})

const shouldShowCostumeSelect = computed(() => generationMode.value === 'full')
const isOperationLocked = computed(() => generationStatus.value === 'generating')

const selectedCostume = computed(() =>
  costumeItems.find((item) => item.id === selectedCostumeId.value) ?? null,
)

const formattedUploadSize = computed(() => {
  if (!selectedFileSize.value) {
    return '--'
  }

  const kb = selectedFileSize.value / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(2)} MB`
})

const currentGeneratedPreview = computed(() => activeResult.value?.url || '')

const heroBgStyle = computed(() => ({
  '--hero-bg-image': `url('${import.meta.env.BASE_URL}images/juanhua.svg')`,
}))

const effectPreviewSrc = computed(
  () =>
    currentGeneratedPreview.value ||
    originalImageUrl.value ||
    `${import.meta.env.BASE_URL}images/xichai.svg`,
)

const livePreviewStyle = computed(() => {
  if (currentGeneratedPreview.value || !originalImageUrl.value) {
    return null
  }

  const saturation = 1 + makeupStrength.value / 130
  const contrast = 1 + ornamentDensity.value / 150
  const brightness = 0.88 + lightingMood.value / 180

  return {
    filter: `saturate(${saturation}) contrast(${contrast}) brightness(${brightness})`,
  }
})

watch(
  [activeThemeId, generationMode],
  () => {
    if (generationMode.value === 'full') {
      selectedCostumeId.value = activeTheme.value.defaultCostumeId
    }
  },
  { immediate: true },
)

function showToast(message) {
  noticeMessage.value = message
  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toastTimer = setTimeout(() => {
    noticeMessage.value = ''
  }, 2400)
}

function openFileDialog() {
  fileInputRef.value?.click()
}

function clearCurrentImage() {
  if (originalImageUrl.value) {
    URL.revokeObjectURL(originalImageUrl.value)
  }

  originalImageUrl.value = ''
  sourceImageBlob.value = null
  selectedFileName.value = '未上传图片'
  selectedFileSize.value = 0
  uploadError.value = ''
  generationStatus.value = 'idle'
  generationMessage.value = '请重新上传图片。'
}

function clearGeneratedHistory() {
  for (const item of generatedHistory.value) {
    if (item.url) {
      URL.revokeObjectURL(item.url)
    }
  }

  generatedHistory.value = []
  activeHistoryId.value = ''
}

function handleDragOver() {
  if (isOperationLocked.value) {
    return
  }

  dragActive.value = true
}

function handleDragLeave() {
  dragActive.value = false
}

function updateComparePosition(clientX) {
  if (!sliderCompareRef.value) {
    return
  }

  const rect = sliderCompareRef.value.getBoundingClientRect()
  const ratio = ((clientX - rect.left) / rect.width) * 100
  compareSlider.value = Math.min(100, Math.max(0, ratio))
}

function onComparePointerDown(event) {
  if (!(originalImageUrl.value && currentGeneratedPreview.value)) {
    return
  }

  isCompareDragging.value = true
  updateComparePosition(event.clientX)
  window.addEventListener('pointermove', onComparePointerMove)
  window.addEventListener('pointerup', onComparePointerUp)
}

function onComparePointerMove(event) {
  if (!isCompareDragging.value) {
    return
  }

  updateComparePosition(event.clientX)
}

function onComparePointerUp() {
  isCompareDragging.value = false
  window.removeEventListener('pointermove', onComparePointerMove)
  window.removeEventListener('pointerup', onComparePointerUp)
}

async function handleDrop(event) {
  if (isOperationLocked.value) {
    return
  }

  dragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    await processFile(file)
  }
}

async function onLocalFileChange(event) {
  const file = event.target.files?.[0]
  if (file) {
    await processFile(file)
  }

  event.target.value = ''
}

async function readImageMeta(file) {
  const url = URL.createObjectURL(file)

  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })

    return {
      width: img.width,
      height: img.height,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function detectFace(file) {
  if (!('FaceDetector' in window)) {
    return true
  }

  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
    const bitmap = await createImageBitmap(file)
    const faces = await detector.detect(bitmap)
    bitmap.close?.()
    return faces.length > 0
  } catch {
    return true
  }
}

async function simulateUploadProgress() {
  isUploading.value = true
  uploadProgress.value = 0

  await new Promise((resolve) => {
    const timer = setInterval(() => {
      uploadProgress.value = Math.min(uploadProgress.value + Math.floor(Math.random() * 14 + 9), 100)
      if (uploadProgress.value >= 100) {
        clearInterval(timer)
        resolve()
      }
    }, 100)
  })

  isUploading.value = false
}

function setUploadError(message) {
  uploadError.value = message
  showToast(message)
}

async function processFile(file) {
  uploadError.value = ''

  if (!ALLOWED_TYPES.includes(file.type)) {
    setUploadError('格式错误：仅支持 JPG / PNG / WebP。')
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    setUploadError('大小超限：单张文件不能超过 10MB。')
    return
  }

  const meta = await readImageMeta(file)
  if (meta.width < 420 || meta.height < 420) {
    setUploadError('图片清晰度不足，请上传正面清晰半身人像。')
    return
  }

  const facePassed = await detectFace(file)
  if (!facePassed) {
    showNoFaceModal.value = true
    noFaceReason.value = '未检测到清晰人脸，请更换无遮挡正面照片。'
    return
  }

  await simulateUploadProgress()

  if (originalImageUrl.value) {
    URL.revokeObjectURL(originalImageUrl.value)
  }

  clearGeneratedHistory()
  originalImageUrl.value = URL.createObjectURL(file)
  sourceImageBlob.value = file
  selectedFileName.value = file.name
  selectedFileSize.value = file.size
  generationStatus.value = 'idle'
  generationError.value = ''
  generationMessage.value = '上传成功，可点击生成戏曲妆造。'
  compareSlider.value = 50
}

async function openCamera() {
  cameraError.value = ''

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = '当前浏览器不支持摄像头访问。'
    return
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    })

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }

    cameraOpened.value = true
  } catch {
    cameraError.value = '摄像头调用失败，请检查浏览器权限设置。'
  }
}

function closeCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
    stream = null
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }

  cameraOpened.value = false
}

async function captureFromCamera() {
  if (!videoRef.value) {
    return
  }

  const width = videoRef.value.videoWidth
  const height = videoRef.value.videoHeight

  if (!width || !height) {
    cameraError.value = '摄像头画面尚未就绪，请稍候后重试。'
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoRef.value, 0, 0, width, height)

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })

  if (!blob) {
    cameraError.value = '拍摄失败，请重新拍摄。'
    return
  }

  const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
  await processFile(file)
  closeCamera()
}

function clearTimers() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }

  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
}

function onGenerateFailure(message, status = 'error') {
  clearTimers()
  generationStatus.value = status
  generationError.value = message
}

function addHistoryResult(url) {
  const now = new Date()
  const id = `result-${now.getTime()}`
  const result = {
    id,
    url,
    themeName: activeTheme.value.name,
    mode: generationMode.value,
    costumeName: selectedCostume.value?.name || '未选择',
    timeText: now.toLocaleString('zh-CN', { hour12: false }),
  }

  generatedHistory.value.unshift(result)

  if (generatedHistory.value.length > 3) {
    const removed = generatedHistory.value.splice(3)
    removed.forEach((item) => {
      URL.revokeObjectURL(item.url)
    })
  }

  activeHistoryId.value = id
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.95) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

async function buildGeneratedImageBlob() {
  if (!originalImageUrl.value) {
    return null
  }

  const img = await loadImage(originalImageUrl.value)
  const canvas = document.createElement('canvas')
  const canvasWidth = 1080
  const sourceRatio = img.width / img.height
  const normalizedRatio = Math.min(Math.max(sourceRatio, 0.65), 1.25)
  const canvasHeight = Math.round(canvasWidth / normalizedRatio)
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
  gradient.addColorStop(0, '#1A1A2E')
  gradient.addColorStop(1, '#16213E')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const framePadding = 36
  const frameWidth = canvasWidth - framePadding * 2
  const frameHeight = canvasHeight - framePadding * 2
  const scale = Math.min(frameWidth / img.width, frameHeight / img.height)
  const drawWidth = img.width * scale
  const drawHeight = img.height * scale
  const drawX = (canvasWidth - drawWidth) / 2
  const drawY = (canvasHeight - drawHeight) / 2

  const saturation = 1 + makeupStrength.value / 120
  const contrast = 1 + ornamentDensity.value / 130
  const brightness = 0.84 + lightingMood.value / 160

  ctx.filter = `saturate(${saturation}) contrast(${contrast}) brightness(${brightness})`
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
  ctx.filter = 'none'

  ctx.fillStyle = `${activeColor.value.hex}38`
  ctx.fillRect(drawX, drawY, drawWidth, drawHeight)

  ctx.strokeStyle = '#FFB703'
  ctx.lineWidth = 8
  ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40)

  ctx.strokeStyle = 'rgba(255, 183, 3, 0.65)'
  ctx.lineWidth = 2
  ctx.strokeRect(42, 42, canvasWidth - 84, canvasHeight - 84)

  const footerHeight = 106
  ctx.fillStyle = 'rgba(0,0,0,0.42)'
  ctx.fillRect(70, canvasHeight - footerHeight - 32, canvasWidth - 140, footerHeight)

  ctx.fillStyle = '#F5F5DC'
  ctx.font = 'bold 38px "Noto Serif SC", serif'
  ctx.fillText(`主题：${activeTheme.value.name}`, 90, canvasHeight - 94)

  ctx.font = '27px "Noto Serif SC", serif'
  const modeText = generationMode.value === 'makeup' ? '模式：仅妆容' : `模式：妆容+服装（${selectedCostume.value?.name || '自动搭配'}）`
  ctx.fillText(modeText, 90, canvasHeight - 54)

  return canvasToBlob(canvas)
}

async function finishGeneration() {
  clearTimers()

  const blob = await buildGeneratedImageBlob()
  if (!blob) {
    onGenerateFailure('生成失败：无法构建结果图。请重试。')
    return
  }

  const resultUrl = URL.createObjectURL(blob)
  addHistoryResult(resultUrl)

  generationStatus.value = 'success'
  generationError.value = ''
  generationMessage.value = `生成完成：${activeTheme.value.name}（${new Date().toLocaleTimeString('zh-CN', { hour12: false })}）`
  generationProgress.value = 100
  showToast('妆造生成完成，可下载高清图。')
}

async function startGeneration() {
  if (!canGenerate.value) {
    generationError.value = '请先上传图片并选择主题后再生成。'
    generationStatus.value = 'error'
    return
  }

  if (networkOffline.value) {
    onGenerateFailure('网络中断：请恢复网络后重试。')
    return
  }

  generationStatus.value = 'generating'
  generationError.value = ''
  generationMessage.value = ''
  generationProgress.value = 0

  progressTimer = setInterval(() => {
    if (networkOffline.value) {
      onGenerateFailure('网络中断：已保留参数，请联网后重试。')
      return
    }

    generationProgress.value = Math.min(generationProgress.value + Math.floor(Math.random() * 8 + 4), 100)

    if (generationProgress.value >= 100) {
      finishGeneration()
    }
  }, 420)

  timeoutTimer = setTimeout(() => {
    if (generationStatus.value === 'generating') {
      onGenerateFailure('生成超时（>20秒）。请点击重试。', 'timeout')
    }
  }, 20000)
}

async function retryGeneration() {
  await startGeneration()
}

function switchImage() {
  clearCurrentImage()
  openFileDialog()
}

function selectHistory(id) {
  activeHistoryId.value = id
}

function downloadFromUrl(url, fileName) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
}

function downloadCurrent() {
  if (!activeResult.value) {
    showToast('请先生成效果图。')
    return
  }

  downloadFromUrl(activeResult.value.url, `ai-makeup-1080-${Date.now()}.jpg`)
}

async function sharePoster() {
  if (!activeResult.value) {
    showToast('请先生成结果后再分享。')
    return
  }

  const img = await loadImage(activeResult.value.url)
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920

  const ctx = canvas.getContext('2d')
  const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920)
  bgGradient.addColorStop(0, '#1A1A2E')
  bgGradient.addColorStop(1, '#5D0D1A')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, 1080, 1920)

  ctx.strokeStyle = '#FFB703'
  ctx.lineWidth = 6
  ctx.strokeRect(40, 40, 1000, 1840)

  const posterFrameX = 100
  const posterFrameY = 280
  const posterFrameW = 880
  const posterFrameH = 920
  const posterScale = Math.min(posterFrameW / img.width, posterFrameH / img.height)
  const posterDrawW = img.width * posterScale
  const posterDrawH = img.height * posterScale
  const posterDrawX = posterFrameX + (posterFrameW - posterDrawW) / 2
  const posterDrawY = posterFrameY + (posterFrameH - posterDrawH) / 2

  ctx.fillStyle = 'rgba(4, 10, 24, 0.6)'
  ctx.fillRect(posterFrameX, posterFrameY, posterFrameW, posterFrameH)
  ctx.drawImage(img, posterDrawX, posterDrawY, posterDrawW, posterDrawH)

  ctx.fillStyle = '#F5F5DC'
  ctx.font = 'bold 58px "Noto Serif SC", serif'
  ctx.fillText('非遗戏曲妆造海报', 260, 170)

  ctx.font = '34px "Noto Serif SC", serif'
  ctx.fillText(`主题：${activeResult.value.themeName}`, 130, 1280)
  ctx.fillText(`模式：${activeResult.value.mode === 'makeup' ? '仅妆容' : '妆容+服装'}`, 130, 1340)
  ctx.fillText(`时间：${activeResult.value.timeText}`, 130, 1400)

  const blob = await canvasToBlob(canvas, 'image/png', 0.96)
  if (!blob) {
    showToast('海报生成失败，请重试。')
    return
  }

  const url = URL.createObjectURL(blob)
  downloadFromUrl(url, `share-poster-${Date.now()}.png`)
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 800)
  showToast('分享海报已生成并下载。')
}

function openViewer(src, title) {
  if (!src) {
    return
  }

  viewerSrc.value = src
  viewerTitle.value = title
  viewerScale.value = 1
  viewerRotate.value = 0
  viewerOpen.value = true
}

function closeViewer() {
  viewerOpen.value = false
}

function zoomIn() {
  viewerScale.value = Math.min(viewerScale.value + 0.2, 3)
}

function zoomOut() {
  viewerScale.value = Math.max(viewerScale.value - 0.2, 0.5)
}

function rotateViewer() {
  viewerRotate.value += 90
}

function resetViewer() {
  viewerScale.value = 1
  viewerRotate.value = 0
}

function downloadViewerImage() {
  if (!viewerSrc.value) {
    return
  }

  downloadFromUrl(viewerSrc.value, `viewer-export-${Date.now()}.jpg`)
}

function closeNoFaceModal() {
  showNoFaceModal.value = false
  noFaceReason.value = ''
}

function onOnline() {
  networkOffline.value = false
  showToast('网络已恢复。')
}

function onOffline() {
  networkOffline.value = true

  if (generationStatus.value === 'generating') {
    onGenerateFailure('网络中断：已保留所有参数，请联网后重试。')
  }

  showToast('网络已中断，当前数据将保留。')
}

onMounted(() => {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
})

onBeforeUnmount(() => {
  clearTimers()
  closeCamera()
  onComparePointerUp()

  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  window.removeEventListener('online', onOnline)
  window.removeEventListener('offline', onOffline)

  if (originalImageUrl.value) {
    URL.revokeObjectURL(originalImageUrl.value)
  }

  clearGeneratedHistory()
})
</script>

<template>
  <section class="ai-page space-y-4 pb-4" :style="heroBgStyle">
    <div v-if="networkOffline" class="opera-toast px-4 py-2 text-sm">
      网络已断开，页面会保留你当前输入，恢复后可继续生成。
    </div>

    <div class="ai-top-row">
      <article class="opera-card ai-card upload-card p-4 md:p-5">
        <h2 class="section-title">上传原图</h2>
        <p class="mt-2 text-xs leading-6 text-[#F5F5DC]/82">
          支持 JPG / PNG / WebP，单张 ≤10MB，仅支持正面清晰半身人像。
        </p>

        <div class="mt-3 flex gap-2 text-sm">
          <button
            type="button"
            class="opera-tab"
            :class="{ 'opera-tab-active': uploadMethod === 'local' }"
            @click="uploadMethod = 'local'"
          >
            本地上传
          </button>
          <button
            type="button"
            class="opera-tab"
            :class="{ 'opera-tab-active': uploadMethod === 'camera' }"
            @click="uploadMethod = 'camera'"
          >
            摄像头拍摄
          </button>
        </div>

        <div v-if="uploadMethod === 'local'" class="mt-4 space-y-3">
          <div
            class="upload-zone rounded-lg border border-dashed p-5 text-center"
            :class="dragActive ? 'border-[#FFB703] bg-[#1D3557]/40' : 'border-[#FFB703]/45 bg-black/20'"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              @change="onLocalFileChange"
            />
            <p class="text-sm">拖拽图片到此处，或点击按钮上传</p>
            <button type="button" class="opera-btn mt-3 px-4 py-2 text-sm" @click="openFileDialog">
              点击上传
            </button>
          </div>

          <div v-if="isUploading" class="rounded-lg border border-[#FFB703]/45 bg-black/20 p-3">
            <div class="flex items-center justify-between text-xs">
              <span>上传中...</span>
              <span>{{ uploadProgress }}%</span>
            </div>
            <div class="mt-2 h-2 rounded-full bg-black/50">
              <div
                class="h-2 rounded-full bg-gradient-to-r from-[#E63946] to-[#FFB703] transition-all"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
          </div>

          <div v-if="uploadError" class="rounded-lg border border-[#E63946] bg-[#E63946]/20 px-3 py-2 text-sm text-[#F5F5DC]">
            {{ uploadError }}
          </div>
        </div>

        <div v-else class="mt-4 space-y-3">
          <div class="rounded-lg border border-[#FFB703]/45 bg-black/20 p-3">
            <div class="flex flex-wrap gap-2 text-xs">
              <button type="button" class="opera-btn px-3 py-1.5" @click="openCamera">开启摄像头</button>
              <button type="button" class="opera-btn px-3 py-1.5" @click="captureFromCamera" :disabled="!cameraOpened">
                拍摄并上传
              </button>
              <button type="button" class="opera-btn px-3 py-1.5" @click="closeCamera" :disabled="!cameraOpened">
                关闭摄像头
              </button>
            </div>
            <video ref="videoRef" class="mt-3 h-48 w-full rounded-lg border border-[#FFB703]/40 bg-black object-cover" autoplay muted playsinline></video>
            <p v-if="cameraError" class="mt-2 text-xs text-[#FFB3B3]">{{ cameraError }}</p>
          </div>
        </div>

        <div class="mt-4 rounded-lg border border-[#FFB703]/40 bg-black/20 p-3">
          <p class="text-xs text-[#F5F5DC]/75">当前文件：{{ selectedFileName }}</p>
          <p class="mt-1 text-xs text-[#A8A8A8]">文件大小：{{ formattedUploadSize }}</p>
          <div class="upload-preview-box mt-3 overflow-hidden rounded-lg border border-[#FFB703]/45 bg-black/30">
            <img
              v-if="originalImageUrl"
              :src="originalImageUrl"
              alt="原图预览"
              class="upload-preview-image"
              @click="openViewer(originalImageUrl, '原图预览')"
            />
            <p v-else class="upload-preview-placeholder grid place-items-center text-sm text-[#A8A8A8]">上传后显示预览</p>
          </div>

          <button
            v-if="originalImageUrl"
            type="button"
            class="opera-btn mt-3 w-full px-3 py-2 text-xs"
            @click="openFileDialog"
          >
            重新上传图片
          </button>
        </div>
      </article>

      <article class="opera-card ai-card theme-card p-4 md:p-5">
        <h2 class="section-title">主题选择</h2>
        <ul class="theme-list mt-3">
          <li v-for="theme in themes" :key="theme.id">
            <button
              type="button"
              class="theme-option"
              :class="{ 'theme-option-active': activeThemeId === theme.id }"
              @click="activeThemeId = theme.id"
            >
              <p class="text-sm font-semibold tracking-[0.08em]">{{ theme.name }}</p>
              <p class="mt-1 text-xs text-[#F5F5DC]/82">{{ theme.desc }}</p>
            </button>
          </li>
        </ul>

        <div class="mt-4 space-y-3">
          <label class="block text-xs text-[#F5F5DC]/88">
            妆感浓度 <span class="float-right">{{ makeupStrength }}%</span>
            <input v-model="makeupStrength" class="opera-range mt-2" type="range" min="0" max="100" />
          </label>

          <label class="block text-xs text-[#F5F5DC]/88">
            饰件密度 <span class="float-right">{{ ornamentDensity }}%</span>
            <input v-model="ornamentDensity" class="opera-range mt-2" type="range" min="0" max="100" />
          </label>

          <label class="block text-xs text-[#F5F5DC]/88">
            光感氛围 <span class="float-right">{{ lightingMood }}%</span>
            <input v-model="lightingMood" class="opera-range mt-2" type="range" min="0" max="100" />
          </label>
        </div>

        <div class="mt-4">
          <p class="mb-2 text-xs text-[#F5F5DC]/85">色彩预设</p>
          <div class="flex flex-wrap gap-3">
          <button
            v-for="preset in colorPresets"
            :key="preset.id"
            type="button"
            class="group flex flex-col items-center gap-1 text-[11px] text-[#F5F5DC]/86"
            :title="preset.name"
            :class="
              activeColorPreset === preset.id
                ? 'text-[#FFB703]'
                : 'text-[#F5F5DC]/86'
            "
            @click="activeColorPreset = preset.id"
          >
            <span
              class="h-8 w-8 rounded-full border-2 transition"
              :class="
                activeColorPreset === preset.id
                  ? 'border-[#FFB703] shadow-[0_0_0_3px_rgba(255,183,3,0.3)]'
                  : 'border-white/40 group-hover:border-[#FFB703]/70'
              "
              :style="{ background: preset.hex }"
            ></span>
            <span>{{ preset.name }}</span>
          </button>
        </div>
        </div>
      </article>

      <article class="opera-card ai-card workshop-card p-4 md:p-5">
        <h2 class="section-title">生成工坊</h2>
        <p class="mt-2 text-sm text-[#F5F5DC]/85">当前主题：{{ activeTheme.name }}</p>
        <p class="mt-1 text-xs text-[#A8A8A8]">{{ activeTheme.desc }}</p>

        <div v-if="generationStatus === 'generating'" class="mt-4 rounded-lg border border-[#FFB703]/55 bg-black/35 p-4">
          <p class="text-sm">{{ generationStageText }}</p>
          <div class="mt-3 h-3 rounded-full bg-black/50">
            <div
              class="flow-bar h-3 rounded-full bg-[linear-gradient(90deg,#FFB703_0%,#E63946_55%,#FFB703_100%)]"
              :style="{ width: `${generationProgress}%` }"
            ></div>
          </div>
          <p class="mt-2 text-xs text-[#F5F5DC]/78">{{ generationProgress }}%</p>
        </div>

        <template v-else>
          <div class="mt-4 rounded-lg border border-[#FFB703]/45 bg-black/25 p-3 text-sm">
            <p class="font-semibold text-[#F5F5DC]">✨ 生成小贴士</p>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-xs text-[#F5F5DC]/82">
              <li>推荐正面清晰半身人像，无遮挡效果最佳</li>
              <li>调节左侧参数实时影响生成效果</li>
              <li>支持仅妆容或妆容+服装全套生成</li>
              <li>图片仅临时存储，24小时后自动删除</li>
            </ul>
          </div>

          <div class="mt-4 space-y-3 text-sm">
            <label class="flex items-center gap-2">
              <input v-model="generationMode" type="radio" value="makeup" />
              仅生成妆容
            </label>
            <label class="flex items-center gap-2">
              <input v-model="generationMode" type="radio" value="full" />
              妆容+服装全套造型
            </label>
          </div>

          <div v-if="shouldShowCostumeSelect" class="mt-3 rounded-lg border border-[#FFB703]/45 bg-black/25 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <label class="text-xs text-[#F5F5DC]/88">服装匹配</label>
              <RouterLink to="/costume" class="text-xs text-[#FFB703] hover:underline">查看更多服装</RouterLink>
            </div>
            <select v-model="selectedCostumeId" class="opera-select mt-2 w-full px-3 py-2 text-sm">
              <option v-for="costume in costumeItems" :key="costume.id" :value="costume.id">
                {{ costume.name }}
              </option>
            </select>
          </div>

          <button
            type="button"
            class="opera-btn mt-4 w-full px-4 py-2.5 text-sm"
            :disabled="!canGenerate"
            @click="startGeneration"
          >
            生成戏曲妆造
          </button>

          <div class="preview-card mt-4 rounded-lg border border-[#FFB703]/45 bg-black/25 p-2.5">
            <p class="text-xs text-[#F5F5DC]/88">效果预览图</p>
            <img
              :src="effectPreviewSrc"
              alt="效果预览图"
              class="effect-preview-image mt-2"
              :style="livePreviewStyle"
              @click="openViewer(effectPreviewSrc, '效果预览图')"
            />
          </div>

          <p v-if="generationStatus === 'success'" class="mt-3 rounded-lg border border-[#FFB703]/45 bg-black/25 p-3 text-xs text-[#F5F5DC]/84">
            {{ generationMessage }}
          </p>

          <div
            v-if="generationStatus === 'error' || generationStatus === 'timeout'"
            class="mt-3 rounded-lg border border-[#E63946] bg-[#E63946]/20 p-3 text-xs"
          >
            <p>{{ generationError }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="retryGeneration">重试</button>
              <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="switchImage">换图</button>
            </div>
          </div>

          <div v-if="activeResult" class="mt-4 rounded-lg border border-[#FFB703]/50 bg-black/25 p-3">
            <p class="text-xs text-[#F5F5DC]/86">最新结果</p>
            <img
              :src="activeResult.url"
              alt="生成结果缩略图"
              class="result-thumbnail mt-2 w-full rounded-lg border border-[#FFB703]/45"
              @click="openViewer(activeResult.url, '生成结果')"
            />
            <p class="mt-2 text-xs text-[#F5F5DC]/78">
              {{ activeResult.themeName }} · {{ activeResult.timeText }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="downloadCurrent">下载高清图</button>
              <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="retryGeneration">重新生成</button>
              <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="sharePoster">分享海报</button>
            </div>
          </div>
        </template>
      </article>
    </div>

    <article class="opera-card ai-card compare-card p-4 md:p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="section-title">妆造前后对比</h3>
          <p class="mt-1 text-xs text-[#A8A8A8]">支持滑动对比与并列对比，点击图片可全屏查看。</p>
        </div>
        <div class="flex gap-2 text-sm">
          <button
            type="button"
            class="opera-tab"
            :class="{ 'opera-tab-active': compareMode === 'slider' }"
            @click="compareMode = 'slider'"
          >
            滑动对比
          </button>
          <button
            type="button"
            class="opera-tab"
            :class="{ 'opera-tab-active': compareMode === 'side' }"
            @click="compareMode = 'side'"
          >
            并列对比
          </button>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="(item, index) in generatedHistory"
          :key="item.id"
          type="button"
          class="rounded-full border px-3 py-1 text-xs transition"
          :class="
            activeHistoryId === item.id
              ? 'border-[#FFB703] bg-[#E63946]/80'
              : 'border-[#FFB703]/45 bg-black/25 hover:border-[#FFB703]/80'
          "
          @click="selectHistory(item.id)"
        >
          第{{ index + 1 }}次 · {{ item.timeText.slice(11, 19) }}
        </button>
      </div>

      <div v-if="compareMode === 'slider'" class="mt-4">
        <div ref="sliderCompareRef" class="slider-compare" @pointerdown="onComparePointerDown">
          <img
            v-if="originalImageUrl"
            :src="originalImageUrl"
            alt="原图"
            class="compare-image"
            @click="openViewer(originalImageUrl, '原图')"
          />
          <div v-else class="compare-placeholder">上传图片后显示对比</div>

          <div v-if="originalImageUrl && currentGeneratedPreview" class="compare-overlay" :style="{ clipPath: `inset(0 ${100 - compareSlider}% 0 0)` }">
            <img
              :src="currentGeneratedPreview"
              alt="效果图"
              class="compare-image"
              @click="openViewer(currentGeneratedPreview, '效果图')"
            />
          </div>

          <div
            v-if="originalImageUrl && currentGeneratedPreview"
            class="compare-line"
            :style="{ left: `${compareSlider}%` }"
          ></div>
        </div>

        <input
          v-if="originalImageUrl && currentGeneratedPreview"
          v-model="compareSlider"
          class="opera-range mt-3"
          type="range"
          min="0"
          max="100"
        />
      </div>

      <div v-else class="mt-4 compare-side-row">
        <figure class="compare-pane">
          <figcaption>原图</figcaption>
          <img
            v-if="originalImageUrl"
            :src="originalImageUrl"
            alt="原图"
            class="compare-pane-image"
            @click="openViewer(originalImageUrl, '原图')"
          />
          <p v-else class="compare-placeholder">上传后显示</p>
        </figure>

        <figure class="compare-pane">
          <figcaption>效果图</figcaption>
          <img
            v-if="currentGeneratedPreview"
            :src="currentGeneratedPreview"
            alt="效果图"
            class="compare-pane-image"
            @click="openViewer(currentGeneratedPreview, '效果图')"
          />
          <p v-else class="compare-placeholder">生成后显示</p>
        </figure>
      </div>
    </article>

    <div v-if="isOperationLocked" class="opera-mask-overlay grid place-items-center px-4">
      <div class="opera-card w-full max-w-lg p-5 text-center">
        <p class="text-sm text-[#F5F5DC]/90">AI 妆造生成中，页面操作已暂时锁定</p>
        <p class="mt-2 text-base font-semibold">{{ generationStageText }}</p>
        <div class="mt-3 h-3 rounded-full bg-black/50">
          <div
            class="h-3 rounded-full bg-[linear-gradient(90deg,#FFB703_0%,#E63946_55%,#FFB703_100%)] transition-all"
            :style="{ width: `${generationProgress}%` }"
          ></div>
        </div>
        <p class="mt-2 text-xs">{{ generationProgress }}%</p>
      </div>
    </div>

    <div v-if="viewerOpen" class="viewer-wrap" @click.self="closeViewer">
      <div class="viewer-box">
        <div class="viewer-header">
          <p>{{ viewerTitle }}</p>
          <button type="button" class="opera-btn px-3 py-1 text-xs" @click="closeViewer">关闭</button>
        </div>

        <div class="viewer-canvas">
          <img
            :src="viewerSrc"
            alt="全屏预览"
            :style="{
              transform: `scale(${viewerScale}) rotate(${viewerRotate}deg)`,
            }"
          />
        </div>

        <div class="viewer-tools">
          <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="zoomIn">放大</button>
          <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="zoomOut">缩小</button>
          <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="rotateViewer">旋转</button>
          <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="resetViewer">重置</button>
          <button type="button" class="opera-btn px-3 py-1.5 text-xs" @click="downloadViewerImage">下载</button>
        </div>
      </div>
    </div>

    <div v-if="showNoFaceModal" class="viewer-wrap" @click.self="closeNoFaceModal">
      <div class="opera-card w-full max-w-md p-5">
        <h3 class="text-lg font-semibold">未识别到清晰人脸</h3>
        <p class="mt-2 text-sm text-[#F5F5DC]/85">{{ noFaceReason }}</p>
        <div class="mt-4 flex gap-2">
          <button type="button" class="opera-btn px-4 py-2 text-sm" @click="closeNoFaceModal">知道了</button>
          <button type="button" class="opera-btn px-4 py-2 text-sm" @click="openFileDialog">重新上传</button>
        </div>
      </div>
    </div>

    <div v-if="noticeMessage" class="fixed bottom-4 right-4 z-[95] opera-toast px-4 py-2 text-sm">
      {{ noticeMessage }}
    </div>
  </section>
</template>

<style scoped>
.ai-page {
  width: min(1080px, 100%);
  margin: 0 auto;
  position: relative;
  isolation: isolate;
}

.ai-page::before {
  content: '';
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: min(1020px, 96%);
  height: 280px;
  border-radius: 16px;
  border: 2px solid rgba(255, 183, 3, 0.35);
  background:
    linear-gradient(180deg, rgba(6, 16, 34, 0.5), rgba(18, 16, 26, 0.76)),
    var(--hero-bg-image) center 22% / cover no-repeat;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.36);
  opacity: 0.55;
  pointer-events: none;
  z-index: -1;
}

.ai-page::after {
  content: '';
  position: absolute;
  top: 130px;
  left: 50%;
  transform: translateX(-50%);
  width: min(1020px, 96%);
  height: 220px;
  background:
    linear-gradient(180deg, rgba(16, 18, 28, 0.12), rgba(18, 9, 16, 0.84)),
    radial-gradient(circle at 50% 0, rgba(255, 183, 3, 0.14), transparent 60%);
  border-radius: 16px;
  pointer-events: none;
  z-index: -1;
}

.ai-top-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
  margin-top: 14px;
}

.ai-card {
  width: 100%;
}

.upload-card,
.theme-card,
.workshop-card {
  min-height: 480px;
}

.upload-card,
.theme-card,
.workshop-card,
.compare-card {
  display: flex;
  flex-direction: column;
}

.compare-card {
  min-height: 340px;
}

.section-title {
  margin: 0;
  font-size: 1.36rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #f8dd9f;
  text-shadow: 0 4px 14px rgba(0, 0, 0, 0.32);
}

.ai-page :deep(.text-xs) {
  font-size: 0.8rem;
}

.ai-page :deep(.text-sm) {
  font-size: 0.9rem;
}

.theme-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.theme-list li {
  margin: 0;
  padding: 0;
}

.theme-option {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 183, 3, 0.58);
  padding: 12px 12px;
  text-align: left;
  color: #f5f5dc;
  background: linear-gradient(180deg, rgba(28, 44, 79, 0.75), rgba(14, 14, 24, 0.8));
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.theme-option:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 183, 3, 0.82);
}

.theme-option-active {
  border-color: rgba(255, 183, 3, 0.94);
  background: linear-gradient(180deg, rgba(230, 57, 70, 0.95), rgba(112, 17, 31, 0.96));
  box-shadow: 0 10px 20px rgba(90, 16, 28, 0.4);
}

.upload-preview-box {
  width: 100%;
  aspect-ratio: 4 / 5;
  min-height: 220px;
  max-height: 340px;
}

.upload-preview-image,
.upload-preview-placeholder {
  width: 100%;
  height: 100%;
}

.upload-preview-image {
  object-fit: cover;
  object-position: center 20%;
  cursor: zoom-in;
}

.result-thumbnail {
  aspect-ratio: 3 / 2;
  max-height: 180px;
  object-fit: cover;
  object-position: center 20%;
}

.effect-preview-image {
  width: 100%;
  aspect-ratio: 16 / 10;
  max-height: 156px;
  border-radius: 8px;
  border: 1px solid rgba(255, 183, 3, 0.5);
  object-fit: cover;
  object-position: center 20%;
  cursor: zoom-in;
}

.upload-zone {
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.slider-compare {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 183, 3, 0.5);
  background: rgba(0, 0, 0, 0.25);
  min-height: 260px;
  aspect-ratio: 16 / 7;
}

.compare-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 22%;
  cursor: zoom-in;
}

.compare-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.compare-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #ffb703;
  box-shadow: 0 0 12px rgba(255, 183, 3, 0.72);
  transform: translateX(-1px);
}

.compare-pane {
  margin: 0;
  border-radius: 10px;
  border: 1px solid rgba(255, 183, 3, 0.5);
  background: rgba(0, 0, 0, 0.25);
  padding: 10px;
}

.compare-pane figcaption {
  margin: 0 0 8px;
  font-size: 0.86rem;
}

.compare-side-row {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.compare-side-row .compare-pane {
  flex: 1 1 0;
  min-width: 0;
}

.compare-pane-image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  object-fit: cover;
  object-position: center 22%;
  cursor: zoom-in;
}

.compare-placeholder {
  display: grid;
  place-items: center;
  min-height: 220px;
  color: rgba(245, 245, 220, 0.62);
  font-size: 0.9rem;
}

.viewer-wrap {
  position: fixed;
  inset: 0;
  z-index: 98;
  display: grid;
  place-items: center;
  background: rgba(7, 9, 16, 0.86);
  backdrop-filter: blur(3px);
  padding: 16px;
}

.viewer-box {
  width: min(1080px, 95vw);
  border-radius: 12px;
  border: 1px solid rgba(255, 183, 3, 0.72);
  background: linear-gradient(145deg, rgba(32, 18, 34, 0.95), rgba(16, 20, 38, 0.95));
  padding: 12px;
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.viewer-header p {
  margin: 0;
}

.viewer-canvas {
  margin-top: 10px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 183, 3, 0.45);
  background: rgba(0, 0, 0, 0.4);
  min-height: 320px;
  display: grid;
  place-items: center;
}

.viewer-canvas img {
  max-width: 100%;
  max-height: 74vh;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.viewer-tools {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.flow-bar {
  background-size: 180% 100%;
  animation: flow 1.3s linear infinite;
}

@keyframes flow {
  from {
    background-position: 0 0;
  }

  to {
    background-position: 180% 0;
  }
}

@media (max-width: 1280px) {
  .section-title {
    font-size: 1.28rem;
  }

  .slider-compare {
    aspect-ratio: 16 / 8;
  }
}

@media (max-width: 1199px) and (min-width: 768px) {
  .ai-page::before {
    height: 260px;
    opacity: 0.4;
  }

  .ai-page::after {
    top: 120px;
    height: 220px;
  }

  .ai-top-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workshop-card {
    grid-column: 1 / -1;
  }

  .upload-card,
  .theme-card,
  .workshop-card {
    min-height: 440px;
  }

  .compare-card {
    min-height: 380px;
  }
}

@media (max-width: 767px) {
  .ai-page::before,
  .ai-page::after {
    width: 100%;
    border-radius: 12px;
  }

  .ai-page::before {
    top: -24px;
    height: 220px;
    opacity: 0.35;
  }

  .ai-page::after {
    top: 94px;
    height: 180px;
  }

  .section-title {
    font-size: 1.16rem;
  }

  .ai-top-row {
    grid-template-columns: 1fr;
  }

  .workshop-card {
    grid-column: auto;
  }

  .upload-card,
  .theme-card,
  .workshop-card,
  .compare-card {
    min-height: auto;
  }

  .upload-preview-box {
    min-height: 200px;
    max-height: 300px;
  }

  .result-thumbnail {
    max-height: 160px;
  }

  .effect-preview-image {
    max-height: 150px;
  }

  .slider-compare {
    aspect-ratio: 16 / 10;
  }

  .compare-side-row .compare-pane {
    min-width: calc(88vw - 36px);
  }

  .viewer-canvas img {
    max-height: 56vh;
  }
}
</style>
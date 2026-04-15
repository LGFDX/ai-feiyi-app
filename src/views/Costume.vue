<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { costumeFilters, costumeItems } from '../data/costumeData'

const selectedDynasty = ref('全部')
const selectedType = ref('全部')
const keyword = ref('')
const visibleCount = ref(6)
const sentinelRef = ref(null)
let observer

const filteredItems = computed(() =>
  costumeItems.filter((item) => {
    const dynastyMatch = selectedDynasty.value === '全部' || item.dynasty === selectedDynasty.value
    const typeMatch = selectedType.value === '全部' || item.type === selectedType.value
    const query = keyword.value.trim().toLowerCase()
    const keywordMatch =
      !query ||
      [item.name, item.intro, item.dynasty, item.type].join(' ').toLowerCase().includes(query)

    return dynastyMatch && typeMatch && keywordMatch
  }),
)

const visibleItems = computed(() => filteredItems.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleItems.value.length < filteredItems.value.length)

watch([selectedDynasty, selectedType, keyword], () => {
  visibleCount.value = 6
})

function loadMore() {
  if (hasMore.value) {
    visibleCount.value += 4
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMore()
      }
    },
    { threshold: 0.1 },
  )

  if (sentinelRef.value) {
    observer.observe(sentinelRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <section class="costume-page">
    <aside class="opera-card costume-filter p-4 md:p-5">
      <h2 class="costume-panel-title">服装筛选</h2>
      <p class="costume-panel-desc">按朝代与类型筛选，快速匹配戏曲妆造风格。</p>

      <label class="mt-4 block text-sm text-[#F5F5DC]/90">
        朝代/体系
        <select v-model="selectedDynasty" class="opera-select mt-2 w-full px-3 py-2 text-sm">
          <option v-for="dynasty in costumeFilters.dynasties" :key="dynasty" :value="dynasty">
            {{ dynasty }}
          </option>
        </select>
      </label>

      <label class="mt-4 block text-sm text-[#F5F5DC]/90">
        服装类型
        <select v-model="selectedType" class="opera-select mt-2 w-full px-3 py-2 text-sm">
          <option v-for="type in costumeFilters.types" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </label>

      <label class="mt-4 block text-sm text-[#F5F5DC]/90">
        搜索关键词
        <input
          v-model="keyword"
          class="opera-input mt-2 w-full px-3 py-2 text-sm"
          placeholder="输入唐代襦裙 / 明代袄裙 / 京剧旦角宫装"
        />
      </label>
    </aside>

    <div class="costume-content">
      <article class="opera-card costume-header p-4 md:p-5">
        <h2 class="costume-panel-title">服装形制库</h2>
        <p class="costume-panel-desc">共 {{ filteredItems.length }} 条示例数据，支持唐代襦裙、明代袄裙、京剧旦角宫装等快速浏览。</p>
      </article>

      <div class="costume-grid">
        <RouterLink
          v-for="item in visibleItems"
          :key="item.id"
          :to="`/costume/${item.id}`"
          class="opera-card costume-item"
        >
          <img :src="item.cover" :alt="item.name" class="costume-cover" />
          <div class="costume-info">
            <h3>{{ item.name }}</h3>
            <p class="meta">{{ item.dynasty }} · {{ item.type }}</p>
            <p class="intro">{{ item.intro }}</p>
          </div>
        </RouterLink>
      </div>

      <p v-if="!visibleItems.length" class="opera-card p-4 text-sm text-[#F5F5DC]">当前筛选条件下暂无结果。</p>

      <div ref="sentinelRef" class="grid place-items-center py-2">
        <p v-if="hasMore" class="text-sm text-[#F5F5DC]/82">下滑加载更多服装...</p>
        <p v-else class="text-sm text-[#A8A8A8]">已显示全部服装</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.costume-page {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
}

.costume-filter {
  height: fit-content;
  position: sticky;
  top: 132px;
}

.costume-content {
  display: grid;
  gap: 14px;
}

.costume-panel-title {
  margin: 0;
  font-size: 1.2rem;
  letter-spacing: 0.08em;
}

.costume-panel-desc {
  margin: 8px 0 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(245, 245, 220, 0.84);
}

.costume-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.costume-item {
  padding: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.costume-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 28px rgba(0, 0, 0, 0.35);
}

.costume-cover {
  width: 100%;
  height: 240px;
  border-radius: 8px;
  border: 1px solid rgba(255, 183, 3, 0.5);
  object-fit: cover;
}

.costume-info {
  margin-top: 10px;
}

.costume-info h3 {
  margin: 0;
  font-size: 1.06rem;
  letter-spacing: 0.04em;
}

.costume-info .meta {
  margin: 5px 0 0;
  color: rgba(245, 245, 220, 0.72);
  font-size: 0.82rem;
}

.costume-info .intro {
  margin: 8px 0 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(245, 245, 220, 0.84);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 1100px) {
  .costume-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .costume-page {
    grid-template-columns: 1fr;
  }

  .costume-filter {
    position: relative;
    top: 0;
  }
}

@media (max-width: 620px) {
  .costume-grid {
    grid-template-columns: 1fr;
  }

  .costume-cover {
    height: 220px;
  }
}
</style>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { cultureCategories, cultureItems } from '../data/cultureData'

const selectedCategory = ref('全部')
const keyword = ref('')
const visibleCount = ref(6)
const sentinelRef = ref(null)
let observer

const filteredItems = computed(() =>
  cultureItems.filter((item) => {
    const matchCategory = selectedCategory.value === '全部' || item.category === selectedCategory.value
    const query = keyword.value.trim().toLowerCase()
    const matchKeyword =
      !query ||
      [item.name, item.intro, item.region, item.level].join(' ').toLowerCase().includes(query)

    return matchCategory && matchKeyword
  }),
)

const visibleItems = computed(() => filteredItems.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleItems.value.length < filteredItems.value.length)

function loadMore() {
  if (hasMore.value) {
    visibleCount.value += 4
  }
}

watch([selectedCategory, keyword], () => {
  visibleCount.value = 6
})

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
  <section class="culture-page">
    <aside class="opera-card culture-filter p-4 md:p-5">
      <h2 class="culture-panel-title">分类筛选</h2>
      <p class="culture-panel-desc">从戏曲头饰、戏曲妆容与传统工艺中快速定位灵感来源。</p>

      <div class="mt-4 space-y-2">
        <button
          v-for="category in cultureCategories"
          :key="category"
          type="button"
          class="w-full rounded-lg border px-3 py-2 text-left text-sm transition"
          :class="
            selectedCategory === category
              ? 'border-[#FFB703] bg-gradient-to-b from-[#E63946] to-[#71111D] text-[#F5F5DC]'
              : 'border-[#FFB703]/40 bg-[#1D3557]/40 text-[#F5F5DC]/85 hover:border-[#FFB703]/75'
          "
          @click="selectedCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <label class="mt-5 block text-sm text-[#F5F5DC]/90">
        搜索关键词
        <input
          v-model="keyword"
          class="opera-input mt-2 w-full px-3 py-2 text-sm"
          placeholder="输入名称、地区或级别"
        />
      </label>
    </aside>

    <div class="culture-content">
      <header class="opera-card culture-header p-4 md:p-5">
        <h2 class="culture-panel-title">非遗文化库</h2>
        <p class="culture-panel-desc">共收录 {{ filteredItems.length }} 条示例数据，持续滚动可自动加载更多内容。</p>
      </header>

      <div class="culture-grid">
        <RouterLink
          v-for="item in visibleItems"
          :key="item.id"
          :to="`/culture/${item.id}`"
          class="opera-card culture-item"
        >
          <img :src="item.cover" :alt="item.name" class="culture-cover" />
          <div class="culture-info">
            <p class="meta">{{ item.category }} · {{ item.region }}</p>
            <h3>{{ item.name }}</h3>
            <p class="intro">{{ item.intro }}</p>
          </div>
        </RouterLink>
      </div>

      <p v-if="!visibleItems.length" class="opera-card p-4 text-sm text-[#F5F5DC]">未找到匹配结果，请调整筛选条件。</p>

      <div ref="sentinelRef" class="load-sentinel">
        <p v-if="hasMore" class="text-sm text-[#F5F5DC]/80">下滑加载更多...</p>
        <p v-else class="text-sm text-[#A8A8A8]">已显示全部数据</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.culture-page {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
}

.culture-filter {
  height: fit-content;
  position: sticky;
  top: 132px;
}

.culture-content {
  display: grid;
  gap: 14px;
}

.culture-panel-title {
  margin: 0;
  font-size: 1.2rem;
  letter-spacing: 0.08em;
}

.culture-panel-desc {
  margin: 8px 0 0;
  color: rgba(245, 245, 220, 0.84);
  font-size: 0.9rem;
  line-height: 1.6;
}

.culture-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.culture-item {
  padding: 10px;
  transform: translateY(0);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.culture-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 28px rgba(0, 0, 0, 0.33);
}

.culture-cover {
  width: 100%;
  height: 240px;
  border-radius: 8px;
  border: 1px solid rgba(255, 183, 3, 0.52);
  object-fit: cover;
}

.culture-info {
  margin-top: 10px;
}

.culture-info h3 {
  margin: 0;
  font-size: 1.06rem;
  letter-spacing: 0.08em;
}

.culture-info .meta {
  margin: 0;
  color: rgba(245, 245, 220, 0.74);
  font-size: 0.8rem;
}

.culture-info .intro {
  margin: 8px 0 0;
  color: rgba(245, 245, 220, 0.84);
  font-size: 0.9rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.load-sentinel {
  display: grid;
  place-items: center;
  min-height: 52px;
}

@media (max-width: 1100px) {
  .culture-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .culture-page {
    grid-template-columns: 1fr;
  }

  .culture-filter {
    position: relative;
    top: 0;
  }
}

@media (max-width: 620px) {
  .culture-grid {
    grid-template-columns: 1fr;
  }

  .culture-cover {
    height: 220px;
  }
}
</style>

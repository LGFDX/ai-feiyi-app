<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { cultureItems } from '../data/cultureData'
import { costumeItems } from '../data/costumeData'

const route = useRoute()

const currentItem = computed(() =>
  cultureItems.find((item) => String(item.id) === String(route.params.id)),
)

const relatedItems = computed(() => {
  if (!currentItem.value) {
    return []
  }

  return cultureItems
    .filter(
      (item) =>
        item.category === currentItem.value.category && item.id !== currentItem.value.id,
    )
    .slice(0, 3)
})

const relatedCostumes = computed(() => {
  if (!currentItem.value) {
    return []
  }

  return costumeItems.filter((item) =>
    currentItem.value.relatedCostumeIds.includes(item.id),
  )
})
</script>

<template>
  <section v-if="currentItem" class="space-y-4">
    <article class="opera-card p-4 md:p-6">
      <div class="detail-head">
        <img :src="currentItem.cover" :alt="currentItem.name" class="detail-cover" />
        <div>
          <p class="text-sm text-[#F5F5DC]/80">{{ currentItem.level }}</p>
          <h2 class="mt-1 text-2xl font-semibold tracking-[0.08em]">{{ currentItem.name }}</h2>
          <p class="mt-2 text-sm text-[#F5F5DC]/82">{{ currentItem.intro }}</p>

          <div class="mt-4 flex flex-wrap gap-2 text-xs">
            <span class="rounded-full border border-[#FFB703]/60 px-3 py-1">类别：{{ currentItem.category }}</span>
            <span class="rounded-full border border-[#FFB703]/60 px-3 py-1">地区：{{ currentItem.region }}</span>
          </div>
        </div>
      </div>
    </article>

    <div class="detail-grid">
      <article class="opera-card p-4 md:p-5">
        <h3 class="text-lg font-semibold tracking-[0.08em]">历史渊源</h3>
        <p class="mt-3 text-sm leading-7 text-[#F5F5DC]/88">{{ currentItem.history }}</p>

        <h4 class="mt-6 text-base font-semibold">核心工艺流程</h4>
        <ol class="mt-3 space-y-2 text-sm text-[#F5F5DC]/86">
          <li
            v-for="(step, index) in currentItem.craft"
            :key="step"
            class="rounded-lg border border-[#FFB703]/35 bg-black/20 px-3 py-2"
          >
            {{ index + 1 }}. {{ step }}
          </li>
        </ol>
      </article>

      <article class="opera-card p-4 md:p-5">
        <h3 class="text-lg font-semibold tracking-[0.08em]">关联服装</h3>
        <div class="mt-3 space-y-2">
          <RouterLink
            v-for="costume in relatedCostumes"
            :key="costume.id"
            :to="`/costume/${costume.id}`"
            class="block rounded-lg border border-[#FFB703]/45 bg-[#1D3557]/45 px-3 py-2 text-sm transition hover:border-[#FFB703]"
          >
            {{ costume.name }} · {{ costume.type }}
          </RouterLink>
        </div>

        <h4 class="mt-6 text-base font-semibold">灵感图册</h4>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <img
            v-for="(img, idx) in currentItem.gallery"
            :key="`${img}-${idx}`"
            :src="img"
            :alt="`${currentItem.name} 图册 ${idx + 1}`"
            class="h-32 w-full rounded-lg border border-[#FFB703]/45 object-cover"
          />
        </div>
      </article>
    </div>

    <article class="opera-card p-4 md:p-5">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="text-lg font-semibold tracking-[0.08em]">同类推荐</h3>
        <RouterLink to="/culture" class="opera-btn px-3 py-1.5 text-xs">返回文化库</RouterLink>
      </div>

      <div class="recommend-grid">
        <RouterLink
          v-for="item in relatedItems"
          :key="item.id"
          :to="`/culture/${item.id}`"
          class="rounded-xl border border-[#FFB703]/45 bg-[#1D3557]/35 p-3 transition hover:border-[#FFB703]"
        >
          <img :src="item.cover" :alt="item.name" class="h-28 w-full rounded-md object-cover" />
          <p class="mt-2 text-sm">{{ item.name }}</p>
        </RouterLink>
      </div>
    </article>
  </section>

  <section v-else class="opera-card p-6 text-center">
    <h2 class="text-xl">未找到该非遗条目</h2>
    <RouterLink to="/culture" class="opera-btn mt-4 inline-block px-4 py-2 text-sm">返回文化库</RouterLink>
  </section>
</template>

<style scoped>
.detail-head {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
}

.detail-cover {
  width: 100%;
  height: 240px;
  border-radius: 10px;
  border: 1px solid rgba(255, 183, 3, 0.55);
  object-fit: cover;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 960px) {
  .detail-head,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-cover {
    height: 220px;
  }
}

@media (max-width: 620px) {
  .recommend-grid {
    grid-template-columns: 1fr;
  }
}
</style>

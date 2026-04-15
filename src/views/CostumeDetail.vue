<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { costumeItems } from '../data/costumeData'
import { cultureItems } from '../data/cultureData'

const route = useRoute()

const costume = computed(() =>
  costumeItems.find((item) => item.id === String(route.params.id)),
)

const relatedCulture = computed(() => {
  if (!costume.value) {
    return []
  }

  return cultureItems.filter((item) => costume.value.relatedCultureIds.includes(item.id))
})

const siblingCostumes = computed(() => {
  if (!costume.value) {
    return []
  }

  return costumeItems
    .filter((item) => item.type === costume.value.type && item.id !== costume.value.id)
    .slice(0, 3)
})
</script>

<template>
  <section v-if="costume" class="space-y-4">
    <article class="opera-card p-4 md:p-6">
      <div class="head-grid">
        <img :src="costume.cover" :alt="costume.name" class="head-cover" />
        <div>
          <p class="text-sm text-[#F5F5DC]/80">{{ costume.dynasty }} · {{ costume.type }}</p>
          <h2 class="mt-1 text-2xl font-semibold tracking-[0.08em]">{{ costume.name }}</h2>
          <p class="mt-3 text-sm leading-7 text-[#F5F5DC]/88">{{ costume.intro }}</p>

          <div class="mt-4 flex flex-wrap gap-2 text-xs">
            <span class="rounded-full border border-[#FFB703]/55 px-3 py-1">轮廓：{{ costume.silhouette }}</span>
            <span class="rounded-full border border-[#FFB703]/55 px-3 py-1">材质：{{ costume.materials.join(' / ') }}</span>
          </div>
        </div>
      </div>
    </article>

    <div class="detail-grid">
      <article class="opera-card p-4 md:p-5">
        <h3 class="text-lg font-semibold tracking-[0.08em]">色彩建议</h3>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="color in costume.palette"
            :key="color"
            class="rounded-full border border-[#FFB703]/55 bg-black/20 px-3 py-1 text-sm"
          >
            {{ color }}
          </span>
        </div>

        <h4 class="mt-6 text-base font-semibold">适配非遗元素</h4>
        <div class="mt-3 space-y-2">
          <RouterLink
            v-for="item in relatedCulture"
            :key="item.id"
            :to="`/culture/${item.id}`"
            class="block rounded-lg border border-[#FFB703]/45 bg-[#1D3557]/35 px-3 py-2 text-sm hover:border-[#FFB703]"
          >
            {{ item.name }} · {{ item.category }}
          </RouterLink>
        </div>
      </article>

      <article class="opera-card p-4 md:p-5">
        <h3 class="text-lg font-semibold tracking-[0.08em]">同类形制推荐</h3>
        <div class="mt-3 space-y-2">
          <RouterLink
            v-for="item in siblingCostumes"
            :key="item.id"
            :to="`/costume/${item.id}`"
            class="block rounded-lg border border-[#FFB703]/45 bg-black/20 px-3 py-2 text-sm hover:border-[#FFB703]"
          >
            {{ item.name }}
          </RouterLink>
        </div>

        <RouterLink to="/costume" class="opera-btn mt-6 inline-block px-4 py-2 text-sm">
          返回服装形制库
        </RouterLink>
      </article>
    </div>
  </section>

  <section v-else class="opera-card p-6 text-center">
    <h2 class="text-xl">未找到该服装条目</h2>
    <RouterLink to="/costume" class="opera-btn mt-4 inline-block px-4 py-2 text-sm">返回服装形制库</RouterLink>
  </section>
</template>

<style scoped>
.head-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
}

.head-cover {
  width: 100%;
  height: 250px;
  border-radius: 10px;
  border: 1px solid rgba(255, 183, 3, 0.52);
  object-fit: cover;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 960px) {
  .head-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .head-cover {
    height: 220px;
  }
}
</style>

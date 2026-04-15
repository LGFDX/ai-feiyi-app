<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()

const navItems = [
  { label: '妆面细节', path: '/' },
  { label: '非遗文化库', path: '/culture' },
  { label: '服装形制', path: '/costume' },
]

const activePath = computed(() => route.path)

function isItemActive(path) {
  if (path === '/') {
    return activePath.value === '/'
  }

  return activePath.value === path || activePath.value.startsWith(`${path}/`)
}
</script>

<template>
  <header class="site-nav-wrap">
    <div class="site-nav-inner">
      <p class="site-nav-meta">中国 · 非遗 · Intangible Cultural Heritage</p>
      <h1 class="site-nav-title">【细钗礼衣】 【绢花】 妆容</h1>
      <nav class="site-nav-tabs" aria-label="全局导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="opera-tab"
          :class="{ 'opera-tab-active': isItemActive(item.path) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-nav-wrap {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 2px solid rgba(255, 183, 3, 0.7);
  backdrop-filter: blur(10px);
  background:
    linear-gradient(90deg, rgba(24, 36, 66, 0.94), rgba(154, 34, 50, 0.9), rgba(24, 36, 66, 0.94));
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.42);
}

.site-nav-inner {
  margin: 0 auto;
  width: min(1240px, 96vw);
  padding: 8px 0 12px;
  text-align: center;
}

.site-nav-meta {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  color: rgba(255, 235, 176, 0.95);
}

.site-nav-title {
  margin: 6px 0 10px;
  color: #ffe5aa;
  font-size: clamp(1.55rem, 3.2vw, 2.8rem);
  letter-spacing: 0.08em;
  text-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

.site-nav-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.site-nav-tabs :deep(.opera-tab) {
  padding: 0.42rem 1.04rem;
  font-size: 0.85rem;
  line-height: 1;
}

@media (max-width: 760px) {
  .site-nav-wrap {
    position: relative;
  }

  .site-nav-inner {
    padding-left: 10px;
    padding-right: 10px;
  }

  .site-nav-title {
    letter-spacing: 0.04em;
    font-size: clamp(1.28rem, 6vw, 1.7rem);
  }

  .site-nav-tabs {
    gap: 8px;
  }
}
</style>

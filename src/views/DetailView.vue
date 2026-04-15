<template>
  <section class="rounded-2xl border border-shiqing/15 bg-white/80 p-8 shadow-sm backdrop-blur">
    <p class="text-sm uppercase tracking-[0.2em] text-shiqing/70">Heritage Detail</p>
    <h1 class="mt-3 text-3xl font-semibold text-shiqing">非遗详情页</h1>
    <p class="mt-4 text-base leading-8 text-mohei/75">
      当前查看条目 ID：
      <span class="rounded bg-zhusha/10 px-2 py-1 font-medium text-zhusha">{{ id }}</span>
    </p>
    <RouterLink
      to="/culture"
      class="mt-8 inline-flex rounded-full border border-shiqing/30 px-5 py-2.5 text-sm font-medium text-shiqing transition hover:border-shiqing"
    >
      返回文化库
    </RouterLink>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  id: {
    type: String,
    required: true,
  },
})
</script>

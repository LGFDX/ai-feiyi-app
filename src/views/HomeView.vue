<template>
  <section class="rounded-2xl border border-shiqing/15 bg-white/80 p-8 shadow-sm backdrop-blur">
    <p class="text-sm uppercase tracking-[0.3em] text-shiqing/70">Intangible Heritage</p>
    <h1 class="mt-3 text-4xl font-semibold text-shiqing">非遗妆造智能生成</h1>
    <p class="mt-4 max-w-2xl text-base leading-8 text-mohei/75">
      以数字化方式连接传统工艺与当代审美，探索纹样、妆容、服饰色彩在智能生成中的重构表达。
    </p>
    <div class="mt-8 flex flex-wrap gap-3">
      <RouterLink
        to="/culture"
        class="rounded-full bg-zhusha px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zhusha/90"
      >
        进入文化库
      </RouterLink>
      <RouterLink
        to="/detail/1"
        class="rounded-full border border-shiqing/30 px-5 py-2.5 text-sm font-medium text-shiqing transition hover:border-shiqing"
      >
        查看示例详情
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

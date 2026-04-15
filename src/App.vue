<script setup>
import GlobalNav from './components/GlobalNav.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="relative min-h-screen text-[#F5F5DC]">
    <GlobalNav />
    <main class="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-6 md:px-6">
      <RouterView />
    </main>
  </div>
</template>

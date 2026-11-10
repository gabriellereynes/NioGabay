<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template><div class="error-notice" role="alert">{{ message }}</div></template>

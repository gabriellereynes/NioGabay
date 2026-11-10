<script setup lang="ts">
import type { AnnouncementCategory } from '~~/shared/types/api'
definePageMeta({ layout: 'system-admin', middleware: 'admin', allowedRoles: ['admin'] })
const backend = useBackend()
const announcements = ref(await backend.getAnnouncements())
const form = reactive<{ title: string; body: string; category: AnnouncementCategory }>({ title: '', body: '', category: 'general' })
const errorMessage = ref('')
const submit = async () => {
  try {
    await backend.createDraft(form)
    announcements.value = await backend.getAnnouncements()
    form.title = ''
    form.body = ''
    form.category = 'general'
    errorMessage.value = ''
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage ?? error?.statusMessage ?? 'Unable to save draft.'
  }
}
</script>
<template><section class="page-content"><div class="draft-note">Draft workspace: staff may prepare announcements here. Publishing is intentionally not available in this first dashboard slice.</div><ErrorNotice v-if="errorMessage" :message="errorMessage" /><div class="two-column"><article class="panel form-panel"><span class="eyebrow">NEW DRAFT</span><h2>Prepare an announcement</h2><form @submit.prevent="submit"><label>Title<input v-model="form.title" required maxlength="150" /></label><label>Category<select v-model="form.category"><option value="flood">Flood</option><option value="evacuation">Evacuation</option><option value="advisory">Advisory</option><option value="general">General</option></select></label><label>Message<textarea v-model="form.body" required maxlength="5000" rows="8" /></label><button class="button primary-button">Save draft</button></form></article><article class="panel"><span class="eyebrow">DRAFTS</span><h2>Announcements awaiting review</h2><div class="report-list"><div v-for="item in announcements.items" :key="item.id" class="report-item"><div class="item-between"><strong>{{ item.title }}</strong><span class="tag">{{ item.category }}</span></div><p>{{ item.body }}</p><small>Updated {{ new Date(item.updated_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) }}</small></div></div></article></div></section></template>

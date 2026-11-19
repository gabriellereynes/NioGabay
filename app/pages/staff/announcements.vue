<script setup lang="ts">
import Swal from 'sweetalert2'
import type {
  Announcement,
  AnnouncementInput,
  AnnouncementPatch
} from '~~/shared/types/api'

definePageMeta({ layout: 'staff', middleware: 'staff', allowedRoles: ['staff', 'admin'] })

const {
  items,
  total,
  limit,
  offset,
  page,
  totalPages,
  pending,
  busy,
  errorMessage,
  statusCode,
  previousPage,
  nextPage,
  create,
  update,
  remove,
  formatManila
} = useAnnouncementsAdmin()

const form = reactive<Pick<AnnouncementInput, 'title' | 'body' | 'category'>>({
  title: '',
  body: '',
  category: 'general'
})
const mutationError = ref('')

const requestErrorMessage = (error: unknown, fallback: string) => {
  const typedError = error as {
    data?: { statusMessage?: string }
    statusMessage?: string
    message?: string
  }
  return typedError.data?.statusMessage
    ?? typedError.statusMessage
    ?? typedError.message
    ?? fallback
}

const submit = async (publish: boolean) => {
  mutationError.value = ''
  if (!form.title.trim() || form.title.length > 150) {
    mutationError.value = 'title must be 1 to 150 characters'
    return
  }
  if (!form.body.trim() || form.body.length > 5000) {
    mutationError.value = 'body must be 1 to 5000 characters'
    return
  }

  try {
    await create({
      title: form.title,
      body: form.body,
      category: form.category,
      publish
    })
    Object.assign(form, { title: '', body: '', category: 'general' })
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to save the announcement.')
  }
}

const escapeHtml = (value: string | number | null | undefined) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const editAnnouncement = async (announcement: Announcement) => {
  mutationError.value = ''
  const published = announcement.published_at !== null
  const result = await Swal.fire({
    title: 'Edit announcement',
    html: `
      <div class="swal-form">
        <label>Title
          <input id="announcement-title" class="swal2-input" maxlength="150" value="${escapeHtml(announcement.title)}">
        </label>
        <div class="field-counter" id="announcement-title-counter">${announcement.title.length} / 150</div>
        <label>Category
          <select id="announcement-category" class="swal2-input">
            <option value="flood" ${announcement.category === 'flood' ? 'selected' : ''}>Flood</option>
            <option value="evacuation" ${announcement.category === 'evacuation' ? 'selected' : ''}>Evacuation</option>
            <option value="advisory" ${announcement.category === 'advisory' ? 'selected' : ''}>Advisory</option>
            <option value="general" ${announcement.category === 'general' ? 'selected' : ''}>General</option>
          </select>
        </label>
        <label>Message
          <textarea id="announcement-body" class="swal2-textarea" maxlength="5000" rows="8">${escapeHtml(announcement.body)}</textarea>
        </label>
        <div class="field-counter" id="announcement-body-counter">${announcement.body.length} / 5000</div>
        <label class="publish-field">
          <input id="announcement-publish" type="checkbox" ${published ? 'checked' : ''}>
          Publish this announcement
        </label>
      </div>
    `,
    didOpen: () => {
      const titleInput = document.getElementById('announcement-title') as HTMLInputElement
      const bodyInput = document.getElementById('announcement-body') as HTMLTextAreaElement
      titleInput.addEventListener('input', () => {
        const counter = document.getElementById('announcement-title-counter')
        if (counter) counter.textContent = `${titleInput.value.length} / 150`
      })
      bodyInput.addEventListener('input', () => {
        const counter = document.getElementById('announcement-body-counter')
        if (counter) counter.textContent = `${bodyInput.value.length} / 5000`
      })
    },
    showCancelButton: true,
    confirmButtonText: 'Save changes',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#087f82',
    cancelButtonColor: '#6f7d83',
    preConfirm: () => {
      const title = (document.getElementById('announcement-title') as HTMLInputElement).value.trim()
      const body = (document.getElementById('announcement-body') as HTMLTextAreaElement).value.trim()
      const category = (document.getElementById('announcement-category') as HTMLSelectElement).value
      const publish = (document.getElementById('announcement-publish') as HTMLInputElement).checked
      if (!title || title.length > 150) {
        Swal.showValidationMessage('title must be 1 to 150 characters')
        return false
      }
      if (!body || body.length > 5000) {
        Swal.showValidationMessage('body must be 1 to 5000 characters')
        return false
      }
      return { title, body, category, publish }
    }
  })

  if (!result.isConfirmed || !result.value) return

  const values = result.value as { title: string; body: string; category: Announcement['category']; publish: boolean }
  const patch: AnnouncementPatch = {}
  if (values.title !== announcement.title) patch.title = values.title
  if (values.body !== announcement.body) patch.body = values.body
  if (values.category !== announcement.category) patch.category = values.category
  if (values.publish !== published) patch.publish = values.publish
  if (Object.keys(patch).length === 0) return

  try {
    await update(announcement.id, patch)
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to update the announcement.')
  }
}

const deleteAnnouncement = async (announcement: Announcement) => {
  mutationError.value = ''
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `Delete "${announcement.title}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6f7d83'
  })
  if (!result.isConfirmed) return

  try {
    await remove(announcement.id)
  } catch (error) {
    mutationError.value = requestErrorMessage(error, 'Unable to delete the announcement.')
  }
}
</script>

<template>
  <section class="page-content">
    <ErrorNotice v-if="mutationError" :message="mutationError" />
    <ErrorNotice v-else-if="statusCode === 403" message="You don't have access to announcements." />

    <div class="two-column">
      <article class="panel form-panel">
        <span class="eyebrow">NEW ANNOUNCEMENT</span>
        <h2>Create an announcement</h2>
        <form @submit.prevent="submit(false)">
          <label>
            Title
            <input v-model="form.title" required maxlength="150" />
          </label>
          <div class="field-counter">{{ form.title.length }} / 150</div>

          <label>
            Category
            <select v-model="form.category">
              <option value="flood">Flood</option>
              <option value="evacuation">Evacuation</option>
              <option value="advisory">Advisory</option>
              <option value="general">General</option>
            </select>
          </label>

          <label>
            Message
            <textarea v-model="form.body" required maxlength="5000" rows="8" />
          </label>
          <div class="field-counter">{{ form.body.length }} / 5000</div>

            <div class="announcement-submit-actions">
              <button class="button secondary" type="submit" :disabled="busy">
                {{ busy ? 'Saving...' : 'Save draft' }}
              </button>
              <button class="button primary-button" type="button" :disabled="busy" @click="submit(true)">
                {{ busy ? 'Publishing...' : 'Publish now' }}
              </button>
            </div>
        </form>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">ANNOUNCEMENTS</span>
            <h2>Drafts and published posts</h2>
          </div>
        </div>

        <ErrorNotice v-if="errorMessage" :message="errorMessage" />

        <div v-else-if="pending" class="alert-state">Loading announcements...</div>

        <div v-else-if="items.length === 0" class="alert-state">No announcements yet</div>

        <div v-else class="report-list">
          <div v-for="item in items" :key="item.id" class="report-item">
            <div class="item-between">
              <strong>{{ item.title }}</strong>
              <span class="tag">{{ item.category }}</span>
            </div>
            <p>{{ item.body }}</p>
            <div class="item-between">
              <div>
                <small>
                  <span class="tag announcement-status" :class="{ draft: item.published_at === null }">
                    {{ item.published_at ? 'Published' : 'Draft' }}
                  </span>
                </small>
                <small>Created by {{ item.created_by_name || 'Unknown' }}</small>
                <small>Created {{ formatManila(item.created_at) || 'Date unavailable' }}</small>
                <small>Updated {{ formatManila(item.updated_at) || 'Date unavailable' }}</small>
                <small v-if="item.published_at">Published {{ formatManila(item.published_at) }}</small>
              </div>
              <div class="announcement-actions">
                <button class="button secondary" type="button" :disabled="busy" @click="editAnnouncement(item)">Edit</button>
                <button class="button" type="button" :disabled="busy" style="background:#fee2e2;color:#b91c1c" @click="deleteAnnouncement(item)">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="items.length > 0" class="alert-pagination">
          <span>{{ total }} total · Page {{ page }} of {{ totalPages }}</span>
          <div>
            <button class="button secondary" type="button" :disabled="offset === 0 || pending" @click="previousPage">Previous</button>
            <button class="button secondary" type="button" :disabled="offset + limit >= total || pending" @click="nextPage">Next</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

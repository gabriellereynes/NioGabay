
<script setup>
useHead({
    title: '404 | Page Not Found'
})

defineProps({
    error: Object
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
    <div class="min-h-screen relative flex flex-col items-center justify-center text-center">
        <div class="relative z-10 flex flex-col items-center">

            <p class="text-[12rem] font-bold text-blue-900">
                404
            </p>

            <p class="mt-3 text-3xl font-bold text-blue-900">
                No Flood Information Here T - T
            </p>

            <!--404 LOGO-->
            <NuxtLink to="/" @click="handleError" class="mt-6">
                <img
                    src="/images/404-logo.png"
                    alt="Back to Home"
                    class="h-20 w-20 object-contain"
                />
            </NuxtLink>

            <!--BACK TO HOME BUTTON-->
            <button
                @click="handleError"
                class="mt-6 rounded-full border-2 border-blue-700 px-6 py-2 text-blue-700 hover:bg-blue-800 hover:text-white transition duration-300"
            >
                Go Back Home
            </button>

        </div>
    </div>
</template>

<template>
  <div class="login-container">
    <form @submit.prevent="handleSubmit" class="login-form">
      <h2>Login</h2>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          id="email"
          v-model="form.email"
          type="email"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input 
          id="password"
          v-model="form.password"
          type="password"
          required
        />
      </div>

      <div class="error" v-if="error">{{ error }}</div>

      <button type="submit">Login</button>

      <p class="register-link">
        Don't have an account? 
        <router-link to="/register">Register</router-link>
      </p>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'Login',
  setup() {
    const auth = useAuthStore()
    const router = useRouter()
    const form = ref({
      email: '',
      password: ''
    })
    const error = ref(null)

    const handleSubmit = async () => {
      try {
        error.value = null
        await auth.login(form.value)
        router.push('/dashboard')
      } catch (err) {
        error.value = err.response?.data?.error || 'Login failed'
      }
    }

    return {
      form,
      error,
      handleSubmit
    }
  }
}
</script>

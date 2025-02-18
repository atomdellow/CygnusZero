<template>
  <div class="register-container">
    <form @submit.prevent="handleSubmit" class="register-form">
      <h2>Register</h2>
      
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

      <button type="submit">Register</button>
      
      <p class="login-link">
        Already have an account? 
        <router-link to="/login">Login</router-link>
      </p>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'Register',
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
        await auth.register(form.value)
        router.push('/dashboard')
      } catch (err) {
        error.value = err.response?.data?.error || 'Registration failed'
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

<template>
  <div id="app">
    <nav v-if="auth.isAuthenticated">
      <router-link to="/dashboard">Dashboard</router-link> |
      <router-link to="/sources">Sources</router-link> |
      <router-link to="/content-types">Content Types</router-link> |
      <router-link to="/analytics">Analytics</router-link> |
      <a href="#" @click.prevent="logout">Logout</a>
    </nav>
    <router-view></router-view>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const auth = useAuthStore()
    const router = useRouter()

    const logout = () => {
      auth.logout()
      router.push('/login')
    }

    return {
      auth,
      logout
    }
  }
}
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}

nav {
  padding: 1rem;
  background: #f8f9fa;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
}

nav a.router-link-exact-active {
  color: #42b983;
}

nav a:hover {
  color: #42b983;
}
</style>

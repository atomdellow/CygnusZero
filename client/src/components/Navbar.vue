<template>
  <nav class="navbar">
    <div class="brand">CygnasZero</div>
    <div class="nav-links">
      <router-link to="/dashboard">Dashboard</router-link>
      <router-link to="/sources">Sources</router-link>
      <router-link to="/content-types">Content Types</router-link>
      <router-link to="/analytics">Analytics</router-link>
      <a href="#" @click.prevent="logout">Logout</a>
    </div>
  </nav>
</template>

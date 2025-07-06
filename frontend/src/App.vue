<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div class="app">
    <!-- Sidebar -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <h2 class="logo">🚀 AI Coin Sniffer</h2>
      </div>
      
      <ul class="nav-menu">
        <li>
          <router-link to="/" class="nav-link">
            <span class="nav-icon">📊</span>
            Dashboard
          </router-link>
        </li>
        <li>
          <router-link to="/history" class="nav-link">
            <span class="nav-icon">📈</span>
            Historie
          </router-link>
        </li>
        <li>
          <router-link to="/settings" class="nav-link">
            <span class="nav-icon">⚙️</span>
            Instellingen
          </router-link>
        </li>
      </ul>
      </nav>

    <!-- Main content -->
    <div class="main-content">
      <!-- Top bar -->
      <header class="topbar">
        <div class="search-container">
          <input 
            type="text" 
            placeholder="Zoek coins of wallets..." 
            class="search-input"
          />
        </div>
        <div class="user-menu">
          <span class="user-avatar">👤</span>
    </div>
  </header>

      <!-- Page content -->
      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #0a0a0a;
  color: #ffffff;
  overflow-x: hidden;
}

.app {
  display: flex;
  height: 100vh;
  background-color: #0a0a0a;
}

/* Sidebar Styles */
.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
  border-right: 1px solid #2a2a2a;
  padding: 20px 0;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  overflow-y: auto;
}

.sidebar-header {
  padding: 0 20px 30px;
  border-bottom: 1px solid #2a2a2a;
  margin-bottom: 30px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: #00ff88;
  text-align: center;
}

.nav-menu {
  list-style: none;
  padding: 0 10px;
}

.nav-menu li {
  margin-bottom: 5px;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: #888;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  background-color: #1a1a1a;
  color: #00ff88;
}

.nav-link.router-link-active {
  background-color: #00ff88;
  color: #000;
}

.nav-icon {
  margin-right: 10px;
  font-size: 16px;
}

/* Main Content */
.main-content {
  margin-left: 250px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Topbar */
.topbar {
  height: 70px;
  background-color: #0f0f0f;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  background-color: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  border-color: #00ff88;
}

.search-input::placeholder {
  color: #666;
}

.user-menu {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 35px;
  height: 35px;
  background-color: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.user-avatar:hover {
  background-color: #2a2a2a;
}

/* Page Content */
.page-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background-color: #0a0a0a;
}

/* Utility Classes */
.card {
  background-color: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.card:hover {
  border-color: #00ff88;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.1);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background-color: #00ff88;
  color: #000;
}

.btn-primary:hover {
  background-color: #00cc6a;
}

.btn-secondary {
  background-color: #2a2a2a;
  color: #fff;
}

.btn-secondary:hover {
  background-color: #3a3a3a;
}

.text-success {
  color: #00ff88;
}

.text-danger {
  color: #ff4757;
}

.text-warning {
  color: #ffa502;
  }

.text-muted {
  color: #666;
  }

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .main-content {
    margin-left: 0;
  }
  
  .topbar {
    padding: 0 15px;
  }
  
  .page-content {
    padding: 15px;
  }
}
</style>

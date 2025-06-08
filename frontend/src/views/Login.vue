<template>
  <div class="login-container">
    <div class="login-hero">
      <h1 class="hero-title">管理员控制台</h1>
      <p class="hero-subtitle">欢迎回来，请登录继续访问</p>
    </div>
    
    <div class="login-card">
      <div class="card-header">
        <h3>管理员登录</h3>
      </div>
      
      <div class="card-body">
        <div v-if="error" class="error-message">
          <i class="bi bi-exclamation-triangle-fill"></i>
          {{ error }}
        </div>
        
        <form @submit.prevent="login">
          <div class="form-group">
            <label for="username" class="form-label">用户名</label>
            <div class="input-group">
              <div class="input-prefix">
                <i class="bi bi-person-fill"></i>
              </div>
              <input 
                type="text" 
                class="custom-input" 
                id="username" 
                v-model="username" 
                required
                placeholder="请输入用户名"
                autocomplete="username"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <div class="input-group">
              <div class="input-prefix">
                <i class="bi bi-key-fill"></i>
              </div>
              <input 
                type="password" 
                class="custom-input" 
                id="password" 
                v-model="password" 
                required
                placeholder="请输入密码"
                autocomplete="current-password"
              >
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn-custom btn-primary login-btn" 
              :disabled="loading"
            >
              <div v-if="loading" class="spinner"></div>
              <span>{{ loading ? '登录中...' : '登录' }}</span>
            </button>
          </div>
        </form>
        
        <div class="login-info">
          <p>首次登录请使用</p>
          <div class="credentials">
            <div class="credential-item">
              <span class="credential-label">用户名:</span>
              <code>admin</code>
            </div>
            <div class="credential-item">
              <span class="credential-label">密码:</span>
              <code>admin123</code>
            </div>
          </div>
          <p class="info-note">首次登录后请立即修改密码</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

const login = async () => {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    // 使用FormData格式提交，因为这是OAuth2要求的格式
    const formData = new FormData()
    formData.append('username', username.value)
    formData.append('password', password.value)
    
    const response = await axios.post('/api/auth/token', formData)
    
    // 保存令牌到本地存储
    localStorage.setItem('accessToken', response.data.access_token)
    localStorage.setItem('tokenType', response.data.token_type)
    
    // 获取用户信息
    await checkUserInfo()
    
    // 发送登录成功事件，通知App.vue更新状态
    window.dispatchEvent(new Event('login-success'))
    
    // 登录成功后跳转
    router.push('/admin')
  } catch (err) {
    console.error('登录失败:', err)
    if (err.response && err.response.status === 401) {
      error.value = '用户名或密码不正确'
    } else {
      error.value = '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

const checkUserInfo = async () => {
  try {
    // 配置请求头携带令牌
    const token = localStorage.getItem('accessToken')
    const tokenType = localStorage.getItem('tokenType')
    
    if (!token) return
    
    const config = {
      headers: {
        'Authorization': `${tokenType} ${token}`
      }
    }
    
    // 获取当前用户信息
    const response = await axios.get('/api/auth/me', config)
    localStorage.setItem('user', JSON.stringify(response.data))
  } catch (err) {
    console.error('获取用户信息失败:', err)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('tokenType')
    localStorage.removeItem('user')
  }
}
</script>

<style scoped src="@/styles/Login.css"></style>
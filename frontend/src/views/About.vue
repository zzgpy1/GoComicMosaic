<template>
  <div class="about-container">
    <div class="about-header">
      <h1 class="about-title">关于我们</h1>
      <div class="about-subtitle">连接资源，共建精彩</div>
    </div>
    
    <div class="about-content">
      <div class="about-section">
        <div class="section-icon">
          <i :class="`bi bi-${aboutConfig.siteIntro.icon || 'collection-fill'}`"></i>
        </div>
        <h2 class="section-title">{{ aboutConfig.siteIntro.title || '本站介绍' }}</h2>
        <p class="section-text" v-html="aboutConfig.siteIntro.description || '欢迎来到美漫资源共建平台，我们致力于为美漫爱好者提供一个便捷、高效、安全的资源分享平台。'"></p>
        
        <div class="feature-grid">
          <div class="feature-item" v-for="item in aboutConfig.featureItems" :key="item.id">
            <div class="feature-icon">
              <i :class="`bi bi-${item.icon || 'check-circle'}`"></i>
            </div>
            <h3>{{ item.title }}</h3>
            <p v-html="item.description"></p>
          </div>
        </div>
      </div>
      
      <!-- 免责声明模块 -->
      <div class="disclaimer-section" v-if="aboutConfig.disclaimer && aboutConfig.disclaimer.enabled">
        <div class="section-icon">
          <i :class="`bi bi-${aboutConfig.disclaimer.icon || 'shield-exclamation'}`"></i>
        </div>
        <h2 class="section-title">{{ aboutConfig.disclaimer.title || '免责声明' }}</h2>
        <div class="disclaimer-content" v-html="aboutConfig.disclaimer.content || ''"></div>
      </div>
      
      <div class="contact-section">
        <div class="contact-container">
          <div class="contact-left">
            <h2 class="section-title">{{ aboutConfig.contactSection.title || '联系我们' }}</h2>
            <p class="section-text" v-html="aboutConfig.contactSection.description || '如有任何问题、建议或合作意向，欢迎通过以下方式联系我们。我们非常重视每一位用户的反馈。'"></p>
            <div class="contact-methods">
              <div class="contact-item" v-for="item in aboutConfig.contactItems" :key="item.id">
                <i :class="`bi bi-${item.icon || 'envelope'}`"></i>
                <span>{{ item.text }}</span>
              </div>
            </div>
          </div>
          <div class="contact-right">
            <div class="decoration-circles">
              <div class="circle circle-1"></div>
              <div class="circle circle-2"></div>
              <div class="circle circle-3"></div>
            </div>
            <div class="contact-icon">
              <i :class="`bi bi-${aboutConfig.contactSection.icon || 'chat-text-fill'}`"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import infoManager from '../utils/InfoManager';

export default {
  name: 'AboutPage',
  data() {
    return {
      aboutConfig: {
        siteIntro: {
          title: '',
          description: '',
          icon: ''
        },
        featureItems: [],
        disclaimer: {
          enabled: true,
          title: '免责声明',
          content: '',
          icon: 'shield-exclamation'
        },
        contactSection: {
          title: '',
          description: '',
          icon: ''
        },
        contactItems: []
      },
      loading: true
    };
  },
  async mounted() {
    try {
      // 加载About页面配置
      const config = await infoManager.getAboutPageConfig();
      this.aboutConfig = config;
    } catch (error) {
      console.error('加载About页面配置失败:', error);
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped src="@/styles/About.css"></style>
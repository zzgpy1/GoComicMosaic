<template>
  <div class="admin-container">
    <div class="admin-hero">
      <h1 class="hero-title">管理控制台</h1>
      <p class="hero-subtitle">管理资源、审批内容、维护系统</p>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>正在加载数据，请稍候...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <i class="bi bi-exclamation-triangle-fill"></i>
      {{ error }}
    </div>
    
    <div v-else class="admin-content">
      <!-- 修改密码卡片 -->
      <div class="admin-card">
        <div class="card-header">
          <h4><i class="bi bi-shield-lock"></i> 修改密码</h4>
          <button 
            type="button" 
            class="btn-custom btn-outline toggle-btn" 
            @click="showChangePassword = !showChangePassword"
          >
            <i :class="showChangePassword ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
            <span class="btn-text">{{ showChangePassword ? '收起' : '展开' }}</span>
          </button>
        </div>
        <div class="card-body" v-if="showChangePassword">
          <div v-if="passwordSuccess" class="success-message">
            <i class="bi bi-check-circle-fill"></i>
            密码修改成功
          </div>
          <div v-if="passwordError" class="error-message">
            <i class="bi bi-exclamation-triangle-fill"></i>
            {{ passwordError }}
          </div>
          
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label for="currentPassword" class="form-label">当前密码</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-key-fill"></i>
                </div>
              <input 
                type="password" 
                  class="custom-input" 
                id="currentPassword" 
                v-model="passwordForm.currentPassword" 
                required
                  placeholder="请输入当前密码"
              >
              </div>
            </div>
            
            <div class="form-group">
              <label for="newPassword" class="form-label">新密码</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-lock-fill"></i>
                </div>
              <input 
                type="password" 
                  class="custom-input" 
                id="newPassword" 
                v-model="passwordForm.newPassword" 
                required
                  placeholder="请输入新密码"
              >
              </div>
            </div>
            
            <div class="form-group">
              <label for="confirmPassword" class="form-label">确认新密码</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-lock-fill"></i>
                </div>
              <input 
                type="password" 
                  class="custom-input" 
                id="confirmPassword" 
                v-model="passwordForm.confirmPassword" 
                required
                  placeholder="请再次输入新密码"
              >
              </div>
            </div>
            
            <div class="form-actions">
              <button 
                type="submit" 
                class="btn-custom btn-primary" 
                :disabled="passwordLoading"
              >
                <div v-if="passwordLoading" class="spinner"></div>
                <i class="bi bi-key"></i>
                <span class="btn-text">{{ passwordLoading ? '提交中...' : '修改密码' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- 网站设置卡片 -->
      <div class="admin-card">
        <div class="card-header">
          <h4><i class="bi bi-gear-fill"></i> 网站设置</h4>
          <button 
            type="button" 
            class="btn-custom btn-outline toggle-btn" 
            @click="showSiteSettings = !showSiteSettings"
          >
            <i :class="showSiteSettings ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
            <span class="btn-text">{{ showSiteSettings ? '收起' : '展开' }}</span>
          </button>
        </div>
        <div class="card-body" v-if="showSiteSettings">
          <div v-if="settingsSuccess" class="success-message">
            <i class="bi bi-check-circle-fill"></i>
            网站设置更新成功
          </div>
          <div v-if="settingsError" class="error-message">
            <i class="bi bi-exclamation-triangle-fill"></i>
            {{ settingsError }}
          </div>
          
          <!-- 基本信息设置部分 -->
          <div class="settings-section">
            <h5 class="section-title">基本信息设置</h5>
            
            <!-- 网站图标 (favicon) -->
            <div class="form-group">
              <label class="form-label">网站图标 (favicon)</label>
              <div class="favicon-uploader">
                <!-- 文件输入框（隐藏） -->
                <input 
                  type="file" 
                  id="faviconUpload" 
                  ref="faviconUploadRef" 
                  class="hidden-upload" 
                  accept="image/x-icon,image/png,image/jpeg,image/svg+xml"
                  @change="handleFaviconUpload"
                />
                
                <!-- 上传区域 -->
                <div 
                  class="favicon-upload-area"
                  :class="{'has-preview': siteFaviconPreview || (footerSettings.favicon && !siteFaviconFile)}"
                  @click="triggerFileInput"
                >
                  <!-- 预览图片 -->
                  <img 
                    v-if="siteFaviconPreview || (footerSettings.favicon && !siteFaviconFile)" 
                    :src="siteFaviconPreview || (footerSettings.favicon ? `${footerSettings.favicon}?t=${Date.now()}` : '')" 
                    alt="网站图标预览"
                    class="favicon-preview-img"
                  />
                  
                  <!-- 空状态提示 -->
                  <div v-else class="favicon-empty-state">
                    <i class="bi bi-upload"></i>
                    <span>点击上传图标</span>
                  </div>
                  
                  <!-- 上传按钮 - 中央覆盖层 -->
                  <div class="favicon-actions">
                    <button 
                      type="button" 
                      class="favicon-action-btn upload-btn" 
                      @click.stop="triggerFileInput" 
                      title="上传新图标"
                    >
                      <i class="bi bi-arrow-up-circle"></i>
                    </button>
                  </div>
                  </div>
                
                <div class="form-text">
                  支持.ico、.png、.jpg和.svg格式，推荐尺寸为32x32或64x64像素。上传后的图标路径为：/assets/public/favicon.ico
                </div>
              </div>
            </div>
            
            <!-- 网站标题 -->
            <div class="form-group">
              <label class="form-label">网站标题</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-type-h1"></i>
                </div>
                <input 
                  type="text" 
                  class="custom-input" 
                  v-model="footerSettings.title" 
                  placeholder="网站标题"
                >
              </div>
              <div class="form-text">显示在浏览器标签页和搜索结果中的网站标题</div>
            </div>
            
            <!-- Logo文本 -->
            <div class="form-group">
              <label class="form-label">Logo文本</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-card-heading"></i>
                </div>
                <input 
                  type="text" 
                  class="custom-input" 
                  v-model="footerSettings.logoText" 
                  placeholder="左上角Logo旁的文本"
                >
              </div>
              <div class="form-text">网站左上角Logo旁边显示的文本</div>
            </div>
            
            <!-- 网站描述 -->
            <div class="form-group">
              <label class="form-label">网站描述</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-file-text"></i>
                </div>
                <textarea 
                  class="custom-input" 
                  v-model="footerSettings.description" 
                  placeholder="网站描述"
                  rows="3"
                ></textarea>
              </div>
              <div class="form-text">用于SEO的网站描述，显示在搜索引擎结果中</div>
            </div>
            
            <!-- 关键词 -->
            <div class="form-group">
              <label class="form-label">关键词</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-tags"></i>
                </div>
                <input 
                  type="text" 
                  class="custom-input" 
                  v-model="footerSettings.keywords" 
                  placeholder="关键词（用逗号分隔）"
                >
              </div>
              <div class="form-text">用于SEO的关键词，使用逗号分隔</div>
            </div>
          </div>
          
          <!-- 路由Meta信息设置 -->
          <div class="settings-section">
            <h5 class="section-title">页面元信息设置</h5>
            <div class="section-description">
              设置各个页面的标题、描述和关键词。这些信息将显示在浏览器标签页和搜索引擎结果中。
              如果不设置，将使用默认值。
            </div>
            
            <!-- 页面选择器 -->
            <div class="form-group">
              <label class="form-label">选择页面</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-file-earmark-text"></i>
                </div>
                <select 
                  class="custom-input" 
                  v-model="selectedPage"
                  @change="selectPage"
                >
                  <option value="home">首页</option>
                  <option value="resource_detail">资源详情页</option>
                  <option value="submit_resource">提交资源页</option>
                  <option value="login">登录页</option>
                  <option value="admin">管理后台页</option>
                  <option value="resource_review">资源审核页</option>
                  <option value="about">关于我们页</option>
                  <option value="streams">流媒体内容页</option>
                </select>
              </div>
            </div>
            
            <!-- 页面标题 -->
            <div class="form-group">
              <label class="form-label">页面标题</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-type-h2"></i>
                </div>
                <input 
                  type="text" 
                  class="custom-input" 
                  v-model="currentPageMeta.title" 
                  :placeholder="getDefaultPageMeta(selectedPage).title"
                >
              </div>
              <div class="form-text">
                在浏览器标签页显示的标题。留空则使用默认值：{{ getDefaultPageMeta(selectedPage).title }}
              </div>
            </div>
            
            <!-- 页面描述 -->
            <div class="form-group">
              <label class="form-label">页面描述</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-card-text"></i>
                </div>
                <textarea 
                  class="custom-input" 
                  v-model="currentPageMeta.description" 
                  :placeholder="getDefaultPageMeta(selectedPage).description"
                  rows="3"
                ></textarea>
              </div>
              <div class="form-text">用于SEO的页面描述</div>
            </div>
            
            <!-- 页面关键词 -->
            <div class="form-group">
              <label class="form-label">页面关键词</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-tag"></i>
                </div>
                <input 
                  type="text" 
                  class="custom-input" 
                  v-model="currentPageMeta.keywords" 
                  :placeholder="getDefaultPageMeta(selectedPage).keywords"
                >
              </div>
              <div class="form-text">用于SEO的页面关键词，使用逗号分隔</div>
            </div>
          </div>
          
          <!-- 页脚设置部分 -->
          <div class="settings-section">
            <h5 class="section-title">页脚设置</h5>
            
            <!-- 显示访问统计 - 移到最上方 -->
            <div class="form-group">
              <label class="form-label">显示访问统计</label>
              <div class="checkbox-wrapper horizontal-display">
                <input id="show_visitor_count" class="custom-checkbox" type="checkbox" v-model="footerSettings.show_visitor_count">
                <label for="show_visitor_count"></label>
                <span class="checkbox-text">在网站底部显示访问人数统计</span>
              </div>
            </div>
            
            <!-- 版权信息 -->
            <div class="form-group">
              <label class="form-label">版权信息</label>
              <div class="input-group">
                <div class="input-prefix">
                  <i class="bi bi-c-circle"></i>
                </div>
                <input 
                  type="text" 
                  class="custom-input" 
                  v-model="footerSettings.copyright" 
                  placeholder="版权信息文本"
                >
              </div>
            </div>
            
            <!-- 页脚链接列表 -->
            <div class="form-group">
              <label class="form-label">页脚链接</label>
              <div class="scroll-container links-wrapper">
                <div class="links-container">
                  <!-- 标签头部，只显示一次 -->
                  <div class="link-header">
                    <div class="drag-handle-placeholder"></div>
                    <div class="link-field-header">显示文本</div>
                    <div class="link-field-header">URL</div>
                    <div class="link-field-header">图标</div>
                    <div class="link-field-header">提示文本</div>
                    <div class="link-field-header actions-header"></div>
                  </div>
                  
                  <!-- 链接列表，支持拖拽排序 -->
                  <draggable
                    v-model="footerSettings.links"
                    item-key="id"
                    handle=".drag-handle"
                    ghost-class="ghost-item"
                    @end="onDragEnd"
                  >
                    <template #item="{ element, index }">
                      <div :key="index" class="link-item">
                        <div class="drag-handle">
                          <i class="bi bi-grip-vertical"></i>
                        </div>
                        <div class="link-fields">
                          <!-- 链接文本 -->
                          <div class="link-field" data-label="显示文本">
                            <input type="text" v-model="element.text" class="custom-input" placeholder="文本">
                          </div>
                          
                          <!-- 链接URL -->
                          <div class="link-field" data-label="URL">
                            <input type="text" v-model="element.url" class="custom-input" placeholder="链接地址">
                          </div>
                          
                          <!-- 图标 (可选) -->
                          <div class="link-field icon-field">
                            <div class="icon-selector-button" @click="openFooterIconSelector(index)" :title="element.icon ? '更改图标' : '选择图标'">
                              <i v-if="element.icon" :class="element.icon"></i>
                              <span v-else class="no-icon">无</span>
                              <button v-if="element.icon" type="button" class="clear-icon-btn" @click.stop="clearIcon(index)" title="清除图标">
                                <i class="bi bi-x"></i>
                              </button>
                            </div>
                          </div>
                          
                          <!-- 提示文本 -->
                          <div class="link-field" data-label="提示文本">
                            <input type="text" v-model="element.title" class="custom-input" placeholder="鼠标悬停提示">
                          </div>
                        </div>
                        
                        <!-- 删除按钮 - 更新类名和图标 -->
                        <button 
                          type="button" 
                          class="remove-link-btn" 
                          @click="removeLink(index)"
                          title="删除此链接"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
            </div>
            
            <!-- 添加新链接按钮 - 添加包装器确保居中 -->
            <div class="add-link-wrapper">
              <button 
                type="button" 
                class="btn-custom btn-outline btn-sm add-link-btn" 
                @click="addNewLink"
              >
                <i class="bi bi-plus-circle"></i>
                <span class="btn-text">添加链接</span>
              </button>
            </div>
          </div>
          
          <!-- About页面设置部分 -->
          <div class="settings-section">
            <h5 class="section-title">关于页面设置</h5>
            
            <!-- 本站介绍设置 -->
            <div class="form-group">
              <h6 class="subsection-title"><i class="bi bi-info-circle"></i> 本站介绍</h6>
              
              <!-- 标题 -->
              <div class="form-group">
                <label class="form-label">标题</label>
                <div class="input-group">
                  <div class="input-prefix">
                    <i class="bi bi-type-h1"></i>
                  </div>
                  <input 
                    type="text" 
                    class="custom-input" 
                    v-model="aboutPageConfig.siteIntro.title" 
                    placeholder="本站介绍"
                  >
                </div>
              </div>
              
              <!-- 描述 -->
              <div class="form-group">
                <label class="form-label">描述</label>
                <div class="input-group">
                  <div class="input-prefix">
                    <i class="bi bi-card-text"></i>
                  </div>
                  <textarea 
                    class="custom-input" 
                    v-model="aboutPageConfig.siteIntro.description" 
                    rows="3"
                    placeholder="输入本站介绍描述..."
                  ></textarea>
                </div>
              </div>
              
              <!-- 图标 -->
              <div class="form-group">
                <label class="form-label">图标</label>
                <div class="icon-selector-button" 
                  @click="openIntroIconSelector" 
                  :title="aboutPageConfig.siteIntro.icon ? '更改图标' : '选择图标'"
                >
                  <i v-if="aboutPageConfig.siteIntro.icon" :class="`bi bi-${aboutPageConfig.siteIntro.icon}`"></i>
                  <span v-else class="no-icon">无</span>
                  <button v-if="aboutPageConfig.siteIntro.icon" 
                    type="button" 
                    class="clear-icon-btn" 
                    @click.stop="aboutPageConfig.siteIntro.icon = ''" 
                    title="清除图标"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 特性项目设置 -->
            <div class="form-group">
              <h6 class="subsection-title"><i class="bi bi-grid-3x3-gap"></i> 特性项目</h6>
              
              <div class="scroll-container links-wrapper">
                <div class="links-container">
                  <!-- 标签头部 -->
                  <div class="link-header">
                    <div class="drag-handle-placeholder"></div>
                    <div class="link-field-header">标题</div>
                    <div class="link-field-header">描述</div>
                    <div class="link-field-header">图标</div>
                    <div class="link-field-header actions-header"></div>
                  </div>
                  
                  <!-- 特性项目列表，支持拖拽排序 -->
                  <draggable
                    v-model="aboutPageConfig.featureItems"
                    item-key="id"
                    handle=".drag-handle"
                    ghost-class="ghost-item"
                    @end="onDragEnd"
                  >
                    <template #item="{ element, index }">
                      <div :key="element.id" class="link-item">
                        <div class="drag-handle">
                          <i class="bi bi-grip-vertical"></i>
                        </div>
                        <div class="link-fields">
                          <!-- 标题 -->
                          <div class="link-field" data-label="标题">
                            <input type="text" v-model="element.title" class="custom-input" placeholder="特性标题">
                          </div>
                          
                          <!-- 描述 -->
                          <div class="link-field description-field" data-label="描述">
                            <textarea v-model="element.description" class="custom-input" rows="3" placeholder="特性描述"></textarea>
                            <div class="form-text">支持HTML标签如<code>&lt;strong&gt;</code>, <code>&lt;br&gt;</code></div>
                          </div>
                          
                          <!-- 图标 -->
                          <div class="link-field icon-field">
                            <div class="icon-selector-button" 
                              @click="openFeatureIconSelector(index)" 
                              :title="element.icon ? '更改图标' : '选择图标'"
                            >
                              <i v-if="element.icon" :class="`bi bi-${element.icon}`"></i>
                              <span v-else class="no-icon">无</span>
                              <button v-if="element.icon" 
                                type="button" 
                                class="clear-icon-btn" 
                                @click.stop="clearFeatureIcon(index)" 
                                title="清除图标"
                              >
                                <i class="bi bi-x"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <!-- 删除按钮 -->
                        <button 
                          type="button" 
                          class="remove-link-btn" 
                          @click="removeFeatureItem(index)"
                          title="删除此特性项"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
              
              <!-- 添加新特性按钮 -->
              <div class="add-link-wrapper">
                <button 
                  type="button" 
                  class="btn-custom btn-outline btn-sm add-link-btn" 
                  @click="addNewFeatureItem"
                >
                  <i class="bi bi-plus-circle"></i>
                  <span class="btn-text">添加特性项</span>
                </button>
              </div>
            </div>
            
            <!-- 联系我们设置 -->
            <div class="form-group">
              <h6 class="subsection-title"><i class="bi bi-chat-dots"></i> 联系我们</h6>
              
              <!-- 标题 -->
              <div class="form-group">
                <label class="form-label">标题</label>
                <div class="input-group">
                  <div class="input-prefix">
                    <i class="bi bi-type-h1"></i>
                  </div>
                  <input 
                    type="text" 
                    class="custom-input" 
                    v-model="aboutPageConfig.contactSection.title" 
                    placeholder="联系我们"
                  >
                </div>
              </div>
              
              <!-- 描述 -->
              <div class="form-group">
                <label class="form-label">描述</label>
                <div class="input-group">
                  <div class="input-prefix">
                    <i class="bi bi-card-text"></i>
                  </div>
                  <textarea 
                    class="custom-input" 
                    v-model="aboutPageConfig.contactSection.description" 
                    rows="3"
                    placeholder="输入联系方式描述..."
                  ></textarea>
                </div>
              </div>
              
              <!-- 图标 -->
              <div class="form-group">
                <label class="form-label">装饰图标</label>
                <div class="icon-selector-button" 
                  @click="openContactSectionIconSelector" 
                  :title="aboutPageConfig.contactSection.icon ? '更改图标' : '选择图标'"
                >
                  <i v-if="aboutPageConfig.contactSection.icon" :class="`bi bi-${aboutPageConfig.contactSection.icon}`"></i>
                  <span v-else class="no-icon">无</span>
                  <button v-if="aboutPageConfig.contactSection.icon" 
                    type="button" 
                    class="clear-icon-btn" 
                    @click.stop="aboutPageConfig.contactSection.icon = ''" 
                    title="清除图标"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>
              
              <!-- 联系方式列表 -->
              <h6 class="subsection-title mt-4"><i class="bi bi-list-ul"></i> 联系方式列表</h6>
              
              <div class="scroll-container links-wrapper">
                <div class="links-container">
                  <!-- 标签头部 -->
                  <div class="link-header">
                    <div class="drag-handle-placeholder"></div>
                    <div class="link-field-header">文本</div>
                    <div class="link-field-header">图标</div>
                    <div class="link-field-header actions-header"></div>
                  </div>
                  
                  <!-- 联系方式列表，支持拖拽排序 -->
                  <draggable
                    v-model="aboutPageConfig.contactItems"
                    item-key="id"
                    handle=".drag-handle"
                    ghost-class="ghost-item"
                    @end="onDragEnd"
                  >
                    <template #item="{ element, index }">
                      <div :key="element.id" class="link-item">
                        <div class="drag-handle">
                          <i class="bi bi-grip-vertical"></i>
                        </div>
                        <div class="link-fields">
                          <!-- 文本 -->
                          <div class="link-field" data-label="文本">
                            <input type="text" v-model="element.text" class="custom-input" placeholder="联系方式文本">
                          </div>
                          
                          <!-- 图标 -->
                          <div class="link-field icon-field">
                            <div class="icon-selector-button" 
                              @click="openContactItemIconSelector(index)" 
                              :title="element.icon ? '更改图标' : '选择图标'"
                            >
                              <i v-if="element.icon" :class="`bi bi-${element.icon}`"></i>
                              <span v-else class="no-icon">无</span>
                              <button v-if="element.icon" 
                                type="button" 
                                class="clear-icon-btn" 
                                @click.stop="clearContactItemIcon(index)" 
                                title="清除图标"
                              >
                                <i class="bi bi-x"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <!-- 删除按钮 -->
                        <button 
                          type="button" 
                          class="remove-link-btn" 
                          @click="removeContactItem(index)"
                          title="删除此联系方式"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
              
              <!-- 添加新联系方式按钮 -->
              <div class="add-link-wrapper">
                <button 
                  type="button" 
                  class="btn-custom btn-outline btn-sm add-link-btn" 
                  @click="addNewContactItem"
                >
                  <i class="bi bi-plus-circle"></i>
                  <span class="btn-text">添加联系方式</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 保存按钮 - 移到这里作为整个设置区域的统一保存按钮 -->
          <div class="form-actions">
            <div v-if="settingsSuccess" class="settings-success-message">
              <i class="bi bi-check-circle-fill"></i> 设置保存成功！
            </div>
            
            <button 
              type="button" 
              class="btn-custom btn-primary" 
              @click="saveAllSettings"
              :disabled="settingsLoading"
            >
              <div v-if="settingsLoading" class="spinner"></div>
              <i class="bi bi-save"></i>
              <span class="btn-text">保存所有设置</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 图标选择器模态框 -->
      <div v-if="showIconSelector" class="custom-modal" @click.self="closeIconSelector">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-images"></i> 选择图标</h5>
              <button type="button" class="close-btn" @click="closeIconSelector">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="search-box mb-3">
                <div class="input-group">
                  <div class="input-prefix">
                    <i class="bi bi-search"></i>
                  </div>
                  <input 
                    type="text" 
                    class="custom-input" 
                    v-model="iconSearch" 
                    placeholder="搜索图标..."
                    @input="filterIcons"
                  >
                </div>
              </div>
              
              <div class="icon-grid">
                <div 
                  v-for="icon in filteredIcons" 
                  :key="icon" 
                  class="icon-item"
                  :class="{ 'selected': currentIcon === icon }"
                  @click="selectIcon(icon)"
                >
                  <i :class="`bi bi-${icon}`"></i>
                  <span class="icon-name">{{ icon }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 待审批资源卡片 -->
      <div class="admin-card">
        <div class="card-header">
          <div class="header-left">
            <h4>
              <i class="bi bi-hourglass-split"></i> 待审批资源
              <div v-if="pendingResources.length > 0" class="badge-count badge-inline">{{ pendingResources.length }}</div>
            </h4>
          </div>
        </div>
        <div class="card-body">
          <div v-if="loadingPending" class="loading-inline">
            <div class="spinner small-spinner"></div>
            <span>加载待审批资源...</span>
            </div>
          <div v-else-if="pendingResources.length === 0" class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>没有待审批的资源</p>
          </div>
          <div v-else class="table-container">
            <table class="custom-table">
                <thead>
                  <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th>类型</th>
                  <th>审批类型</th>
                  <th>图片</th>
                  <th>提交时间</th>
                  <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="resource in pendingResources" :key="resource.id">
                  <td><span class="id-badge">#{{ resource.id }}</span></td>
                    <td>{{ resource.title || resource.title_en }}</td>
                  <td><span class="type-badge">{{ resource.resource_type }}</span></td>
                  <td>
                    <span 
                      class="badge-supplement" 
                      v-if="resource.has_pending_supplement || resource.supplement?.status === 'pending'"
                    >
                      补充审批
                    </span>
                    <span class="badge-initial" v-else>初始审批</span>
                  </td>
                    <td>
                      <button 
                      class="btn-custom btn-outline btn-sm view-images-btn" 
                        @click="previewImages(resource)"
                      >
                      <i class="bi bi-images"></i> {{ resource.supplement?.images?.length || resource.images?.length || 0 }}
                      </button>
                    </td>
                    <td>{{ formatDate(resource.created_at) }}</td>
                  <td class="actions-cell">
                      <router-link 
                        :to="`/admin/resource-review/${resource.id}`" 
                      class="btn-custom btn-primary btn-sm"
                      >
                      <i class="bi bi-clipboard-check"></i> 
                      <span class="btn-text">开始审核</span>
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
          </div>
        </div>
      </div>
      
      <!-- 已审批资源卡片 - 审批记录 -->
      <div class="admin-card">
        <div class="card-header">
          <h4><i class="bi bi-clipboard-check"></i> 审批记录</h4>
          <div class="header-actions">
            <button 
              type="button" 
              class="btn-custom btn-outline toggle-btn" 
              @click="showApprovalRecords = !showApprovalRecords"
            >
              <i :class="showApprovalRecords ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
              <span class="btn-text">{{ showApprovalRecords ? '收起' : '展开' }}</span>
            </button>
            <button 
              type="button" 
              class="btn-custom btn-accent btn-sm" 
              @click="confirmBatchDelete"
              :disabled="selectedResources.length === 0"
              v-if="showApprovalRecords"
            >
              <i class="bi bi-trash"></i> 
              <span class="btn-text">批量删除</span> 
              <span v-if="selectedResources.length > 0" class="badge-count">{{ selectedResources.length }}</span>
            </button>
          </div>
        </div>
        <div class="card-body" v-if="showApprovalRecords">
          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>
                    <div class="checkbox-wrapper">
                      <input id="select-all" class="custom-checkbox" type="checkbox" v-model="selectAll" @change="toggleAllSelection">
                      <label for="select-all"></label>
                    </div>
                  </th>
                  <th>记录ID</th>
                  <th>资源标题</th>
                  <th>资源类型</th>
                  <th>类型</th>
                  <th>审批结果</th>
                  <th>审批时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="resource in resources" :key="resource.id">
                  <td>
                    <div class="checkbox-wrapper">
                      <input :id="`resource-${resource.id}`" class="custom-checkbox" type="checkbox" :value="resource.id" v-model="selectedResources">
                      <label :for="`resource-${resource.id}`"></label>
                    </div>
                  </td>
                  <td><span class="id-badge">#{{ resource.id }}</span></td>
                  <td>{{ resource.title || resource.title_en }}</td>
                  <td><span class="type-badge">{{ resource.resource_type }}</span></td>
                  <td>
                    <span 
                      class="badge-supplement" 
                      v-if="resource.is_supplement_approval"
                    >
                      补充审批
                    </span>
                    <span class="badge-initial" v-else>初始审批</span>
                  </td>
                  <td>
                    <span 
                      class="status-badge" 
                      :class="{
                        'status-approved': resource.status === 'approved' || resource.status === 'APPROVED',
                        'status-rejected': resource.status === 'rejected' || resource.status === 'REJECTED'
                      }"
                    >
                      {{ resource.status === 'approved' || resource.status === 'APPROVED' ? '已处理' : '已拒绝' }}
                    </span>
                  </td>
                  <td>{{ formatDate(resource.updated_at || resource.created_at) }}</td>
                  <td class="actions-cell">
                    <button class="btn-custom btn-outline btn-sm" @click="showApprovalDetails(resource)">
                      <i class="bi bi-info-circle"></i> 
                      <span class="btn-text">详情</span>
                    </button>
                    <button class="btn-custom btn-accent btn-sm" @click="confirmDelete(resource)">
                      <i class="bi bi-trash"></i> 
                      <span class="btn-text">删除</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- 审批详情弹窗 -->
      <div v-if="showApprovalModal" class="custom-modal" @click.self="closeApprovalDetails">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ selectedResource?.is_supplement_approval ? '补充内容审批详情' : '资源审批详情' }}
              </h5>
              <button type="button" class="close-btn" @click="closeApprovalDetails">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="modal-body">
              <div v-if="selectedResource">
                <!-- 基本信息卡片 -->
                <div class="detail-section">
                  <h6 class="detail-title"><i class="bi bi-info-circle"></i> 基本信息</h6>
                  <div class="detail-content">
                    <div class="detail-item">
                      <span class="detail-label">记录ID:</span>
                      <span class="detail-value id-badge">#{{ selectedResource.id }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">资源ID:</span>
                      <span class="detail-value id-badge">#{{ selectedResource.resource_id }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">标题:</span>
                      <span class="detail-value">{{ selectedResource.title || selectedResource.title_en }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">类型:</span>
                      <span class="detail-value type-badge">{{ selectedResource.resource_type }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">审批类型:</span>
                      <span 
                        class="detail-value badge-supplement" 
                        v-if="selectedResource.is_supplement_approval"
                      >
                        补充审批
                      </span>
                      <span class="detail-value badge-initial" v-else>初始审批</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">状态:</span>
                      <span 
                        class="detail-value status-badge" 
                        :class="{
                          'status-approved': selectedResource.status === 'approved' || selectedResource.status === 'APPROVED',
                          'status-rejected': selectedResource.status === 'rejected' || selectedResource.status === 'REJECTED'
                        }"
                      >
                        {{ selectedResource.status === 'approved' || selectedResource.status === 'APPROVED' ? '已通过' : '已拒绝' }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- 审批信息卡片 -->
                <div class="detail-section">
                  <h6 class="detail-title"><i class="bi bi-clock-history"></i> 审批信息</h6>
                  <div class="detail-content">
                    <div class="detail-item">
                      <span class="detail-label">审批时间:</span>
                      <span class="detail-value">{{ formatDate(selectedResource.created_at) }}</span>
                    </div>
                    <div class="detail-item" v-if="selectedResource.poster_image">
                      <span class="detail-label">海报:</span>
                      <span class="detail-value">{{ getImageFileName(selectedResource.poster_image) }}</span>
                    </div>
                    <div class="detail-item" v-if="selectedResource.resource_id">
                      <span class="detail-label">资源链接:</span>
                      <router-link :to="`/resource/${selectedResource.resource_id}`" class="resource-link">
                        查看资源 (#{{ selectedResource.resource_id }})
                      </router-link>
                    </div>
                  </div>
                </div>
                
                <div class="detail-section">
                  <h6 class="detail-title"><i class="bi bi-chat-left-text"></i> 审批备注</h6>
                  <div class="detail-note">
                    {{ selectedResource.notes || '无审批备注' }}
                  </div>
                </div>
                
                <div class="detail-section" v-if="selectedResource.approved_images && selectedResource.approved_images.length > 0">
                  <h6 class="detail-title">
                    <i class="bi bi-images"></i> 已批准图片 
                    <span class="image-count">({{ selectedResource.approved_images.length }})</span>
                  </h6>
                  <div class="images-grid">
                    <div 
                      v-for="(image, index) in selectedResource.approved_images" 
                      :key="index" 
                      class="image-preview-item"
                      @click="openLargeImage(image)"
                    >
                      <div class="image-card">
                        <img :src="image" :alt="`图片 ${index+1}`">
                        <div class="image-overlay">
                          <span v-if="image === selectedResource.poster_image" class="poster-badge">海报图片</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="!selectedResource.approved_images || selectedResource.approved_images.length === 0" class="empty-images">
                      <i class="bi bi-image"></i>
                      <p>无图片</p>
                    </div>
                  </div>
                </div>
                
                <!-- 显示链接信息 -->
                <div class="detail-section" v-if="selectedResource.approved_links && Object.keys(selectedResource.approved_links).length > 0">
                  <h6 class="detail-title"><i class="bi bi-link-45deg"></i> 已批准链接</h6>
                  <div class="links-container">
                    <div 
                      v-for="(links, category) in selectedResource.approved_links" 
                      :key="category" 
                      class="link-category"
                    >
                      <div class="category-name">{{ getCategoryDisplayName(category) }}</div>
                      <ul class="links-list">
                        <li v-for="(link, index) in links" :key="index" class="link-item">
                          <i class="bi bi-link-45deg"></i>
                          <span class="link-url">{{ typeof link === 'string' ? link : link.url }}</span>
                          <span v-if="typeof link === 'object' && link.password" class="link-password">
                            密码: {{ link.password }}
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div class="modal-actions">
                  <router-link 
                    :to="`/resource/${selectedResource.resource_id}`"
                    class="btn-custom btn-primary"
                    target="_blank"
                  >
                    <i class="bi bi-box-arrow-up-right"></i> <span class="btn-text">查看公开页面</span>
                  </router-link>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-custom btn-outline" @click="closeApprovalDetails">关闭</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 删除记录确认弹窗 -->
      <div v-if="showDeleteModal" class="custom-modal" @click.self="cancelDelete">
        <div class="modal-dialog small-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-trash"></i> 确认删除审批记录</h5>
              <button type="button" class="close-btn" @click="cancelDelete">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="modal-body">
              <p class="confirm-message">确定要删除资源 <strong>{{ resourceToDelete?.title || resourceToDelete?.title_en }}</strong> 的审批记录吗？</p>
              <div class="info-box">
                <i class="bi bi-info-circle"></i>
                <div>此操作只会删除审批记录，不会影响已发布的资源本身。</div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-custom btn-outline" @click="cancelDelete">取消</button>
              <button type="button" class="btn-custom btn-accent" @click="removeResourceFromList" :disabled="deleteLoading">
                <div v-if="deleteLoading" class="spinner small-spinner"></div>
                <span>{{ deleteLoading ? '删除中...' : '确认删除' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图片预览弹窗 -->
      <div v-if="showImagePreview" class="custom-modal" @click.self="closeImagePreview">
        <div class="modal-dialog large-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-images"></i> 图片预览</h5>
              <button type="button" class="close-btn" @click="closeImagePreview">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="preview-grid">
                <div 
                  v-for="(image, index) in previewImagesList" 
                  :key="index"
                  class="preview-item"
                  @click="openLargeImage(image)"
                >
                  <img :src="image" :alt="`预览图片 ${index+1}`">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-custom btn-outline" @click="closeImagePreview">关闭</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 大图预览 - 修改为与ResourceDetail.vue相同的风格 -->
      <div v-if="largeImageUrl" class="custom-modal" @click.self="closeLargeImage">
        <div class="modal-image-container">
          <button type="button" class="image-close-btn bi bi-x-lg me-2" @click="closeLargeImage"></button>
          <img :src="largeImageUrl" class="preview-large-image" alt="图片预览">
        </div>
      </div>
      
      <!-- 批量删除确认弹窗 -->
      <div v-if="showBatchDeleteModal" class="custom-modal" @click.self="cancelBatchDelete">
        <div class="modal-dialog small-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-trash"></i> 确认批量删除审批记录</h5>
              <button type="button" class="close-btn" @click="cancelBatchDelete">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="modal-body">
              <p class="confirm-message">确定要删除选中的 <strong>{{ selectedResources.length }}</strong> 条审批记录吗？</p>
              <div class="info-box">
                <i class="bi bi-info-circle"></i>
                <div>此操作只会删除审批记录，不会影响已发布的资源本身。</div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-custom btn-outline" @click="cancelBatchDelete">取消</button>
              <button type="button" class="btn-custom btn-accent" @click="batchDeleteResources" :disabled="batchDeleteLoading">
                <div v-if="batchDeleteLoading" class="spinner small-spinner"></div>
                <span>{{ batchDeleteLoading ? '删除中...' : '确认删除' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { isAdmin, debugAuth } from '../utils/auth'
import { useRouter } from 'vue-router'
import { updateSiteSettings, getSiteSettings } from '../utils/api'
import draggable from 'vuedraggable'
import infoManager from '../utils/InfoManager'

const router = useRouter()
const resources = ref([])
const pendingResources = ref([])
const loading = ref(true)
const loadingPending = ref(true)
const error = ref(null)
const showDeleteModal = ref(false)
const resourceToDelete = ref(null)
const deleteLoading = ref(false)
const approvalLoading = ref(null)

// 图片预览相关
const showImagePreview = ref(false)
const previewImagesList = ref([])
const largeImageUrl = ref(null) // 用于大图预览

// 密码修改相关状态
const showChangePassword = ref(false)
const passwordLoading = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref(null)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 网站设置相关状态
const showSiteSettings = ref(false)
const settingsLoading = ref(false)
const settingsSuccess = ref(false)
const settingsError = ref(null)
const footerSettings = ref({
  links: [],
  copyright: '',
  show_visitor_count: true
})

// 审批记录显示状态
const showApprovalRecords = ref(false)

// 图标选择器相关
const showIconSelector = ref(false)
const currentLinkIndex = ref(-1)
const iconSearch = ref('')
const currentIcon = ref('')
const iconSelectorTarget = ref('') // 用于区分当前为哪个元素选择图标（链接、介绍、特性等）
const iconSelectorIndex = ref(-1) // 当前编辑的项目索引
const iconDisplay = ref({}) // 用于显示图标的简化名称
// const iconList = ['tencent-qq',
//   'github', 'twitter', 'facebook', 'instagram', 'telegram', 'discord', 'tiktok',
//   'youtube', 'chat', 'chat-fill', 'messenger', 'whatsapp', 'skype', 'reddit',
//   'pinterest', 'google', 'linkedin', 'globe', 'globe2', 'house', 'info-circle',
//   'question-circle', 'exclamation-circle', 'shield', 'hand-thumbs-up',
//   'envelope', 'envelope-fill', 'telephone', 'telephone-fill', 'people',
//   'person', 'journal-text', 'book', 'bookmark', 'bookmark-fill',
//   'heart', 'heart-fill', 'star', 'star-fill', 'bell', 'bell-fill',
//   'gear', 'gear-fill', 'tools', 'box', 'gift', 'cart', 'cart-fill',
//   'bag', 'bag-fill', 'basket', 'basket-fill', 'camera', 'camera-fill',
//   'music-note', 'music-note-list', 'film', 'play-circle', 'calendar',
//   'calendar-date', 'calendar-week', 'clock', 'clock-fill', 'award',
//   'briefcase', 'emoji-smile', 'emoji-laugh', 'emoji-sunglasses'
// ]
const iconList = ['0-circle', '0-circle-fill', '0-square', '0-square-fill', '1-circle', '1-circle-fill', '1-square', '1-square-fill', '123', '2-circle', '2-circle-fill', '2-square', '2-square-fill', '3-circle', '3-circle-fill', '3-square', '3-square-fill', '4-circle', '4-circle-fill', '4-square', '4-square-fill', '5-circle', '5-circle-fill', '5-square', '5-square-fill', '6-circle', '6-circle-fill', '6-square', '6-square-fill', '7-circle', '7-circle-fill', '7-square', '7-square-fill', '8-circle', '8-circle-fill', '8-square', '8-square-fill', '9-circle', '9-circle-fill', '9-square', '9-square-fill', 'activity', 'airplane', 'airplane-engines', 'airplane-engines-fill', 'airplane-fill', 'alarm', 'alarm-fill', 'alexa', 'align-bottom', 'align-center', 'align-end', 'align-middle', 'align-start', 'align-top', 'alipay', 'alphabet', 'alphabet-uppercase', 'alt', 'amazon', 'amd', 'android', 'android2', 'anthropic', 'app', 'app-indicator', 'apple', 'apple-music', 'archive', 'archive-fill', 'arrow-90deg-down', 'arrow-90deg-left', 'arrow-90deg-right', 'arrow-90deg-up', 'arrow-bar-down', 'arrow-bar-left', 'arrow-bar-right', 'arrow-bar-up', 'arrow-clockwise', 'arrow-counterclockwise', 'arrow-down', 'arrow-down-circle', 'arrow-down-circle-fill', 'arrow-down-left-circle', 'arrow-down-left-circle-fill', 'arrow-down-left-square', 'arrow-down-left-square-fill', 'arrow-down-right-circle', 'arrow-down-right-circle-fill', 'arrow-down-right-square', 'arrow-down-right-square-fill', 'arrow-down-square', 'arrow-down-square-fill', 'arrow-down-left', 'arrow-down-right', 'arrow-down-short', 'arrow-down-up', 'arrow-left', 'arrow-left-circle', 'arrow-left-circle-fill', 'arrow-left-square', 'arrow-left-square-fill', 'arrow-left-right', 'arrow-left-short', 'arrow-repeat', 'arrow-return-left', 'arrow-return-right', 'arrow-right', 'arrow-right-circle', 'arrow-right-circle-fill', 'arrow-right-square', 'arrow-right-square-fill', 'arrow-right-short', 'arrow-through-heart', 'arrow-through-heart-fill', 'arrow-up', 'arrow-up-circle', 'arrow-up-circle-fill', 'arrow-up-left-circle', 'arrow-up-left-circle-fill', 'arrow-up-left-square', 'arrow-up-left-square-fill', 'arrow-up-right-circle', 'arrow-up-right-circle-fill', 'arrow-up-right-square', 'arrow-up-right-square-fill', 'arrow-up-square', 'arrow-up-square-fill', 'arrow-up-left', 'arrow-up-right', 'arrow-up-short', 'arrows', 'arrows-angle-contract', 'arrows-angle-expand', 'arrows-collapse', 'arrows-collapse-vertical', 'arrows-expand', 'arrows-expand-vertical', 'arrows-fullscreen', 'arrows-move', 'arrows-vertical', 'aspect-ratio', 'aspect-ratio-fill', 'asterisk', 'at', 'award', 'award-fill', 'back', 'backpack', 'backpack-fill', 'backpack2', 'backpack2-fill', 'backpack3', 'backpack3-fill', 'backpack4', 'backpack4-fill', 'backspace', 'backspace-fill', 'backspace-reverse', 'backspace-reverse-fill', 'badge-3d', 'badge-3d-fill', 'badge-4k', 'badge-4k-fill', 'badge-8k', 'badge-8k-fill', 'badge-ad', 'badge-ad-fill', 'badge-ar', 'badge-ar-fill', 'badge-cc', 'badge-cc-fill', 'badge-hd', 'badge-hd-fill', 'badge-sd', 'badge-sd-fill', 'badge-tm', 'badge-tm-fill', 'badge-vo', 'badge-vo-fill', 'badge-vr', 'badge-vr-fill', 'badge-wc', 'badge-wc-fill', 'bag', 'bag-check', 'bag-check-fill', 'bag-dash', 'bag-dash-fill', 'bag-fill', 'bag-heart', 'bag-heart-fill', 'bag-plus', 'bag-plus-fill', 'bag-x', 'bag-x-fill', 'balloon', 'balloon-fill', 'balloon-heart', 'balloon-heart-fill', 'ban', 'ban-fill', 'bandaid', 'bandaid-fill', 'bank', 'bank2', 'bar-chart', 'bar-chart-fill', 'bar-chart-line', 'bar-chart-line-fill', 'bar-chart-steps', 'basket', 'basket-fill', 'basket2', 'basket2-fill', 'basket3', 'basket3-fill', 'battery', 'battery-charging', 'battery-full', 'battery-half', 'battery-low', 'beaker', 'beaker-fill', 'behance', 'bell', 'bell-fill', 'bell-slash', 'bell-slash-fill', 'bezier', 'bezier2', 'bicycle', 'bing', 'binoculars', 'binoculars-fill', 'blockquote-left', 'blockquote-right', 'bluesky', 'bluetooth', 'body-text', 'book', 'book-fill', 'book-half', 'bookmark', 'bookmark-check', 'bookmark-check-fill', 'bookmark-dash', 'bookmark-dash-fill', 'bookmark-fill', 'bookmark-heart', 'bookmark-heart-fill', 'bookmark-plus', 'bookmark-plus-fill', 'bookmark-star', 'bookmark-star-fill', 'bookmark-x', 'bookmark-x-fill', 'bookmarks', 'bookmarks-fill', 'bookshelf', 'boombox', 'boombox-fill', 'bootstrap', 'bootstrap-fill', 'bootstrap-reboot', 'border', 'border-all', 'border-bottom', 'border-center', 'border-inner', 'border-left', 'border-middle', 'border-outer', 'border-right', 'border-style', 'border-top', 'border-width', 'bounding-box', 'bounding-box-circles', 'box', 'box-arrow-down-left', 'box-arrow-down-right', 'box-arrow-down', 'box-arrow-in-down', 'box-arrow-in-down-left', 'box-arrow-in-down-right', 'box-arrow-in-left', 'box-arrow-in-right', 'box-arrow-in-up', 'box-arrow-in-up-left', 'box-arrow-in-up-right', 'box-arrow-left', 'box-arrow-right', 'box-arrow-up', 'box-arrow-up-left', 'box-arrow-up-right', 'box-fill', 'box-seam', 'box-seam-fill', 'box2', 'box2-fill', 'box2-heart', 'box2-heart-fill', 'boxes', 'braces', 'braces-asterisk', 'bricks', 'briefcase', 'briefcase-fill', 'brightness-alt-high', 'brightness-alt-high-fill', 'brightness-alt-low', 'brightness-alt-low-fill', 'brightness-high', 'brightness-high-fill', 'brightness-low', 'brightness-low-fill', 'brilliance', 'broadcast', 'broadcast-pin', 'browser-chrome', 'browser-edge', 'browser-firefox', 'browser-safari', 'brush', 'brush-fill', 'bucket', 'bucket-fill', 'bug', 'bug-fill', 'building', 'building-add', 'building-check', 'building-dash', 'building-down', 'building-exclamation', 'building-fill', 'building-fill-add', 'building-fill-check', 'building-fill-dash', 'building-fill-down', 'building-fill-exclamation', 'building-fill-gear', 'building-fill-lock', 'building-fill-slash', 'building-fill-up', 'building-fill-x', 'building-gear', 'building-lock', 'building-slash', 'building-up', 'building-x', 'buildings', 'buildings-fill', 'bullseye', 'bus-front', 'bus-front-fill', 'c-circle', 'c-circle-fill', 'c-square', 'c-square-fill', 'cake', 'cake-fill', 'cake2', 'cake2-fill', 'calculator', 'calculator-fill', 'calendar', 'calendar-check', 'calendar-check-fill', 'calendar-date', 'calendar-date-fill', 'calendar-day', 'calendar-day-fill', 'calendar-event', 'calendar-event-fill', 'calendar-fill', 'calendar-heart', 'calendar-heart-fill', 'calendar-minus', 'calendar-minus-fill', 'calendar-month', 'calendar-month-fill', 'calendar-plus', 'calendar-plus-fill', 'calendar-range', 'calendar-range-fill', 'calendar-week', 'calendar-week-fill', 'calendar-x', 'calendar-x-fill', 'calendar2', 'calendar2-check', 'calendar2-check-fill', 'calendar2-date', 'calendar2-date-fill', 'calendar2-day', 'calendar2-day-fill', 'calendar2-event', 'calendar2-event-fill', 'calendar2-fill', 'calendar2-heart', 'calendar2-heart-fill', 'calendar2-minus', 'calendar2-minus-fill', 'calendar2-month', 'calendar2-month-fill', 'calendar2-plus', 'calendar2-plus-fill', 'calendar2-range', 'calendar2-range-fill', 'calendar2-week', 'calendar2-week-fill', 'calendar2-x', 'calendar2-x-fill', 'calendar3', 'calendar3-event', 'calendar3-event-fill', 'calendar3-fill', 'calendar3-range', 'calendar3-range-fill', 'calendar3-week', 'calendar3-week-fill', 'calendar4', 'calendar4-event', 'calendar4-range', 'calendar4-week', 'camera', 'camera2', 'camera-fill', 'camera-reels', 'camera-reels-fill', 'camera-video', 'camera-video-fill', 'camera-video-off', 'camera-video-off-fill', 'capslock', 'capslock-fill', 'capsule', 'capsule-pill', 'car-front', 'car-front-fill', 'card-checklist', 'card-heading', 'card-image', 'card-list', 'card-text', 'caret-down', 'caret-down-fill', 'caret-down-square', 'caret-down-square-fill', 'caret-left', 'caret-left-fill', 'caret-left-square', 'caret-left-square-fill', 'caret-right', 'caret-right-fill', 'caret-right-square', 'caret-right-square-fill', 'caret-up', 'caret-up-fill', ' caret-up-square', 'caret-up-square-fill', 'cart', 'cart-check', 'cart-check-fill', 'cart-dash', 'cart-dash-fill', 'cart-fill', 'cart-plus', 'cart-plus-fill', 'cart-x', 'cart-x-fill', 'cart2', 'cart3', 'cart4', 'cash', 'cash-coin', 'cash-stack', 'cassette', 'cassette-fill', 'cast', 'cc-circle', 'cc-circle-fill', 'cc-square', 'cc-square-fill', 'chat', 'chat-dots', 'chat-dots-fill', 'chat-fill', 'chat-heart', 'chat-heart-fill', 'chat-left', 'chat-left-dots', 'chat-left-dots-fill', 'chat-left-fill', 'chat-left-heart', 'chat-left-heart-fill', 'chat-left-quote', 'chat-left-quote-fill', 'chat-left-text', 'chat-left-text-fill', 'chat-quote', 'chat-quote-fill', 'chat-right', 'chat-right-dots', 'chat-right-dots-fill', 'chat-right-fill', 'chat-right-heart', 'chat-right-heart-fill', 'chat-right-quote', 'chat-right-quote-fill', 'chat-right-text', 'chat-right-text-fill', 'chat-square', 'chat-square-dots', 'chat-square-dots-fill', 'chat-square-fill', 'chat-square-heart', 'chat-square-heart-fill', 'chat-square-quote', 'chat-square-quote-fill', 'chat-square-text', 'chat-square-text-fill', 'chat-text', 'chat-text-fill', 'check', 'check-all', 'check-circle', 'check-circle-fill', 'check-lg', 'check-square', 'check-square-fill', 'check2', 'check2-all', 'check2-circle', 'check2-square', 'chevron-bar-contract', 'chevron-bar-down', 'chevron-bar-expand', 'chevron-bar-left', 'chevron-bar-right', 'chevron-bar-up', 'chevron-compact-down', 'chevron-compact-left', 'chevron-compact-right', 'chevron-compact-up', 'chevron-contract', 'chevron-double-down', 'chevron-double-left', 'chevron-double-right', 'chevron-double-up', 'chevron-down', 'chevron-expand', 'chevron-left', 'chevron-right', 'chevron-up', 'circle', 'circle-fill', 'circle-half', 'slash-circle', 'circle-square', 'claude', 'clipboard', 'clipboard-check', 'clipboard-check-fill', 'clipboard-data', 'clipboard-data-fill', 'clipboard-fill', 'clipboard-heart', 'clipboard-heart-fill', 'clipboard-minus', 'clipboard-minus-fill', 'clipboard-plus', 'clipboard-plus-fill', 'clipboard-pulse', 'clipboard-x', 'clipboard-x-fill', 'clipboard2', 'clipboard2-check', 'clipboard2-check-fill', 'clipboard2-data', 'clipboard2-data-fill', 'clipboard2-fill', 'clipboard2-heart', 'clipboard2-heart-fill', 'clipboard2-minus', 'clipboard2-minus-fill', 'clipboard2-plus', 'clipboard2-plus-fill', 'clipboard2-pulse', 'clipboard2-pulse-fill', 'clipboard2-x', 'clipboard2-x-fill', 'clock', 'clock-fill', 'clock-history', 'cloud', 'cloud-arrow-down', 'cloud-arrow-down-fill', 'cloud-arrow-up', 'cloud-arrow-up-fill', 'cloud-check', 'cloud-check-fill', 'cloud-download', 'cloud-download-fill', 'cloud-drizzle', 'cloud-drizzle-fill', 'cloud-fill', 'cloud-fog', 'cloud-fog-fill', 'cloud-fog2', 'cloud-fog2-fill', 'cloud-hail', 'cloud-hail-fill', 'cloud-haze', 'cloud-haze-fill', 'cloud-haze2', 'cloud-haze2-fill', 'cloud-lightning', 'cloud-lightning-fill', 'cloud-lightning-rain', 'cloud-lightning-rain-fill', 'cloud-minus', 'cloud-minus-fill', 'cloud-moon', 'cloud-moon-fill', 'cloud-plus', 'cloud-plus-fill', 'cloud-rain', 'cloud-rain-fill', 'cloud-rain-heavy', 'cloud-rain-heavy-fill', 'cloud-slash', 'cloud-slash-fill', 'cloud-sleet', 'cloud-sleet-fill', 'cloud-snow', 'cloud-snow-fill', 'cloud-sun', 'cloud-sun-fill', 'cloud-upload', 'cloud-upload-fill', 'clouds', 'clouds-fill', 'cloudy', 'cloudy-fill', 'code', 'code-slash', 'code-square', 'coin', 'collection', 'collection-fill', 'collection-play', 'collection-play-fill', 'columns', 'columns-gap', 'command', 'compass', 'compass-fill', 'cone', 'cone-striped', 'controller', 'cookie', 'copy', 'cpu', 'cpu-fill', 'credit-card', 'credit-card-2-back', 'credit-card-2-back-fill', 'credit-card-2-front', 'credit-card-2-front-fill', 'credit-card-fill', 'crop', 'crosshair', 'crosshair2', 'css', 'cup', 'cup-fill', 'cup-hot', 'cup-hot-fill', 'cup-straw', 'currency-bitcoin', 'currency-dollar', 'currency-euro', 'currency-exchange', 'currency-pound', 'currency-rupee', 'currency-yen', 'cursor', 'cursor-fill', 'cursor-text', 'dash', 'dash-circle', 'dash-circle-dotted', 'dash-circle-fill', 'dash-lg', 'dash-square', 'dash-square-dotted', 'dash-square-fill', 'database', 'database-add', 'database-check', 'database-dash', 'database-down', 'database-exclamation', 'database-fill', 'database-fill-add', 'database-fill-check', 'database-fill-dash', 'database-fill-down', 'database-fill-exclamation', 'database-fill-gear', 'database-fill-lock', 'database-fill-slash', 'database-fill-up', 'database-fill-x', 'database-gear', 'database-lock', 'database-slash', 'database-up', 'database-x', 'device-hdd', 'device-hdd-fill', 'device-ssd', 'device-ssd-fill', 'diagram-2', 'diagram-2-fill', 'diagram-3', 'diagram-3-fill', 'diamond', 'diamond-fill', 'diamond-half', 'dice-1', 'dice-1-fill', 'dice-2', 'dice-2-fill', 'dice-3', 'dice-3-fill', 'dice-4', 'dice-4-fill', 'dice-5', 'dice-5-fill', 'dice-6', 'dice-6-fill', 'disc', 'disc-fill', 'discord', 'display', 'display-fill', 'displayport', 'displayport-fill', 'distribute-horizontal', 'distribute-vertical', 'door-closed', 'door-closed-fill', 'door-open', 'door-open-fill', 'dot', 'download', 'dpad', 'dpad-fill', 'dribbble', 'dropbox', 'droplet', 'droplet-fill', 'droplet-half', 'duffle', 'duffle-fill', 'ear', 'ear-fill', 'earbuds', 'easel', 'easel-fill', 'easel2', 'easel2-fill', 'easel3', 'easel3-fill', 'egg', 'egg-fill', 'egg-fried', 'eject', 'eject-fill', 'emoji-angry', 'emoji-angry-fill', 'emoji-astonished', 'emoji-astonished-fill', 'emoji-dizzy', 'emoji-dizzy-fill', 'emoji-expressionless', 'emoji-expressionless-fill', 'emoji-frown', 'emoji-frown-fill', 'emoji-grimace', 'emoji-grimace-fill', 'emoji-grin', 'emoji-grin-fill', 'emoji-heart-eyes', 'emoji-heart-eyes-fill', 'emoji-kiss', 'emoji-kiss-fill', 'emoji-laughing', 'emoji-laughing-fill', 'emoji-neutral', 'emoji-neutral-fill', 'emoji-smile', 'emoji-smile-fill', 'emoji-smile-upside-down', 'emoji-smile-upside-down-fill', 'emoji-sunglasses', 'emoji-sunglasses-fill', 'emoji-surprise', 'emoji-surprise-fill', 'emoji-tear', 'emoji-tear-fill', 'emoji-wink', 'emoji-wink-fill', 'envelope', 'envelope-arrow-down', 'envelope-arrow-down-fill', 'envelope-arrow-up', 'envelope-arrow-up-fill', 'envelope-at', 'envelope-at-fill', 'envelope-check', 'envelope-check-fill', 'envelope-dash', 'envelope-dash-fill', 'envelope-exclamation', 'envelope-exclamation-fill', 'envelope-fill', 'envelope-heart', 'envelope-heart-fill', 'envelope-open', 'envelope-open-fill', 'envelope-open-heart', 'envelope-open-heart-fill', 'envelope-paper', 'envelope-paper-fill', 'envelope-paper-heart', 'envelope-paper-heart-fill', 'envelope-plus', 'envelope-plus-fill', 'envelope-slash', 'envelope-slash-fill', 'envelope-x', 'envelope-x-fill', 'eraser', 'eraser-fill', 'escape', 'ethernet', 'ev-front', 'ev-front-fill', 'ev-station', 'ev-station-fill', 'exclamation', 'exclamation-circle', 'exclamation-circle-fill', 'exclamation-diamond', 'exclamation-diamond-fill', 'exclamation-lg', 'exclamation-octagon', 'exclamation-octagon-fill', 'exclamation-square', 'exclamation-square-fill', 'exclamation-triangle', 'exclamation-triangle-fill', 'exclude', 'explicit', 'explicit-fill', 'exposure', 'eye', 'eye-fill', 'eye-slash', 'eye-slash-fill', 'eyedropper', 'eyeglasses', 'facebook', 'fan', 'fast-forward', 'fast-forward-btn', 'fast-forward-btn-fill', 'fast-forward-circle', 'fast-forward-circle-fill', 'fast-forward-fill', 'feather', 'feather2', 'file', 'file-arrow-down', 'file-arrow-down-fill', 'file-arrow-up', 'file-arrow-up-fill', 'file-bar-graph', 'file-bar-graph-fill', 'file-binary', 'file-binary-fill', 'file-break', 'file-break-fill', 'file-check', 'file-check-fill', 'file-code', 'file-code-fill', 'file-diff', 'file-diff-fill', 'file-earmark', 'file-earmark-arrow-down', 'file-earmark-arrow-down-fill', 'file-earmark-arrow-up', 'file-earmark-arrow-up-fill', 'file-earmark-bar-graph', 'file-earmark-bar-graph-fill', 'file-earmark-binary', 'file-earmark-binary-fill', 'file-earmark-break', 'file-earmark-break-fill', 'file-earmark-check', 'file-earmark-check-fill', 'file-earmark-code', 'file-earmark-code-fill', 'file-earmark-diff', 'file-earmark-diff-fill', 'file-earmark-easel', 'file-earmark-easel-fill', 'file-earmark-excel', 'file-earmark-excel-fill', 'file-earmark-fill', 'file-earmark-font', 'file-earmark-font-fill', 'file-earmark-image', 'file-earmark-image-fill', 'file-earmark-lock', 'file-earmark-lock-fill', 'file-earmark-lock2', 'file-earmark-lock2-fill', 'file-earmark-medical', 'file-earmark-medical-fill', 'file-earmark-minus', 'file-earmark-minus-fill', 'file-earmark-music', 'file-earmark-music-fill', 'file-earmark-pdf', 'file-earmark-pdf-fill', 'file-earmark-person', 'file-earmark-person-fill', 'file-earmark-play', 'file-earmark-play-fill', 'file-earmark-plus', 'file-earmark-plus-fill', 'file-earmark-post', 'file-earmark-post-fill', 'file-earmark-ppt', 'file-earmark-ppt-fill', 'file-earmark-richtext', 'file-earmark-richtext-fill', 'file-earmark-ruled', 'file-earmark-ruled-fill', 'file-earmark-slides', 'file-earmark-slides-fill', 'file-earmark-spreadsheet', 'file-earmark-spreadsheet-fill', 'file-earmark-text', 'file-earmark-text-fill', 'file-earmark-word', 'file-earmark-word-fill', 'file-earmark-x', 'file-earmark-x-fill', 'file-earmark-zip', 'file-earmark-zip-fill', 'file-easel', 'file-easel-fill', 'file-excel', 'file-excel-fill', 'file-fill', 'file-font', 'file-font-fill', 'file-image', 'file-image-fill', 'file-lock', 'file-lock-fill', 'file-lock2', 'file-lock2-fill', 'file-medical', 'file-medical-fill', 'file-minus', 'file-minus-fill', 'file-music', 'file-music-fill', 'file-pdf', 'file-pdf-fill', 'file-person', 'file-person-fill', 'file-play', 'file-play-fill', 'file-plus', 'file-plus-fill', 'file-post', 'file-post-fill', 'file-ppt', 'file-ppt-fill', 'file-richtext', 'file-richtext-fill', 'file-ruled', 'file-ruled-fill', 'file-slides', 'file-slides-fill', 'file-spreadsheet', 'file-spreadsheet-fill', 'file-text', 'file-text-fill', 'file-word', 'file-word-fill', 'file-x', 'file-x-fill', 'file-zip', 'file-zip-fill', 'files', 'files-alt', 'filetype-aac', 'filetype-ai', 'filetype-bmp', 'filetype-cs', 'filetype-css', 'filetype-csv', 'filetype-doc', 'filetype-docx', 'filetype-exe', 'filetype-gif', 'filetype-heic', 'filetype-html', 'filetype-java', 'filetype-jpg', 'filetype-js', 'filetype-json', 'filetype-jsx', 'filetype-key', 'filetype-m4p', 'filetype-md', 'filetype-mdx', 'filetype-mov', 'filetype-mp3', 'filetype-mp4', 'filetype-otf', 'filetype-pdf', 'filetype-php', 'filetype-png', 'filetype-ppt', 'filetype-pptx', 'filetype-psd', 'filetype-py', 'filetype-raw', 'filetype-rb', 'filetype-sass', 'filetype-scss', 'filetype-sh', 'filetype-sql', 'filetype-svg', 'filetype-tiff', 'filetype-tsx', 'filetype-ttf', 'filetype-txt', 'filetype-wav', 'filetype-woff', 'filetype-xls', 'filetype-xlsx', 'filetype-xml', 'filetype-yml', 'film', 'filter', 'filter-circle', 'filter-circle-fill', 'filter-left', 'filter-right', 'filter-square', 'filter-square-fill', 'fingerprint', 'fire', 'flag', 'flag-fill', 'flask', 'flask-fill', 'flask-florence', 'flask-florence-fill', 'floppy', 'floppy-fill', 'floppy2', 'floppy2-fill', 'flower1', 'flower2', 'flower3', 'folder', 'folder-check', 'folder-fill', 'folder-minus', 'folder-plus', 'folder-symlink', 'folder-symlink-fill', 'folder-x', 'folder2', 'folder2-open', 'fonts', 'fork-knife', 'forward', 'forward-fill', 'front', 'fuel-pump', 'fuel-pump-diesel', 'fuel-pump-diesel-fill', 'fuel-pump-fill', 'fullscreen', 'fullscreen-exit', 'funnel', 'funnel-fill', 'gear', 'gear-fill', 'gear-wide', 'gear-wide-connected', 'gem', 'gender-ambiguous', 'gender-female', 'gender-male', 'gender-neuter', 'gender-trans', 'geo', 'geo-alt', 'geo-alt-fill', 'geo-fill', 'gift', 'gift-fill', 'git', 'github', 'gitlab', 'globe', 'globe-americas', 'globe-americas-fill', 'globe-asia-australia', 'globe-asia-australia-fill', 'globe-central-south-asia', 'globe-central-south-asia-fill', 'globe-europe-africa', 'globe-europe-africa-fill', 'globe2', 'google', 'google-play', 'gpu-card', 'graph-down', 'graph-down-arrow', 'graph-up', 'graph-up-arrow', 'grid', 'grid-1x2', 'grid-1x2-fill', 'grid-3x2', 'grid-3x2-gap', 'grid-3x2-gap-fill', 'grid-3x3', 'grid-3x3-gap', 'grid-3x3-gap-fill', 'grid-fill', 'grip-horizontal', 'grip-vertical', 'h-circle', 'h-circle-fill', 'h-square', 'h-square-fill', 'hammer', 'hand-index', 'hand-index-fill', 'hand-index-thumb', 'hand-index-thumb-fill', 'hand-thumbs-down', 'hand-thumbs-down-fill', 'hand-thumbs-up', 'hand-thumbs-up-fill', 'handbag', 'handbag-fill', 'hash', 'hdd', 'hdd-fill', 'hdd-network', 'hdd-network-fill', 'hdd-rack', 'hdd-rack-fill', 'hdd-stack', 'hdd-stack-fill', 'hdmi', 'hdmi-fill', 'headphones', 'headset', 'headset-vr', 'heart', 'heart-arrow', 'heart-fill', 'heart-half', 'heart-pulse', 'heart-pulse-fill', 'heartbreak', 'heartbreak-fill', 'hearts', 'heptagon', 'heptagon-fill', 'heptagon-half', 'hexagon', 'hexagon-fill', 'hexagon-half', 'highlighter', 'highlights', 'hospital', 'hospital-fill', 'hourglass', 'hourglass-bottom', 'hourglass-split', 'hourglass-top', 'house', 'house-add', 'house-add-fill', 'house-check', 'house-check-fill', 'house-dash', 'house-dash-fill', 'house-door', 'house-door-fill', 'house-down', 'house-down-fill', 'house-exclamation', 'house-exclamation-fill', 'house-fill', 'house-gear', 'house-gear-fill', 'house-heart', 'house-heart-fill', 'house-lock', 'house-lock-fill', 'house-slash', 'house-slash-fill', 'house-up', 'house-up-fill', 'house-x', 'house-x-fill', 'houses', 'houses-fill', 'hr', 'hurricane', 'hypnotize', 'image', 'image-alt', 'image-fill', 'images', 'inbox', 'inbox-fill', 'inboxes-fill', 'inboxes', 'incognito', 'indent', 'infinity', 'info', 'info-circle', 'info-circle-fill', 'info-lg', 'info-square', 'info-square-fill', 'input-cursor', 'input-cursor-text', 'instagram', 'intersect', 'javascript', 'journal', 'journal-album', 'journal-arrow-down', 'journal-arrow-up', 'journal-bookmark', 'journal-bookmark-fill', 'journal-check', 'journal-code', 'journal-medical', 'journal-minus', 'journal-plus', 'journal-richtext', 'journal-text', 'journal-x', 'journals', 'joystick', 'justify', 'justify-left', 'justify-right', 'kanban', 'kanban-fill', 'key', 'key-fill', 'keyboard', 'keyboard-fill', 'ladder', 'lamp', 'lamp-fill', 'laptop', 'laptop-fill', 'layer-backward', 'layer-forward', 'layers', 'layers-fill', 'layers-half', 'layout-sidebar', 'layout-sidebar-inset-reverse', 'layout-sidebar-inset', 'layout-sidebar-reverse', 'layout-split', 'layout-text-sidebar', 'layout-text-sidebar-reverse', 'layout-text-window', 'layout-text-window-reverse', 'layout-three-columns', 'layout-wtf', 'leaf', 'leaf-fill', 'life-preserver', 'lightbulb', 'lightbulb-fill', 'lightbulb-off', 'lightbulb-off-fill', 'lightning', 'lightning-charge', 'lightning-charge-fill', 'lightning-fill', 'line', 'link', 'link-45deg', 'linkedin', 'list', 'list-check', 'list-columns', 'list-columns-reverse', 'list-nested', 'list-ol', 'list-stars', 'list-task', 'list-ul', 'lock', 'lock-fill', 'luggage', 'luggage-fill', 'lungs', 'lungs-fill', 'magic', 'magnet', 'magnet-fill', 'mailbox', 'mailbox-flag', 'mailbox2', 'mailbox2-flag', 'map', 'map-fill', 'markdown', 'markdown-fill', 'marker-tip', 'mask', 'mastodon', 'measuring-cup', 'measuring-cup-fill', 'medium', 'megaphone', 'megaphone-fill', 'memory', 'menu-app', 'menu-app-fill', 'menu-button', 'menu-button-fill', 'menu-button-wide', 'menu-button-wide-fill', 'menu-down', 'menu-up', 'messenger', 'meta', 'mic', 'mic-fill', 'mic-mute', 'mic-mute-fill', 'microsoft', 'microsoft-teams', 'minecart', 'minecart-loaded', 'modem', 'modem-fill', 'moisture', 'moon', 'moon-fill', 'moon-stars', 'moon-stars-fill', 'mortarboard', 'mortarboard-fill', 'motherboard', 'motherboard-fill', 'mouse', 'mouse-fill', 'mouse2', 'mouse2-fill', 'mouse3', 'mouse3-fill', 'music-note', 'music-note-beamed', 'music-note-list', 'music-player', 'music-player-fill', 'newspaper', 'nintendo-switch', 'node-minus', 'node-minus-fill', 'node-plus', 'node-plus-fill', 'noise-reduction', 'nut', 'nut-fill', 'nvidia', 'nvme', 'nvme-fill', 'octagon', 'octagon-fill', 'octagon-half', 'openai', 'opencollective', 'optical-audio', 'optical-audio-fill', 'option', 'outlet', 'p-circle', 'p-circle-fill', 'p-square', 'p-square-fill', 'paint-bucket', 'palette', 'palette-fill', 'palette2', 'paperclip', 'paragraph', 'pass', 'pass-fill', 'passport', 'passport-fill', 'patch-check', 'patch-check-fill', 'patch-exclamation', 'patch-exclamation-fill', 'patch-minus', 'patch-minus-fill', 'patch-plus', 'patch-plus-fill', 'patch-question', 'patch-question-fill', 'pause', 'pause-btn', 'pause-btn-fill', 'pause-circle', 'pause-circle-fill', 'pause-fill', 'paypal', 'pc', 'pc-display', 'pc-display-horizontal', 'pc-horizontal', 'pci-card', 'pci-card-network', 'pci-card-sound', 'peace', 'peace-fill', 'pen', 'pen-fill', 'pencil', 'pencil-fill', 'pencil-square', 'pentagon', 'pentagon-fill', 'pentagon-half', 'people', 'person-circle', 'people-fill', 'percent', 'perplexity', 'person', 'person-add', 'person-arms-up', 'person-badge', 'person-badge-fill', 'person-bounding-box', 'person-check', 'person-check-fill', 'person-dash', 'person-dash-fill', 'person-down', 'person-exclamation', 'person-fill', 'person-fill-add', 'person-fill-check', 'person-fill-dash', 'person-fill-down', 'person-fill-exclamation', 'person-fill-gear', 'person-fill-lock', 'person-fill-slash', 'person-fill-up', 'person-fill-x', 'person-gear', 'person-heart', 'person-hearts', 'person-lines-fill', 'person-lock', 'person-plus', 'person-plus-fill', 'person-raised-hand', 'person-rolodex', 'person-slash', 'person-square', 'person-standing', 'person-standing-dress', 'person-up', 'person-vcard', 'person-vcard-fill', 'person-video', 'person-video2', 'person-video3', 'person-walking', 'person-wheelchair', 'person-workspace', 'person-x', 'person-x-fill', 'phone', 'phone-fill', 'phone-flip', 'phone-landscape', 'phone-landscape-fill', 'phone-vibrate', 'phone-vibrate-fill', 'pie-chart', 'pie-chart-fill', 'piggy-bank', 'piggy-bank-fill', 'pin', 'pin-angle', 'pin-angle-fill', 'pin-fill', 'pin-map', 'pin-map-fill', 'pinterest', 'pip', 'pip-fill', 'play', 'play-btn', 'play-btn-fill', 'play-circle', 'play-circle-fill', 'play-fill', 'playstation', 'plug', 'plug-fill', 'plugin', 'plus', 'plus-circle', 'plus-circle-dotted', 'plus-circle-fill', 'plus-lg', 'plus-slash-minus', 'plus-square', 'plus-square-dotted', 'plus-square-fill', 'postage', 'postage-fill', 'postage-heart', 'postage-heart-fill', 'postcard', 'postcard-fill', 'postcard-heart', 'postcard-heart-fill', 'power', 'prescription', 'prescription2', 'printer', 'printer-fill', 'projector', 'projector-fill', 'puzzle', 'puzzle-fill', 'qr-code', 'qr-code-scan', 'question', 'question-circle', 'question-diamond', 'question-diamond-fill', 'question-circle-fill', 'question-lg', 'question-octagon', 'question-octagon-fill', 'question-square', 'question-square-fill', 'quora', 'quote', 'r-circle', 'r-circle-fill', 'r-square', 'r-square-fill', 'radar', 'radioactive', 'rainbow', 'receipt', 'receipt-cutoff', 'reception-0', 'reception-1', 'reception-2', 'reception-3', 'reception-4', 'record', 'record-btn', 'record-btn-fill', 'record-circle', 'record-circle-fill', 'record-fill', 'record2', 'record2-fill', 'recycle', 'reddit', 'regex', 'repeat', 'repeat-1', 'reply', 'reply-all', 'reply-all-fill', 'reply-fill', 'rewind', 'rewind-btn', 'rewind-btn-fill', 'rewind-circle', 'rewind-circle-fill', 'rewind-fill', 'robot', 'rocket', 'rocket-fill', 'rocket-takeoff', 'rocket-takeoff-fill', 'router', 'router-fill', 'rss', 'rss-fill', 'rulers', 'safe', 'safe-fill', 'safe2', 'safe2-fill', 'save', 'save-fill', 'save2', 'save2-fill', 'scissors', 'scooter', 'screwdriver', 'sd-card', 'sd-card-fill', 'search', 'search-heart', 'search-heart-fill', 'segmented-nav', 'send', 'send-arrow-down', 'send-arrow-down-fill', 'send-arrow-up', 'send-arrow-up-fill', 'send-check', 'send-check-fill', 'send-dash', 'send-dash-fill', 'send-exclamation', 'send-exclamation-fill', 'send-fill', 'send-plus', 'send-plus-fill', 'send-slash', 'send-slash-fill', 'send-x', 'send-x-fill', 'server', 'shadows', 'share', 'share-fill', 'shield', 'shield-check', 'shield-exclamation', 'shield-fill', 'shield-fill-check', 'shield-fill-exclamation', 'shield-fill-minus', 'shield-fill-plus', 'shield-fill-x', 'shield-lock', 'shield-lock-fill', 'shield-minus', 'shield-plus', 'shield-shaded', 'shield-slash', 'shield-slash-fill', 'shield-x', 'shift', 'shift-fill', 'shop', 'shop-window', 'shuffle', 'sign-dead-end', 'sign-dead-end-fill', 'sign-do-not-enter', 'sign-do-not-enter-fill', 'sign-intersection', 'sign-intersection-fill', 'sign-intersection-side', 'sign-intersection-side-fill', 'sign-intersection-t', 'sign-intersection-t-fill', 'sign-intersection-y', 'sign-intersection-y-fill', 'sign-merge-left', 'sign-merge-left-fill', 'sign-merge-right', 'sign-merge-right-fill', 'sign-no-left-turn', 'sign-no-left-turn-fill', 'sign-no-parking', 'sign-no-parking-fill', 'sign-no-right-turn', 'sign-no-right-turn-fill', 'sign-railroad', 'sign-railroad-fill', 'sign-stop', 'sign-stop-fill', 'sign-stop-lights', 'sign-stop-lights-fill', 'sign-turn-left', 'sign-turn-left-fill', 'sign-turn-right', 'sign-turn-right-fill', 'sign-turn-slight-left', 'sign-turn-slight-left-fill', 'sign-turn-slight-right', 'sign-turn-slight-right-fill', 'sign-yield', 'sign-yield-fill', 'signal', 'signpost', 'signpost-2', 'signpost-2-fill', 'signpost-fill', 'signpost-split', 'signpost-split-fill', 'sim', 'sim-fill', 'sim-slash', 'sim-slash-fill', 'sina-weibo', 'skip-backward', 'skip-backward-btn', 'skip-backward-btn-fill', 'skip-backward-circle', 'skip-backward-circle-fill', 'skip-backward-fill', 'skip-end', 'skip-end-btn', 'skip-end-btn-fill', 'skip-end-circle', 'skip-end-circle-fill', 'skip-end-fill', 'skip-forward', 'skip-forward-btn', 'skip-forward-btn-fill', 'skip-forward-circle', 'skip-forward-circle-fill', 'skip-forward-fill', 'skip-start', 'skip-start-btn', 'skip-start-btn-fill', 'skip-start-circle', 'skip-start-circle-fill', 'skip-start-fill', 'skype', 'slack', 'slash', 'slash-circle-fill', 'slash-lg', 'slash-square', 'slash-square-fill', 'sliders', 'sliders2', 'sliders2-vertical', 'smartwatch', 'snapchat', 'snow', 'snow2', 'snow3', 'sort-alpha-down', 'sort-alpha-down-alt', 'sort-alpha-up', 'sort-alpha-up-alt', 'sort-down', 'sort-down-alt', 'sort-numeric-down', 'sort-numeric-down-alt', 'sort-numeric-up', 'sort-numeric-up-alt', 'sort-up', 'sort-up-alt', 'soundwave', 'sourceforge', 'speaker', 'speaker-fill', 'speedometer', 'speedometer2', 'spellcheck', 'spotify', 'square', 'square-fill', 'square-half', 'stack', 'stack-overflow', 'star', 'star-fill', 'star-half', 'stars', 'steam', 'stickies', 'stickies-fill', 'sticky', 'sticky-fill', 'stop', 'stop-btn', 'stop-btn-fill', 'stop-circle', 'stop-circle-fill', 'stop-fill', 'stoplights', 'stoplights-fill', 'stopwatch', 'stopwatch-fill', 'strava', 'stripe', 'subscript', 'substack', 'subtract', 'suit-club', 'suit-club-fill', 'suit-diamond', 'suit-diamond-fill', 'suit-heart', 'suit-heart-fill', 'suit-spade', 'suit-spade-fill', 'suitcase', 'suitcase-fill', 'suitcase-lg', 'suitcase-lg-fill', 'suitcase2', 'suitcase2-fill', 'sun', 'sun-fill', 'sunglasses', 'sunrise', 'sunrise-fill', 'sunset', 'sunset-fill', 'superscript', 'symmetry-horizontal', 'symmetry-vertical', 'table', 'tablet', 'tablet-fill', 'tablet-landscape', 'tablet-landscape-fill', 'tag', 'tag-fill', 'tags', 'tags-fill', 'taxi-front', 'taxi-front-fill', 'telegram', 'telephone', 'telephone-fill', 'telephone-forward', 'telephone-forward-fill', 'telephone-inbound', 'telephone-inbound-fill', 'telephone-minus', 'telephone-minus-fill', 'telephone-outbound', 'telephone-outbound-fill', 'telephone-plus', 'telephone-plus-fill', 'telephone-x', 'telephone-x-fill', 'tencent-qq', 'terminal', 'terminal-dash', 'terminal-fill', 'terminal-plus', 'terminal-split', 'terminal-x', 'text-center', 'text-indent-left', 'text-indent-right', 'text-left', 'text-paragraph', 'text-right', 'text-wrap', 'textarea', 'textarea-resize', 'textarea-t', 'thermometer', 'thermometer-half', 'thermometer-high', 'thermometer-low', 'thermometer-snow', 'thermometer-sun', 'threads', 'threads-fill', 'three-dots', 'three-dots-vertical', 'thunderbolt', 'thunderbolt-fill', 'ticket', 'ticket-detailed', 'ticket-detailed-fill', 'ticket-fill', 'ticket-perforated', 'ticket-perforated-fill', 'tiktok', 'toggle-off', 'toggle-on', 'toggle2-off', 'toggle2-on', 'toggles', 'toggles2', 'tools', 'tornado', 'train-freight-front', 'train-freight-front-fill', 'train-front', 'train-front-fill', 'train-lightrail-front', 'train-lightrail-front-fill', 'translate', 'transparency', 'trash', 'trash-fill', 'trash2', 'trash2-fill', 'trash3', 'trash3-fill', 'tree', 'tree-fill', 'trello', 'triangle', 'triangle-fill', 'triangle-half', 'trophy', 'trophy-fill', 'tropical-storm', 'truck', 'truck-flatbed', 'truck-front', 'truck-front-fill', 'tsunami', 'tux', 'tv', 'tv-fill', 'twitch', 'twitter', 'twitter-x', 'type', 'type-bold', 'type-h1', 'type-h2', 'type-h3', 'type-h4', 'type-h5', 'type-h6', 'type-italic', 'type-strikethrough', 'type-underline', 'typescript', 'ubuntu', 'ui-checks', 'ui-checks-grid', 'ui-radios', 'ui-radios-grid', 'umbrella', 'umbrella-fill', 'unindent', 'union', 'unity', 'universal-access', 'universal-access-circle', 'unlock', 'unlock-fill', 'unlock2', 'unlock2-fill', 'upc', 'upc-scan', 'upload', 'usb', 'usb-c', 'usb-c-fill', 'usb-drive', 'usb-drive-fill', 'usb-fill', 'usb-micro', 'usb-micro-fill', 'usb-mini', 'usb-mini-fill', 'usb-plug', 'usb-plug-fill', 'usb-symbol', 'valentine', 'valentine2', 'vector-pen', 'view-list', 'view-stacked', 'vignette', 'vimeo', 'vinyl', 'vinyl-fill', 'virus', 'virus2', 'voicemail', 'volume-down', 'volume-down-fill', 'volume-mute', 'volume-mute-fill', 'volume-off', 'volume-off-fill', 'volume-up', 'volume-up-fill', 'vr', 'wallet', 'wallet-fill', 'wallet2', 'watch', 'water', 'webcam', 'webcam-fill', 'wechat', 'whatsapp', 'wifi', 'wifi-1', 'wifi-2', 'wifi-off', 'wikipedia', 'wind', 'window', 'window-dash', 'window-desktop', 'window-dock', 'window-fullscreen', 'window-plus', 'window-sidebar', 'window-split', 'window-stack', 'window-x', 'windows', 'wordpress', 'wrench', 'wrench-adjustable', 'wrench-adjustable-circle', 'wrench-adjustable-circle-fill', 'x', 'x-circle', 'x-circle-fill', 'x-diamond', 'x-diamond-fill', 'x-lg', 'x-octagon', 'x-octagon-fill', 'x-square', 'x-square-fill', 'xbox', 'yelp', 'yin-yang', 'youtube', 'zoom-in', 'zoom-out'];
const filteredIcons = ref([...iconList])

// 审批详情相关
const showApprovalModal = ref(false)
const selectedResource = ref(null)

// 批量删除相关
const selectedResources = ref([])
const selectAll = ref(false)
const showBatchDeleteModal = ref(false)
const batchDeleteLoading = ref(false)

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取所有已审批资源
const fetchResources = async () => {
  loading.value = true
  error.value = null
  
  try {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      console.log('No token found in fetchResources')
      router.push('/login')
      return
    }
    
    // 使用新的审批记录API端点
    console.log('Fetching approval records with auth token')
    const response = await axios.get('/api/resources/approval-records')
    
    // 处理响应中的审批记录数据
    resources.value = response.data.records || []
    console.log(`Fetched ${resources.value.length} approval records`)
  } catch (err) {
    console.error('获取审批记录失败:', err)
    if (err.response && err.response.status === 401) {
      error.value = '认证失败，请重新登录'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      error.value = '获取审批记录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

// 获取待审批资源
const fetchPendingResources = async () => {
  loadingPending.value = true
  
  try {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      console.log('No token found in fetchPendingResources')
      router.push('/login')
      return
    }
    
    console.log('Fetching pending resources with auth token')
    // 修复URL格式，移除尾部斜杠
    const response = await axios.get('/api/resources/pending')
    pendingResources.value = response.data
    console.log(`Fetched ${pendingResources.value.length} pending resources`)
  } catch (err) {
    console.error('获取待审批资源失败:', err)
    if (err.response && err.response.status === 401) {
      // 避免在这里显示错误，让主界面处理认证失败的情况
      console.log('Authentication failed when fetching pending resources')
      router.push('/login')
    }
  } finally {
    loadingPending.value = false
  }
}

// 审批资源
const approveResource = async (resourceId) => {
  approvalLoading.value = resourceId
  
  try {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    // 获取要审批的资源
    const resourceToApprove = pendingResources.value.find(r => r.id === resourceId);
    
    // 发送批准请求，同时将所有图片标记为已批准，并设置第一张图片为海报
    await axios.put(`/api/resources/${resourceId}/approve`, {
      status: 'approved',
      approved_images: resourceToApprove?.images || [], // 批准所有图片
      poster_image: resourceToApprove?.images?.length > 0 ? resourceToApprove.images[0] : null // 第一张图片作为海报
    })
    
    // 从待审批列表中移除
    pendingResources.value = pendingResources.value.filter(r => r.id !== resourceId)
    
    // 刷新已审批的资源列表
    await fetchResources()
  } catch (err) {
    console.error('审批资源失败:', err)
    error.value = '审批资源失败，请稍后重试'
  } finally {
    approvalLoading.value = null
  }
}

// 拒绝资源
const rejectResource = async (resourceId) => {
  approvalLoading.value = resourceId
  
  try {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    // 发送拒绝请求
    await axios.put(`/api/resources/${resourceId}/approve`, {
      status: 'rejected'
    })
    
    // 从待审批列表中移除
    pendingResources.value = pendingResources.value.filter(r => r.id !== resourceId)
    
    // 刷新已审批的资源列表
    await fetchResources()
  } catch (err) {
    console.error('拒绝资源失败:', err)
    error.value = '拒绝资源失败，请稍后重试'
  } finally {
    approvalLoading.value = null
  }
}

// 预览图片
const previewImages = (resource) => {
  previewImagesList.value = resource.supplement?.images || resource.images || [];
  showImagePreview.value = true
}

// 关闭图片预览
const closeImagePreview = () => {
  showImagePreview.value = false
  previewImagesList.value = []
  largeImageUrl.value = null // 确保关闭大图预览
}

// 打开大图预览
const openLargeImage = (imageUrl) => {
  largeImageUrl.value = imageUrl
}

// 关闭大图预览
const closeLargeImage = () => {
  largeImageUrl.value = null
}

// 修改密码
const changePassword = async () => {
  // 验证两次密码是否一致
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }
  
  passwordLoading.value = true
  passwordError.value = null
  passwordSuccess.value = false
  
  try {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    await axios.post('/api/auth/change-password', {
      current_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword
    })
    
    // 清空表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    // 显示成功消息
    passwordSuccess.value = true
    
    // 3秒后自动隐藏成功消息
    setTimeout(() => {
      passwordSuccess.value = false
    }, 3000)
    
  } catch (err) {
    console.error('修改密码失败:', err)
    if (err.response && err.response.status === 400) {
      passwordError.value = '当前密码不正确'
    } else {
      passwordError.value = '修改密码失败，请稍后重试'
    }
  } finally {
    passwordLoading.value = false
  }
}

// 确认删除
const confirmDelete = (resource) => {
  resourceToDelete.value = resource
  showDeleteModal.value = true
}

// 取消删除
const cancelDelete = () => {
  showDeleteModal.value = false
  resourceToDelete.value = null
}

// 从列表中删除记录（实际从数据库中删除记录，但不影响资源）
const removeResourceFromList = async () => {
  if (!resourceToDelete.value) return
  
  deleteLoading.value = true
  
  try {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    // 使用新的审批记录删除API
    await axios.delete(`/api/resources/${resourceToDelete.value.id}/record`)
    
    // 从前端列表中移除
    resources.value = resources.value.filter(r => r.id !== resourceToDelete.value.id)
    showDeleteModal.value = false
    resourceToDelete.value = null
  } catch (err) {
    console.error('删除审批记录失败:', err)
    error.value = '删除审批记录失败，请稍后重试'
  } finally {
    deleteLoading.value = false
  }
}

// 原删除资源函数保留但不再使用
const deleteResource = async () => {
  if (!resourceToDelete.value) return
  
  deleteLoading.value = true
  
  try {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    await axios.delete(`/api/resources/${resourceToDelete.value.id}`)
    resources.value = resources.value.filter(r => r.id !== resourceToDelete.value.id)
    showDeleteModal.value = false
    resourceToDelete.value = null
  } catch (err) {
    console.error('删除资源失败:', err)
    error.value = '删除资源失败，请稍后重试'
  } finally {
    deleteLoading.value = false
  }
}

// 显示审批详情
const showApprovalDetails = async (resource) => {
  try {
    // 获取资源的审批记录详情
    const response = await axios.get(`/api/resources/${resource.resource_id}/approval-records`)
    
    // 使用资源和审批记录
    selectedResource.value = {
      ...resource,
      records: response.data.records || []
    }
    
    showApprovalModal.value = true
    
    console.log('Approval records loaded:', selectedResource.value.records ? 
                selectedResource.value.records.length : 'none')
  } catch (err) {
    console.error('获取审批记录详情失败:', err)
    error.value = '获取审批记录详情失败，请稍后重试'
  }
}

// 关闭审批详情
const closeApprovalDetails = () => {
  showApprovalModal.value = false
  selectedResource.value = null
}

// 从描述中提取审批备注
const getApprovalNotes = (description) => {
  if (!description) return null
  
  // 尝试从描述中提取审批备注
  const notesMatch = description.match(/管理员审批意见: (.+)$/s)
  return notesMatch ? notesMatch[1] : null
}

// 获取图片文件名
const getImageFileName = (imagePath) => {
  if (!imagePath) return ''
  
  try {
    const parts = imagePath.split('/')
    return parts[parts.length - 1]
  } catch (error) {
    return imagePath
  }
}

// 获取链接分类显示名称
const getCategoryDisplayName = (category) => {
  const categoryDisplayNames = {
    "magnet": "磁力链接",
    "ed2k": "电驴(ed2k)",
    "uc": "UC网盘",
    "mobile": "移动云盘",
    "tianyi": "天翼云盘",
    "quark": "夸克网盘",
    "115": "115网盘",
    "aliyun": "阿里云盘",
    "pikpak": "PikPak",
    "baidu": "百度网盘",
    "123": "123网盘",
    "online": "在线观看",
    "others": "其他链接"
  }
  
  return categoryDisplayNames[category] || category
}

// 切换全选
const toggleAllSelection = () => {
  if (selectAll.value) {
    selectedResources.value = resources.value.map(r => r.id);
  } else {
    selectedResources.value = [];
  }
}

// 打开批量删除确认弹窗
const confirmBatchDelete = () => {
  if (selectedResources.value.length === 0) {
    return;
  }
  showBatchDeleteModal.value = true;
}

// 取消批量删除
const cancelBatchDelete = () => {
  showBatchDeleteModal.value = false;
}

// 批量删除资源记录
const batchDeleteResources = async () => {
  if (selectedResources.value.length === 0) {
    return;
  }
  
  batchDeleteLoading.value = true;
  
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    // 使用批量删除审批记录API
    await axios.delete('/api/resources/batch-delete-records', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {  // DELETE请求的请求体需要放在data字段中
        ids: selectedResources.value
      }
    });
    
    // 从前端列表中移除已删除的记录
    resources.value = resources.value.filter(r => !selectedResources.value.includes(r.id));
    
    // 重置选择状态
    selectedResources.value = [];
    selectAll.value = false;
    showBatchDeleteModal.value = false;
    
  } catch (err) {
    console.error('批量删除审批记录失败:', err);
    error.value = '批量删除审批记录失败，请稍后重试';
  } finally {
    batchDeleteLoading.value = false;
  }
}

// 加载页脚设置
const loadFooterSettings = async () => {
  try {
    // 使用InfoManager获取缓存的信息
    const infoManager = (await import('../utils/InfoManager')).default;
    footerSettings.value = await infoManager.getInfo();
    console.log('网站设置加载成功:', footerSettings.value);
    
    // 确保基本设置字段存在
    if (!footerSettings.value.title) footerSettings.value.title = '美漫资源共建';
    if (!footerSettings.value.logoText) footerSettings.value.logoText = '美漫资源共建';
    if (!footerSettings.value.description) footerSettings.value.description = '美漫共建平台是一个开源的美漫资源共享网站，用户可以自由提交动漫信息，像马赛克一样，由多方贡献拼凑成完整资源。';
    if (!footerSettings.value.keywords) footerSettings.value.keywords = '美漫, 动漫资源, 资源共享, 开源平台, 美漫共建';
    if (!footerSettings.value.routeMeta) footerSettings.value.routeMeta = {};
    
    // 如果存在favicon，显示预览
    if (footerSettings.value.favicon) {
      console.log('Found existing favicon:', footerSettings.value.favicon);
      // 这里不需要设置siteFaviconPreview，因为我们在模板中直接使用footerSettings.value.favicon
    }
    
    // 初始化About页面配置
    if (footerSettings.value.aboutPageConfig) {
      await initAboutPageConfig(footerSettings.value.aboutPageConfig);
    } else {
      // 如果不存在配置，初始化为默认值
      await initAboutPageConfig({});
    }
    
    // 初始化图标显示名称
    updateIconDisplay();
    
    // 初始化当前页面Meta信息
    selectPage();
  } catch (error) {
    console.error('获取网站设置失败:', error);
    // 使用默认设置
    footerSettings.value = {
      title: '美漫资源共建',
      logoText: '美漫资源共建',
      description: '美漫共建平台是一个开源的美漫资源共享网站，用户可以自由提交动漫信息，像马赛克一样，由多方贡献拼凑成完整资源。',
      keywords: '美漫, 动漫资源, 资源共享, 开源平台, 美漫共建',
      links: [
        { id: 1, text: "关于我们", url: "/about", type: "internal" },
        { id: 2, text: "Telegram", url: "https://t.me/xueximeng", icon: "bi bi-telegram", type: "external", title: "加入Telegram群组" },
        { id: 3, text: "GitHub", url: "https://github.com/fish2018/GoComicMosaic", icon: "bi bi-github", type: "external", title: "查看GitHub源码" },
        { id: 4, text: "在线点播", url: "/streams", type: "internal" },
        { id: 5, text: "漫迪小站", url: "https://mdsub.top/", type: "external" },
        { id: 6, text: "三次元成瘾者康复中心", url: "https://www.kangfuzhongx.in/", type: "external" },
      ],
      copyright: "© 2025 美漫资源共建. 保留所有权利",
      show_visitor_count: true
    };
    
    // 初始化默认的About页面配置
    await initAboutPageConfig({});
    
    // 初始化图标显示名称
    updateIconDisplay();
  }
};

// 统一保存所有设置
const saveAllSettings = async () => {
  settingsLoading.value = true;
  aboutSettingsLoading.value = true;
  settingsError.value = null;
  settingsSuccess.value = false;
  aboutSettingsSuccess.value = false;
  
  try {
    // 获取令牌并验证
    const token = localStorage.getItem('accessToken');
    if (!token) {
      settingsError.value = '您的登录已过期，请重新登录';
      console.error('保存设置失败: 未找到认证令牌');
      return;
    }
    
    // 获取当前的网站信息
    const siteInfo = await infoManager.getInfo();
    
    // 记录原始favicon值，确保在后续处理中不会丢失
    const originalFavicon = siteInfo.favicon;
    console.log('原始favicon值:', originalFavicon);
    
    // 处理Favicon上传
    if (siteFaviconFile.value) {
      try {
        const formData = new FormData();
        formData.append('favicon', siteFaviconFile.value);
        
        // 上传favicon
        const response = await axios.post('/api/admin/upload/favicon', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.faviconPath) {
          // 更新设置中的favicon路径
          footerSettings.value.favicon = response.data.faviconPath;
          console.log('Favicon上传成功:', response.data.faviconPath);
        }
      } catch (err) {
        console.error('上传Favicon失败:', err);
        settingsError.value = '上传图标失败，但其他设置仍将保存';
      }
    } else {
      // 没有新上传的图标，保留原有的favicon
      // 注意：我们不再依赖siteFaviconPreview.value作为判断依据
      footerSettings.value.favicon = originalFavicon;
      console.log('保留原始favicon:', originalFavicon);
    }
    
    // 更新About页面配置
    siteInfo.aboutPageConfig = JSON.parse(JSON.stringify(aboutPageConfig));
    
    // 更新所有页脚设置和其他设置
    // 使用解构赋值而不是Object.assign以避免覆盖其他重要属性
    siteInfo.title = footerSettings.value.title;
    siteInfo.logoText = footerSettings.value.logoText;
    siteInfo.description = footerSettings.value.description;
    siteInfo.keywords = footerSettings.value.keywords;
    siteInfo.links = footerSettings.value.links;
    siteInfo.copyright = footerSettings.value.copyright;
    siteInfo.show_visitor_count = footerSettings.value.show_visitor_count;
    siteInfo.favicon = footerSettings.value.favicon; // 使用上面处理后的favicon值
    siteInfo.routeMeta = footerSettings.value.routeMeta;
    
    console.log('保存前的favicon值:', siteInfo.favicon);
    
    // 保存更新后的网站信息
    await infoManager.updateInfo(siteInfo);
    
    // 清理和显示成功消息
    siteFaviconFile.value = null;
    siteFaviconPreview.value = '';
    settingsSuccess.value = true;
    aboutSettingsSuccess.value = true;
    
    // 设置成功消息显示时间
    setTimeout(() => {
      settingsSuccess.value = false;
      aboutSettingsSuccess.value = false;
    }, 3000);
    
    // 设置一个短暂的延迟后刷新页面，确保用户能看到成功消息
    setTimeout(() => {
      console.log('设置保存成功，刷新页面...');
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('保存设置失败:', error);
    
    if (error.response && error.response.status === 401) {
      settingsError.value = '认证失败，请刷新页面或重新登录';
    } else {
      settingsError.value = '保存设置失败，请稍后重试';
    }
  } finally {
    settingsLoading.value = false;
    aboutSettingsLoading.value = false;
  }
};

// 添加新链接
const addNewLink = () => {
  if (!footerSettings.value.links) {
    footerSettings.value.links = [];
  }
  
  const newIndex = footerSettings.value.links.length;
  const newId = Date.now() + Math.floor(Math.random() * 1000);
  
  // 为每个链接添加唯一ID，用于拖拽排序（注意：移除了type字段）
  footerSettings.value.links.push({
    id: newId,
    text: '',
    url: '',
    icon: '',
    title: ''
  });
  
  // 初始化图标显示名称
  iconDisplay.value[newIndex] = '';
};

// 移除链接
const removeLink = (index) => {
  if (footerSettings.value.links && index >= 0 && index < footerSettings.value.links.length) {
    footerSettings.value.links.splice(index, 1);
  }
};

// 获取图标的简化名称（不带bi bi-前缀）
const getIconName = (iconClass) => {
  if (!iconClass) return '';
  return iconClass.replace('bi bi-', '');
};

// 打开图标选择器
const openIconSelector = (index) => {
  // 当处理页脚链接图标时
  if (iconSelectorTarget.value === '' || iconSelectorTarget.value === 'footer') {
    currentLinkIndex.value = index;
    currentIcon.value = getIconName(footerSettings.value.links[index]?.icon || '');
  }
  // 其他类型的图标选择器（About页面设置）不需要在这里设置currentIcon，
  // 因为它们已经在各自的函数中设置了

  iconSearch.value = '';
  filteredIcons.value = [...iconList];
  showIconSelector.value = true;
  
  // 只有在处理页脚链接时才更新图标显示名称
  if (iconSelectorTarget.value === '' || iconSelectorTarget.value === 'footer') {
    updateIconDisplay();
  }
};

// 关闭图标选择器
const closeIconSelector = () => {
  showIconSelector.value = false;
  currentLinkIndex.value = -1;
};

// 选择图标
const selectIcon = (icon) => {
  // 页脚链接图标处理
  if (currentLinkIndex.value !== -1) {
    footerSettings.value.links[currentLinkIndex.value].icon = `bi bi-${icon}`;
    iconDisplay.value[currentLinkIndex.value] = icon; // 更新显示名称
    closeIconSelector();
    return;
  }
  
  // About页面图标处理
  if (iconSelectorTarget.value === 'intro') {
    aboutPageConfig.siteIntro.icon = icon;
  } else if (iconSelectorTarget.value === 'feature' && iconSelectorIndex.value >= 0) {
    aboutPageConfig.featureItems[iconSelectorIndex.value].icon = icon;
  } else if (iconSelectorTarget.value === 'contactSection') {
    aboutPageConfig.contactSection.icon = icon;
  } else if (iconSelectorTarget.value === 'contactItem' && iconSelectorIndex.value >= 0) {
    aboutPageConfig.contactItems[iconSelectorIndex.value].icon = icon;
  }
  
  closeIconSelector();
};

// 清除图标
const clearIcon = (index) => {
  if (index >= 0 && index < footerSettings.value.links.length) {
    footerSettings.value.links[index].icon = '';
    iconDisplay.value[index] = '';
  }
};

// 更新所有图标的显示名称
const updateIconDisplay = () => {
  footerSettings.value.links.forEach((link, index) => {
    iconDisplay.value[index] = getIconName(link.icon);
  });
};

// 过滤图标
const filterIcons = () => {
  const search = iconSearch.value.toLowerCase();
  if (!search) {
    filteredIcons.value = [...iconList];
  } else {
    filteredIcons.value = iconList.filter(icon => 
      icon.toLowerCase().includes(search)
    );
  }
};

// 拖拽排序结束
const onDragEnd = () => {
  console.log('链接排序已更新');
};

onMounted(async () => {
  console.log('Admin component mounted')
  
  // 调试打印当前认证状态
  const authStatus = debugAuth()
  
  // 检查本地存储中的token和用户信息
  if (!authStatus.isAuthenticated) {
    console.error('No valid authentication found, redirecting to login')
    router.push('/login')
    return
  }
  
  if (!authStatus.isAdmin) {
    console.error('User is not an admin, redirecting to home')
    router.push('/')
    return
  }
  
  // 并行加载资源列表和页脚设置
  loading.value = true
  loadingPending.value = true
  error.value = null
  
  try {
    console.log('Starting to fetch resources and pending resources')
    const resourcesPromise = fetchResources()
    const pendingResourcesPromise = fetchPendingResources()
    const footerSettingsPromise = loadFooterSettings()
    
    const results = await Promise.allSettled([resourcesPromise, pendingResourcesPromise, footerSettingsPromise])
    
    console.log('Fetch results:', results.map(r => r.status))
    
    // 检查是否有任何请求失败
    const anyFailed = results.some(result => result.status === 'rejected')
    if (anyFailed) {
      console.warn('Some requests failed, check the error logs above')
      
      // 获取失败的原因
      const failures = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason?.response?.status || 'Unknown error')
      
      console.error('Request failures:', failures)
      
      // 如果有401错误，认证可能有问题
      if (failures.includes(401)) {
        error.value = '认证失败，请重新登录'
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        error.value = '部分数据加载失败，请刷新页面重试'
      }
    }
  } catch (e) {
    console.error('Error during Admin initialization:', e)
    error.value = '初始化失败，请稍后重试'
  } finally {
    loading.value = false
    loadingPending.value = false
  }
})

// 页面Meta信息设置
const selectedPage = ref('home')
const currentPageMeta = reactive({
  title: '',
  description: '',
  keywords: ''
})

// 默认页面Meta信息
const defaultPageMetaInfo = {
  home: {
    title: '美漫资源共建 - 动漫爱好者共同贡献的资源平台',
    description: '美漫共建平台是一个开源的美漫资源共享网站，用户可以自由提交动漫信息，像马赛克一样，由多方贡献拼凑成完整资源。',
    keywords: '美漫, 动漫资源, 资源共享, 开源平台, 美漫共建'
  },
  resource_detail: {
    title: '资源详情 - 美漫资源共建平台',
    description: '查看详细的动漫资源信息，包括简介、图片、下载链接等。在这里您可以浏览由社区贡献的美漫资源详情。',
    keywords: '美漫资源, 动漫详情, 资源下载, 美漫共建'
  },
  submit_resource: {
    title: '提交资源 - 美漫资源共建平台',
    description: '在这里提交您收集的美漫资源，包括标题、简介、链接等信息，与社区共同构建完整的资源库。',
    keywords: '提交资源, 分享美漫, 资源贡献, 美漫共建'
  },
  login: {
    title: '用户登录 - 美漫资源共建平台',
    description: '登录美漫资源共建平台，管理您的资源贡献并参与社区建设。',
    keywords: '用户登录, 账号登录, 美漫共建'
  },
  admin: {
    title: '管理后台 - 美漫资源共建平台',
    description: '美漫资源共建平台管理后台，用于管理用户提交的资源和维护网站内容。',
    keywords: '管理后台, 资源审核, 美漫共建'
  },
  resource_review: {
    title: '资源审核 - 美漫资源共建平台',
    description: '审核用户提交的美漫资源，确保内容质量和合规性。',
    keywords: '资源审核, 内容审核, 美漫共建'
  },
  about: {
    title: '关于我们 - 美漫资源共建平台',
    description: '了解美漫资源共建平台的宗旨、团队和发展历程。我们致力于为动漫爱好者提供优质的资源共享环境。',
    keywords: '关于我们, 平台介绍, 团队介绍, 美漫共建'
  },
  streams: {
    title: '流媒体内容 - 美漫资源共建平台',
    description: '浏览和观看各种高质量的动漫流媒体内容，包括动画、电影和连续剧。',
    keywords: '流媒体内容, 动漫视频, 在线观看, 美漫共建'
  }
}

// 获取默认页面Meta信息
const getDefaultPageMeta = (page) => {
  return defaultPageMetaInfo[page] || defaultPageMetaInfo.home
}

// 选择页面时更新当前页面Meta信息
const selectPage = () => {
  // 如果页面之前没有自定义设置，则使用空值
  if (!footerSettings.value.routeMeta) {
    footerSettings.value.routeMeta = {}
  }
  
  const pageTitleKey = `${selectedPage.value}_title`
  const pageDescKey = `${selectedPage.value}_description`
  const pageKeywordsKey = `${selectedPage.value}_keywords`
  
  // 从已有设置中获取值，或者使用空字符串
  currentPageMeta.title = footerSettings.value.routeMeta[pageTitleKey] || ''
  currentPageMeta.description = footerSettings.value.routeMeta[pageDescKey] || ''
  currentPageMeta.keywords = footerSettings.value.routeMeta[pageKeywordsKey] || ''
}

// 监听currentPageMeta变化，更新footerSettings
const updateCurrentPageMeta = () => {
  if (!footerSettings.value.routeMeta) {
    footerSettings.value.routeMeta = {}
  }
  
  const pageTitleKey = `${selectedPage.value}_title`
  const pageDescKey = `${selectedPage.value}_description`
  const pageKeywordsKey = `${selectedPage.value}_keywords`
  
  // 只有当值不为空时才设置，否则删除属性以使用默认值
  if (currentPageMeta.title) {
    footerSettings.value.routeMeta[pageTitleKey] = currentPageMeta.title
  } else {
    delete footerSettings.value.routeMeta[pageTitleKey]
  }
  
  if (currentPageMeta.description) {
    footerSettings.value.routeMeta[pageDescKey] = currentPageMeta.description
  } else {
    delete footerSettings.value.routeMeta[pageDescKey]
  }
  
  if (currentPageMeta.keywords) {
    footerSettings.value.routeMeta[pageKeywordsKey] = currentPageMeta.keywords
  } else {
    delete footerSettings.value.routeMeta[pageKeywordsKey]
  }
}

// 监听currentPageMeta变化
watch(currentPageMeta, () => {
  updateCurrentPageMeta()
}, { deep: true })

// 页脚设置加载后初始化当前页面Meta信息
watch(footerSettings, () => {
  selectPage()
}, { immediate: true })

// Favicon上传功能变量
const siteFaviconPreview = ref('');
const siteFaviconFile = ref(null);
const faviconUploadRef = ref(null);

// 处理图标上传
const handleFaviconUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // 检查文件扩展名，而不是MIME类型
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.svg'];
  const isValid = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!isValid) {
    alert('请上传.ico、.png、.jpg或.svg格式的图标');
    return;
  }
  
  // 检查文件大小（限制为1MB）
  if (file.size > 1024 * 1024) {
    alert('图标文件大小不能超过1MB');
    return;
  }
  
  // 生成预览
  siteFaviconFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    siteFaviconPreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

// 清除已上传的图标
const clearFaviconUpload = (event) => {
  // 阻止事件冒泡和默认行为
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  console.log('清除favicon触发');
  siteFaviconPreview.value = '';
  siteFaviconFile.value = null;
  if (faviconUploadRef.value) {
    faviconUploadRef.value.value = '';
  }
};

// 触发文件输入控件
const triggerFileInput = () => {
  if (faviconUploadRef.value) {
    faviconUploadRef.value.click();
  }
};

// About页面设置
const aboutPageConfig = reactive({
  siteIntro: {
    title: '',
    description: '',
    icon: ''
  },
  featureItems: [],
  contactSection: {
    title: '',
    description: '',
    icon: ''
  },
  contactItems: []
});

const aboutSettingsLoading = ref(false);
const aboutSettingsSuccess = ref(false);

// 初始化About页面配置
const initAboutPageConfig = async (config) => {
  // 确保所有必要的嵌套对象都存在
  aboutPageConfig.siteIntro = config.siteIntro || {
    title: '本站介绍',
    description: '欢迎来到美漫资源共建平台，我们致力于为美漫爱好者提供一个便捷、高效、安全的资源分享平台。',
    icon: 'collection-fill'
  };
  aboutPageConfig.featureItems = config.featureItems || [];
  aboutPageConfig.contactSection = config.contactSection || {
    title: '联系我们',
    description: '如有任何问题、建议或合作意向，欢迎通过以下方式联系我们。我们非常重视每一位用户的反馈。',
    icon: 'chat-text-fill'
  };
  aboutPageConfig.contactItems = config.contactItems || [];
  
  // 确保featureItems和contactItems有唯一ID
  aboutPageConfig.featureItems.forEach((item, index) => {
    if (!item.id) item.id = Date.now() + index;
  });
  
  aboutPageConfig.contactItems.forEach((item, index) => {
    if (!item.id) item.id = Date.now() + index + 1000;
  });
};

// 添加新特性项
const addNewFeatureItem = () => {
  const newId = Date.now();
  aboutPageConfig.featureItems.push({
    id: newId,
    title: '',
    description: '',
    icon: ''
  });
};

// 删除特性项
const removeFeatureItem = (index) => {
  // aboutPageConfig.featureItems.splice(index, 1);
  if (confirm('删除会立刻执行，确定要删除这个特性项吗？')) {
    aboutPageConfig.featureItems.splice(index, 1);
  }
};

// 添加新联系方式
const addNewContactItem = () => {
  const newId = Date.now();
  aboutPageConfig.contactItems.push({
    id: newId,
    text: '',
    icon: ''
  });
};

// 删除联系方式
const removeContactItem = (index) => {
  // aboutPageConfig.contactItems.splice(index, 1);
  if (confirm('删除会立刻执行，确定要删除这个联系方式吗？')) {
    aboutPageConfig.contactItems.splice(index, 1);
  }
};

// 打开介绍部分图标选择器
const openIntroIconSelector = () => {
  iconSelectorTarget.value = 'intro';
  currentIcon.value = aboutPageConfig.siteIntro.icon;
  openIconSelector();
};

// 打开特性项图标选择器
const openFeatureIconSelector = (index) => {
  iconSelectorTarget.value = 'feature';
  iconSelectorIndex.value = index;
  currentIcon.value = aboutPageConfig.featureItems[index].icon;
  openIconSelector();
};

// 清除特性项图标
const clearFeatureIcon = (index) => {
  aboutPageConfig.featureItems[index].icon = '';
};

// 打开联系部分图标选择器
const openContactSectionIconSelector = () => {
  iconSelectorTarget.value = 'contactSection';
  currentIcon.value = aboutPageConfig.contactSection.icon;
  openIconSelector();
};

// 打开联系方式图标选择器
const openContactItemIconSelector = (index) => {
  iconSelectorTarget.value = 'contactItem';
  iconSelectorIndex.value = index;
  currentIcon.value = aboutPageConfig.contactItems[index].icon;
  openIconSelector();
};

// 清除联系方式图标
const clearContactItemIcon = (index) => {
  aboutPageConfig.contactItems[index].icon = '';
};

// 保存About页面设置
// const saveAboutPageSettings = async () => {
//   aboutSettingsLoading.value = true;
//   aboutSettingsSuccess.value = false;
  
//   try {
//     // 获取当前的网站信息
//     const siteInfo = await infoManager.getInfo();
    
//     // 更新About页面配置
//     siteInfo.aboutPageConfig = JSON.parse(JSON.stringify(aboutPageConfig));
    
//     // 保存更新后的网站信息
//     await infoManager.updateInfo(siteInfo);
    
//     // 显示成功消息
//     aboutSettingsSuccess.value = true;
    
//     // 3秒后隐藏成功消息
//     setTimeout(() => {
//       aboutSettingsSuccess.value = false;
//     }, 3000);
//   } catch (error) {
//     console.error('保存About页面设置失败:', error);
//     alert('保存失败，请稍后重试');
//   } finally {
//     aboutSettingsLoading.value = false;
//   }
// };

// 打开页脚链接图标选择器
const openFooterIconSelector = (index) => {
  iconSelectorTarget.value = 'footer';
  currentLinkIndex.value = index;
  currentIcon.value = getIconName(footerSettings.value.links[index]?.icon || '');
  openIconSelector(index);
}
</script>

<style scoped>
/* 整体布局 */
.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 英雄区域 */
.admin-hero {
  text-align: center;
  padding: 3rem 0;
  margin-bottom: 2rem;
  animation: fadeIn 0.8s ease-out;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  letter-spacing: -1px;
  text-shadow: 
    3px 3px 0 rgba(99, 102, 241, 0.2),
    6px 6px 10px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--gray-color);
  font-weight: 500;
}

/* 管理卡片 */
.admin-card {
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--card-radius);
  box-shadow: 
    0 10px 20px rgba(0, 0, 0, 0.08),
    inset 0 -2px 6px rgba(255, 255, 255, 0.7),
    inset 2px 2px 6px rgba(255, 255, 255, 1);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.admin-card:hover {
  transform: translateY(-5px);
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.1),
    inset 0 -2px 6px rgba(255, 255, 255, 0.7),
    inset 2px 2px 6px rgba(255, 255, 255, 1);
}

/* 卡片头部 */
.card-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  background: linear-gradient(to right, rgba(99, 102, 241, 0.03), rgba(124, 58, 237, 0.08));
}

.card-header h4 {
  margin: 0;
  color: var(--dark-color);
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-header h4 i {
  font-size: 1.2rem;
  color: var(--primary-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.badge-count {
  background: var(--accent-gradient);
  color: white;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 100px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.badge-inline {
  margin-left: 8px;
  display: inline-flex;
}

.refresh-btn, .toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* 卡片内容 */
.card-body {
  padding: 1.5rem;
}

/* 表单样式 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--dark-color);
}

.input-group {
  display: flex;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--border-radius);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
}

.input-group:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  background: rgba(255, 255, 255, 0.9);
}

.input-prefix {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  background-color: rgba(99, 102, 241, 0.05);
  color: var(--primary-color);
  border-right: 1px solid rgba(99, 102, 241, 0.1);
}

.input-prefix i {
  font-size: 1.2rem;
}

.custom-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  outline: none;
  background: transparent;
  color: var(--dark-color);
}

/* 消息样式 */
.error-message, .success-message {
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.error-message {
  background: rgba(244, 63, 94, 0.1);
  color: var(--accent-color);
}

.success-message {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.error-message i, .success-message i {
  font-size: 1.2rem;
}

/* 加载器 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 0;
}

.loader {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(99, 102, 241, 0.1);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
  box-shadow: 0 5px 15px rgba(99, 102, 241, 0.15);
}

.small-spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin-right: 0;
}

.loading-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: var(--gray-color);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--gray-color);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0;
}

/* 表格样式 */
.table-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;  /* 添加垂直滚动功能 */
  max-height: 600px; /* 设置最大高度以触发滚动条 */
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.5);
  padding: 0;
  position: relative;
}

/* 固定表头样式 */
.custom-table {
  display: table;
  min-width: 800px;
  width: 100%;
  white-space: nowrap;
  table-layout: fixed;
  border-collapse: separate; /* 设置为separate以支持固定表头 */
  border-spacing: 0; /* 移除边框间距 */
}

.custom-table thead {
  position: sticky; /* 设置表头为粘性定位 */
  top: 0;          /* 固定在容器顶部 */
  z-index: 1;       /* 确保表头在内容上层 */
  background: rgba(255, 255, 255, 0.95); /* 确保表头背景不透明 */
}

.custom-table th {
  background: rgba(99, 102, 241, 0.05);
  font-weight: 600;
  color: var(--dark-color);
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  position: sticky; /* 确保每个th元素也保持粘性定位 */
  top: 0;          /* 固定在容器顶部 */
  z-index: 2;      /* 确保高于tbody内容 */
}

.custom-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(99, 102, 241, 0.05);
  color: var(--gray-color);
}

.custom-table tr:last-child td {
  border-bottom: none;
}

.custom-table tr:hover td {
  background: rgba(255, 255, 255, 0.8);
}

.id-badge {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
  padding: 0.2rem 0.5rem;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.9rem;
}

.type-badge {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  padding: 0.2rem 0.75rem;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}

.badge-supplement {
  background-color: #f59e0b;
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

.badge-initial {
  background-color: #6366f1;
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

.status-badge {
  padding: 0.2rem 0.75rem;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-approved {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.status-rejected {
  background: rgba(244, 63, 94, 0.1);
  color: var(--accent-color);
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.view-images-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

/* 自定义复选框 */
.checkbox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-wrapper label {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid rgba(99, 102, 241, 0.3);
  background-color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.custom-checkbox:checked + label {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.custom-checkbox:checked + label::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-wrapper:hover label {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

/* 表单操作 */
.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

/* 按钮样式 */
.btn-custom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--border-radius);
  border: none;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.btn-custom::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.btn-custom:hover::before {
  left: 100%;
}

.btn-custom:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.7);
  color: var(--primary-color);
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.btn-accent {
  background: var(--accent-gradient);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 63, 94, 0.2);
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-custom:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

/* 模态框样式 */
.custom-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
  animation: fadeIn 0.3s ease;
  padding-top: 5vh;
}

.modal-dialog {
  width: 100%;
  max-width: 800px;
  animation: slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  margin: 2rem 0;
  max-height: 90vh;
  overflow-y: auto;
}

.small-dialog {
  max-width: 500px;
}

.large-dialog {
  max-width: 1000px;
}

.modal-content {
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--card-radius);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  background: linear-gradient(to right, rgba(99, 102, 241, 0.05), rgba(124, 58, 237, 0.1));
}

.modal-title {
  margin: 0;
  color: var(--dark-color);
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-title i {
  color: var(--primary-color);
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(99, 102, 241, 0.1);
  color: var(--gray-color);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(244, 63, 94, 0.1);
  color: var(--accent-color);
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
  background: rgba(99, 102, 241, 0.02);
}

/* 审批详情样式 */
.detail-section {
  margin-bottom: 1.5rem;
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.05);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.detail-section:hover {
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.detail-title {
  padding: 1rem;
  margin: 0;
  font-weight: 600;
  background: rgba(99, 102, 241, 0.05);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(99, 102, 241, 0.05);
}

.detail-title i {
  color: var(--primary-color);
}

/* 新增: 统一内容区域样式 */
.detail-content {
  padding: 1rem;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.detail-column {
  padding: 1rem;
}

.detail-item {
  display: flex;
  margin-bottom: 0.75rem;
  align-items: flex-start;
  line-height: 1.5;
}

.detail-label {
  font-weight: 600;
  color: var(--gray-color);
  min-width: 100px;
  padding-right: 1rem;
}

.detail-value {
  color: var(--dark-color);
  flex: 1;
  word-break: break-word;
}

.detail-note {
  padding: 1rem;
  color: var(--dark-color);
  white-space: pre-wrap;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.5);
}

.resource-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.resource-link:hover {
  text-decoration: underline;
}

.image-count {
  font-size: 0.9rem;
  color: var(--gray-color);
  font-weight: 400;
}

.images-grid {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.image-preview-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-preview-item:hover {
  transform: translateY(-5px) scale(1.02);
}

.image-card {
  position: relative;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  aspect-ratio: 1 / 1;
}

.image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.image-card:hover img {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  display: flex;
  justify-content: center;
}

.poster-badge {
  background: rgba(244, 63, 94, 0.9);
  color: white;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 100px;
  font-weight: 600;
}

.empty-images {
  padding: 2rem;
  text-align: center;
  color: var(--gray-color);
  grid-column: 1 / -1;
}

.empty-images i {
  font-size: 2.5rem;
  opacity: 0.6;
  margin-bottom: 0.75rem;
}

/* 链接区域样式 */
.links-container {
  padding: 1rem;
}

.link-category {
  margin-bottom: 1.5rem;
}

.category-name {
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
}

.links-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--border-radius);
  margin-bottom: 0.5rem;
}

.link-item i {
  color: var(--primary-color);
}

.link-url {
  flex: 1;
  word-break: break-all;
}

.link-password {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
  padding: 0.2rem 0.5rem;
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

/* 确认对话框特有样式 */
.confirm-message {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: var(--dark-color);
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(6, 182, 212, 0.1);
  color: var(--secondary-color);
  border-radius: var(--border-radius);
}

.info-box i {
  font-size: 1.1rem;
  margin-top: 0.2rem;
}

/* 图片预览模态框特有样式 */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.preview-item {
  aspect-ratio: 1/1;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  cursor: zoom-in;
  transition: all 0.3s ease;
}

.preview-item:hover {
  transform: scale(1.05);
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 新的大图预览样式 - 与ResourceDetail.vue保持一致 */
.modal-image-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  animation: zoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.preview-large-image {
  max-width: 100%;
  max-height: 90vh;
  border-radius: var(--card-radius);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  border: 3px solid rgba(255, 255, 255, 0.8);
}

.image-close-btn {
  position: absolute;
  top: -15px;
  right: -15px;
  background: white;
  color: var(--dark-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  z-index: 10;
  opacity: 0.8;
  transition: all 0.3s ease;
  border: none;
}

.image-close-btn:hover {
  opacity: 1;
  transform: rotate(90deg);
}

/* 删除旧的大图预览样式 */
.large-image-overlay,
.large-image-container,
.large-image,
.close-large-img {
  /* 这些旧样式将被移除，由新样式替代 */
}

/* 新增动画效果 */
@keyframes zoomIn {
  from { 
    opacity: 0;
    transform: scale(0.9); 
  }
  to { 
    opacity: 1;
    transform: scale(1); 
  }
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式样式优化 */
@media (max-width: 992px) {
  .admin-container {
    padding: 1rem;
  }
  
  .admin-hero {
    padding: 1.5rem;
  }
  
  .hero-title {
    font-size: 1.8rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .admin-card {
    margin-bottom: 1.5rem;
  }
  
  .card-header {
    flex-direction: row;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
    flex-wrap: nowrap;
  }
  
  .header-actions {
    width: auto;
    display: flex;
    justify-content: flex-end;
  }
  
  .header-left {
    width: auto;
    justify-content: flex-start;
  }
  
  .admin-content {
    grid-template-columns: 1fr;
  }
}

/* @media (max-width: 768px) { */
@media (max-width: 1200px) {
  /* 移动端基础样式 */
  .admin-container {
    padding: 0 0.5rem;
  }
  
  .admin-hero {
    padding: 2rem 0;
    margin-bottom: 1.5rem;
  }
  
  .hero-title {
    font-size: 1.8rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .card-header {
    padding: 1rem;
    flex-wrap: nowrap; /* 强制不换行 */
    gap: 10px;
    justify-content: space-between;
  }
  
  .card-header h4 {
    font-size: 1.1rem;
    max-width: 80%; /* 进一步增加宽度确保文字显示完整 */
    overflow: visible; /* 确保文字不会被截断 */
    white-space: nowrap; /* 不允许文字换行，保持在一行 */
    text-overflow: ellipsis; /* 超出部分显示省略号 */
  }
  
  .header-left h4 {
    display: flex;
    align-items: center;
    flex-wrap: nowrap; /* 不允许换行 */
    gap: 0.25rem; /* 减小图标和文字间的间距 */
  }
  
  .header-left h4 i {
    margin-right: 0.25rem; /* 减少图标右侧边距 */
  }
  
  .card-body {
    padding: 1rem;
  }
  
  /* 表格样式 - 增强横向显示 */
  .custom-table {
    min-width: 1000px !important;
    width: 100% !important;
    white-space: nowrap !important;
    border-collapse: collapse !important;
  }
  
  .table-container {
    margin: 0 -1rem !important;
    width: calc(100% + 2rem) !important;
    overflow-x: auto !important;
    padding: 0 0.5rem !important;
  }
  
  .custom-table td, 
  .custom-table th {
    padding: 0.75rem 0.5rem;
  }
  
  /* 按钮布局优化 */
  .header-actions {
    margin-left: auto;
    white-space: nowrap;
  }
  
  /* 优化按钮在移动端的布局 */
  .btn-custom.btn-sm {
    padding: 0.4rem;
    font-size: 0.8rem;
    min-width: 36px;
    height: 36px;
    justify-content: center;
  }
  
  /* 改善下拉菜单在移动端的可用性 */
  .dropdown-menu {
    min-width: 200px;
  }
  
  /* 改善模态框在移动端的显示 */
  .custom-modal .modal-dialog {
    width: 95%;
    max-width: none;
  }
  
  /* 修改表单在移动端的布局 */
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  /* 修改密码按钮样式优化 */
  .form-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .form-actions button {
    width: auto;
    border-radius: 50%;
    min-width: 38px;
    height: 38px;
    padding: 0.5rem;
  }
  
  /* 移动端按钮仅显示图标，不显示文字 */
  .btn-text {
    display: none;
  }
  
  .btn-custom {
    padding: 0.5rem;
    min-width: 38px;
    height: 38px;
    justify-content: center;
  }
  
  .btn-custom i {
    font-size: 1.1rem;
    margin-right: 0;
  }
  
  /* 确保带有徽章的按钮能正常显示 */
  .btn-custom .badge-count {
    display: inline-flex;
    position: absolute;
    top: -8px;
    right: -8px;
    min-width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 0.75rem;
    align-items: center;
    justify-content: center;
  }
  
  /* 特殊处理某些需要文本的按钮 */
  .close-btn .btn-text,
  .confirmation-btn .btn-text {
    display: inline-block;
  }
  
  /* 批量删除按钮需要更多空间 */
  .btn-custom.btn-accent.btn-sm {
    position: relative;
    min-width: 38px;
    padding: 0.4rem;
  }
}

@media (max-width: 576px) {
  .admin-hero {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .hero-title {
    font-size: 1.4rem;
  }
  
  .hero-subtitle {
    font-size: 0.9rem;
  }
  
  .admin-card {
    margin-bottom: 1rem;
  }
  
  .card-header {
    padding: 0.75rem 1rem;
    flex-wrap: nowrap; /* 确保即使在更小的屏幕上也不换行 */
  }
  
  .card-header h4 {
    font-size: 0.95rem; /* 更小的字体 */
    max-width: 75%; /* 进一步增加宽度 */
    overflow: visible; /* 确保文字不会被截断 */
    white-space: nowrap; /* 不允许文字换行 */
    text-overflow: ellipsis; /* 超出部分显示省略号 */
  }
  
  .card-body {
    padding: 0.75rem;
  }
  
  /* 优化表格在小屏幕上的显示 */
  .custom-table th:nth-child(3),
  .custom-table th:nth-child(4),
  .custom-table td:nth-child(3),
  .custom-table td:nth-child(4) {
    display: none;
  }
  
  .custom-table th:first-child,
  .custom-table td:first-child {
    padding-left: 0.5rem;
  }
  
  .custom-table th:last-child,
  .custom-table td:last-child {
    padding-right: 0.5rem;
  }
  
  /* 图片预览模态框优化 */
  .modal-image-container {
    max-width: 95vw;
  }
  
  .image-close-btn {
    right: 0;
    top: -40px;
  }
  
  /* 调整按钮大小和间距 */
  .btn-custom {
    padding: 0.45rem;
    min-width: 34px;
    height: 34px;
    border-radius: 50%;
  }
  
  .btn-custom.btn-sm {
    padding: 0.35rem;
    min-width: 30px;
    height: 30px;
  }
  
  .btn-custom i {
    font-size: 1rem;
  }
  
  /* 垂直堆叠操作按钮 */
  .actions-cell {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
  }
  
  /* 优化弹窗提示和确认 */
  .alert {
    padding: 0.75rem;
    font-size: 0.85rem;
  }
  
  /* 模态框按钮在移动端位置调整 */
  .modal-footer {
    justify-content: space-between;
  }
  
  .modal-footer .btn-custom {
    min-width: auto;
    width: auto;
    padding: 0.45rem 0.75rem;
    border-radius: var(--border-radius);
    height: auto;
  }
  
  .modal-footer .btn-custom .btn-text {
    display: inline-block;
  }
}

/* 特殊处理某些需要文本的按钮 */
.close-btn .btn-text,
.confirmation-btn .btn-text {
  display: inline-block;
}

/* 优化审批详情中查看公开页面按钮在移动端的样式 */
@media (max-width: 768px) {
  .modal-actions .btn-custom {
    padding: 0.5rem;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-actions .btn-custom i {
    margin: 0;
    font-size: 1.25rem;
  }
}

/* 网站设置相关样式 */
.settings-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-color);
  color: var(--primary-color);
}

.links-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.link-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--border-radius);
  background-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.link-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  flex: 1;
}

.link-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.link-field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--gray-color);
}

.checkbox-label {
  margin-left: 0.5rem;
  cursor: pointer;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .link-fields {
    grid-template-columns: 1fr;
  }
  
  .link-item {
    flex-direction: column;
  }
}

/* 链接项样式 */
.link-header {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 80px 1fr 60px;
  gap: 8px;
  padding: 0 10px;
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--primary-color);
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  padding-bottom: 8px;
}

.link-field-header {
  font-size: 0.85rem;
  padding: 0 5px;
}

.drag-handle-placeholder {
  width: 40px;
}

.link-item {
  display: grid;
  grid-template-columns: 40px 1fr 60px;
  align-items: center;
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--border-radius);
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid rgba(99, 102, 241, 0.1);
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
}

.link-item:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
}

.drag-handle {
  cursor: grab;
  color: #aaa;
  font-size: 1.2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: color 0.2s;
}

.drag-handle:hover {
  color: var(--primary-color);
}

.ghost-item {
  opacity: 0.5;
  background: rgba(124, 58, 237, 0.1);
  border: 1px dashed var(--primary-color);
}

.link-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 80px 1fr;
  gap: 8px;
  width: 100%;
}

.link-field {
  padding: 0 5px;
}

.icon-input-container {
  position: relative;
  flex: 1;
}

.clear-icon-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 5px;
  border-radius: 50%;
  cursor: pointer;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-icon-btn:hover {
  background: rgba(244, 63, 94, 0.1);
  color: var(--accent-color);
}

/* 图标选择器样式 */
.icon-selector .input-prefix {
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-selector .input-prefix:hover {
  background-color: rgba(124, 58, 237, 0.1);
  color: var(--primary-color);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.icon-item:hover {
  background-color: rgba(124, 58, 237, 0.1);
  border-color: rgba(124, 58, 237, 0.2);
}

.icon-item.selected {
  background-color: rgba(124, 58, 237, 0.2);
  border-color: var(--primary-color);
}

.icon-item i {
  font-size: 1.5rem;
  margin-bottom: 5px;
  color: var(--dark-color);
}

.icon-name {
  font-size: 0.7rem;
  color: var(--dark-color);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

/* 水平显示的复选框 */
.horizontal-display {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.horizontal-display label {
  margin-right: 10px;
}

.checkbox-text {
  margin-left: 10px;
  font-weight: 500;
}

/* 成功提示通知 */
.toast-notification {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--dark-color);
  padding: 15px 25px;
  border-radius: 100px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 2000;
  animation: slideInRight 0.3s forwards;
  transition: opacity 0.3s ease;
  font-weight: 600;
}

.success-toast {
  border-left: 4px solid var(--success-color);
}

.success-toast i {
  color: var(--success-color);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.icon-field {
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-selector-button {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(99, 102, 241, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.icon-selector-button:hover {
  background-color: rgba(124, 58, 237, 0.1);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.icon-selector-button i {
  transition: transform 0.2s ease;
}

.icon-selector-button:hover i {
  transform: scale(1.1);
}

.clear-icon-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  background: white;
  color: var(--accent-color);
  border: 1px solid rgba(244, 63, 94, 0.3);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  padding: 0;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.icon-selector-button:hover .clear-icon-btn {
  opacity: 1;
  transform: scale(1);
}

.clear-icon-btn:hover {
  background-color: var(--accent-color);
  color: white;
  transform: scale(1.1) !important;
}

.button-icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.delete-btn {
  color: var(--accent-color);
  border-color: rgba(244, 63, 94, 0.2);
}

.delete-btn:hover {
  background-color: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

/* 移动端适配 */
@media (max-width: 992px) {
  /* 保留表头在移动端 */
  .link-header {
    display: grid; /* 不再隐藏表头 */
    grid-template-columns: 40px 1fr 1fr 80px 1fr 60px; /* 与PC端保持一致 */
  }
  
  .link-item {
    grid-template-columns: 40px 1fr 40px; /* 调整整体布局，与PC端保持一致 */
    padding: 8px; /* 恢复PC端的内边距 */
  }
  
  /* 移除之前的垂直堆叠样式 */
  .link-fields {
    display: grid; /* 恢复网格布局 */
    grid-template-columns: 1fr 1fr 80px 1fr; /* 恢复PC端的列布局 */
    gap: 8px;
    width: 100%;
  }
  
  /* 移除字段垂直堆叠样式 */
  .link-field {
    display: flex;
    flex-direction: column;
    width: auto; /* 不再强制100%宽度 */
  }
  
  /* 保留标签文字，但仅在滚动视图外显示 */
  .link-field:not(.icon-field)::before {
    display: none; /* 隐藏移动端的标签，因为我们现在有了表头 */
  }
  
  /* 调整图标字段，保持居中 */
  .icon-field {
    align-self: center;
    margin: 0; /* 移除额外的边距 */
  }
  
  /* 增强滚动容器样式 */
  .scroll-container {
    border: 1px solid rgba(99, 102, 241, 0.1); /* 恢复边框 */
    background: rgba(255, 255, 255, 0.5); /* 恢复背景 */
    margin-bottom: 1rem;
    max-height: 350px;
  }
  
  /* 增加滚动提示效果 */
  .scroll-container::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 40px; 
    height: 100%;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.8));
    pointer-events: none;
    z-index: 1;
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
    opacity: 0.8;
  }
  
  /* 增强滚动方向指示 */
  .scroll-container::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 10px;
    width: 20px;
    height: 20px;
    border-right: 2px solid rgba(99, 102, 241, 0.4);
    border-bottom: 2px solid rgba(99, 102, 241, 0.4);
    transform: translateY(-50%) rotate(-45deg);
    animation: pulseArrow 2s infinite;
    z-index: 2;
  }
  
  @keyframes pulseArrow {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.8; }
  }
}

/* 添加更小屏幕的特殊处理 */
/* @media (max-width: 576px) { */
@media (max-width: 1200px) {
  .links-container {
    min-width: 650px; /* 确保最小宽度足够显示所有内容 */
  }
  
  .remove-link-btn {
    margin-top: 0; /* 移除按钮上方的额外边距 */
  }
  
  /* 优化移动端链接项内容显示 */
  .link-fields {
    display: grid;
    grid-template-columns: 1fr 1fr 80px 1fr;
    gap: 4px; /* 减小间距 */
  }
  
  .link-field input {
    width: 100%; /* 确保输入框宽度为100% */
    min-width: 0; /* 防止输入框最小宽度导致溢出 */
    font-size: 0.85rem; /* 减小字体大小 */
    padding: 0.5rem 0.75rem; /* 减小内边距 */
    text-overflow: ellipsis; /* 文本溢出时显示省略号 */
    white-space: nowrap; /* 防止文本换行 */
    overflow: hidden; /* 隐藏溢出内容 */
  }
  
  /* 修复图标按钮样式，确保居中显示不溢出 */
  .icon-selector-button {
    width: 36px; /* 减小图标选择按钮尺寸 */
    height: 36px;
    min-width: 36px; /* 确保最小宽度 */
    padding: 0;
  }
  
  .icon-field {
    display: flex;
    justify-content: center;
    min-width: 36px; /* 确保最小宽度 */
    max-width: 80px; /* 限制最大宽度 */
  }
}

/* 添加无图标样式 */
.no-icon {
  font-size: 0.9rem;
  color: #888;
  font-weight: normal;
}

/* 修改删除按钮样式 */
.delete-btn {
  background-color: var(--accent-color);
  color: white;
  border: none;
}

.delete-btn:hover {
  background-color: #e11d48;
  color: white;
  border-color: #e11d48;
  transform: scale(1.05);
}

/* 1. 调整图标字段与标题行对齐 */
.icon-field {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 调整无图标文本样式 */
.no-icon {
  font-size: 0.9rem;
  color: #888;
  font-weight: normal;
}

.remove-link-btn {
  background: rgba(244, 63, 94, 0.1);
  color: var(--accent-color);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-top: 1.2rem;
}

.remove-link-btn:hover {
  background: var(--accent-color);
  color: white;
  transform: rotate(90deg);
}

/* 3. 页脚设置保存成功消息样式 */
.settings-success-message {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  margin-right: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 删除旧的 toast 通知相关样式 */
.toast-notification {
  display: none;
}

/* 移动端适配时确保成功消息可见 */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
  }
  
  .settings-success-message {
    width: 100%;
    margin-bottom: 0.5rem;
    justify-content: center;
  }
}

/* 图标标题居中对齐 */
.link-field-header:nth-child(4) {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 新增link-delete-btn的替代样式 */
.link-delete-btn {
  display: none;
}

/* 添加可滚动容器样式，类似于审批记录部分 */
.scroll-container {
  width: 100%;
  overflow-y: auto;
  overflow-x: auto; /* 添加水平滚动支持 */
  max-height: 400px;
  border-radius: var(--border-radius);
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(99, 102, 241, 0.1);
  margin-bottom: 1rem;
  position: relative;
}

/* 调整链接容器与滚动容器的关系 */
.links-wrapper {
  padding: 0.5rem;
}

.links-container {
  width: 100%;
  min-width: 650px; /* 确保有足够的宽度展示所有列 */
}

/* 移动端适配 - 调整为保持PC端布局效果 */
@media (max-width: 992px) {
  /* 保留表头在移动端 */
  .link-header {
    display: grid; /* 不再隐藏表头 */
    grid-template-columns: 40px 1fr 1fr 80px 1fr 60px; /* 与PC端保持一致 */
  }
  
  .link-item {
    grid-template-columns: 40px 1fr 40px; /* 调整整体布局，与PC端保持一致 */
    padding: 8px; /* 恢复PC端的内边距 */
  }
  
  /* 移除之前的垂直堆叠样式 */
  .link-fields {
    display: grid; /* 恢复网格布局 */
    grid-template-columns: 1fr 1fr 80px 1fr; /* 恢复PC端的列布局 */
    gap: 8px;
    width: 100%;
  }
  
  /* 移除字段垂直堆叠样式 */
  .link-field {
    display: flex;
    flex-direction: column;
    width: auto; /* 不再强制100%宽度 */
  }
  
  /* 保留标签文字，但仅在滚动视图外显示 */
  .link-field:not(.icon-field)::before {
    display: none; /* 隐藏移动端的标签，因为我们现在有了表头 */
  }
  
  /* 调整图标字段，保持居中 */
  .icon-field {
    align-self: center;
    margin: 0; /* 移除额外的边距 */
  }
  
  /* 增强滚动容器样式 */
  .scroll-container {
    border: 1px solid rgba(99, 102, 241, 0.1); /* 恢复边框 */
    background: rgba(255, 255, 255, 0.5); /* 恢复背景 */
    margin-bottom: 1rem;
    max-height: 350px;
  }
  
  /* 增加滚动提示效果 */
  .scroll-container::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 40px; 
    height: 100%;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.8));
    pointer-events: none;
    z-index: 1;
    border-radius: 0 var(--border-radius) var(--border-radius) 0;
    opacity: 0.8;
  }
  
  /* 增强滚动方向指示 */
  .scroll-container::before {
    content: '';
    position: absolute;
    top: 50%;
    right: 10px;
    width: 20px;
    height: 20px;
    border-right: 2px solid rgba(99, 102, 241, 0.4);
    border-bottom: 2px solid rgba(99, 102, 241, 0.4);
    transform: translateY(-50%) rotate(-45deg);
    animation: pulseArrow 2s infinite;
    z-index: 2;
  }
  
  @keyframes pulseArrow {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.8; }
  }
}

/* 添加更小屏幕的特殊处理 */
@media (max-width: 576px) {
  .links-container {
    min-width: 650px; /* 确保最小宽度足够显示所有内容 */
  }
  
  .remove-link-btn {
    margin-top: 0; /* 移除按钮上方的额外边距 */
  }
}

/* 添加链接按钮的样式 - 保持PC端风格 */
.add-link-btn {
  margin: 0.75rem auto 1rem;
  min-width: 150px;
  width: auto !important; /* 强制使用自动宽度，不随屏幕变化 */
  max-width: 200px;
  display: inline-flex !important; /* 强制使用PC端的内联弹性布局 */
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  padding: 0.5rem 1rem;
  white-space: nowrap;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  height: auto !important; /* 确保高度适应内容 */
}

/* 确保按钮文本在任何设备上都显示 */
.add-link-btn .btn-text {
  display: inline !important; /* 强制显示文本 */
  margin-left: 0.35rem; /* 增加图标和文字间距 */
}

/* 小屏幕样式 */
@media (max-width: 576px) {
  /* 改进滚动容器边缘渐变效果 */
  .scroll-container::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 30px;
    background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8));
    pointer-events: none;
    z-index: 2;
  }
  
  .links-container {
    min-width: 650px; /* 确保最小宽度足够显示所有内容 */
  }
  
  .remove-link-btn {
    margin-top: 0; /* 移除按钮上方的额外边距 */
  }
}

/* 恢复滚动容器样式 */
.links-wrapper {
  margin-bottom: 0.5rem;
}

.links-container {
  min-width: 650px; /* 确保在移动端有足够宽度显示全部内容 */
}

/* 在所有设备上覆盖移动端样式 */
@media (max-width: 768px) {
  /* 移除其他按钮文本的隐藏样式 */
  .btn-text {
    display: none;
  }
  
  /* 但保持添加链接按钮文本显示 */
  .add-link-btn {
    height: auto !important;
    width: auto !important;
    display: inline-flex !important;
    padding: 0.5rem 1rem !important;
    min-width: 150px;
    border-radius: var(--border-radius) !important;
  }
  
  .add-link-btn .btn-text {
    display: inline !important;
  }
}

/* 添加按钮居中包装器 */
.add-link-wrapper {
  width: 100%;
  text-align: center;
  margin: 0.75rem 0 1rem;
}

/* 添加链接按钮的样式 - 保持PC端风格并居中 */
.add-link-btn {
  margin: 0 auto;
  min-width: 150px;
  width: auto !important; /* 强制使用自动宽度，不随屏幕变化 */
  max-width: 200px;
  display: inline-flex !important; /* 强制使用PC端的内联弹性布局 */
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  padding: 0.5rem 1.5rem;
  white-space: nowrap;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  height: auto !important; /* 确保高度适应内容 */
}

/* 确保按钮文本在任何设备上都显示 */
.add-link-btn .btn-text {
  display: inline !important; /* 强制显示文本 */
  margin-left: 0.35rem; /* 增加图标和文字间距 */
}

/* 在所有设备上覆盖移动端样式 */
@media (max-width: 768px) {
  /* 但保持添加链接按钮文本显示并居中 */
  .add-link-btn {
    height: auto !important;
    width: auto !important;
    display: inline-flex !important;
    padding: 0.5rem 1.5rem !important;
    min-width: 150px;
    border-radius: var(--border-radius) !important;
  }
}

/* 表单帮助文本样式 */
.form-text {
  font-size: 0.85rem;
  color: var(--gray-color);
  margin-top: 0.5rem;
  line-height: 1.4;
}

/* 自定义文本区域样式 */
textarea.custom-input {
  min-height: 100px;
  resize: vertical;
  line-height: 1.5;
  padding: 0.75rem 1rem;
}

/* 增强section-title样式 */
.section-title {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(124, 58, 237, 0.2);
  color: var(--primary-color);
  font-weight: 600;
}

/* 分隔设置区域 */
.settings-section {
  margin-bottom: 3rem;
  padding-bottom: 1rem;
}

.settings-section:not(:last-child) {
  border-bottom: 1px dashed rgba(124, 58, 237, 0.1);
}

/* 设置区域描述 */
.section-description {
  font-size: 0.9rem;
  color: var(--gray-color);
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

/* 自定义下拉选择框样式 */
select.custom-input {
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
}

/* 占位符文本样式 */
.custom-input::placeholder {
  color: rgba(107, 114, 128, 0.6);
  font-style: italic;
}

/* 表单帮助文本样式 */
.form-text {
  font-size: 0.85rem;
  color: var(--gray-color);
  margin-top: 0.5rem;
  line-height: 1.4;
}

/* 自定义文本区域样式 */
textarea.custom-input {
  min-height: 100px;
  resize: vertical;
  line-height: 1.5;
  padding: 0.75rem 1rem;
}

/* 增强section-title样式 */
.section-title {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(124, 58, 237, 0.2);
  color: var(--primary-color);
  font-weight: 600;
}

/* 分隔设置区域 */
.settings-section {
  margin-bottom: 3rem;
  padding-bottom: 1rem;
}

.settings-section:not(:last-child) {
  border-bottom: 1px dashed rgba(124, 58, 237, 0.1);
}

/* 网站图标上传样式 */
.favicon-upload-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.favicon-preview {
  width: 64px;
  height: 64px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.favicon-upload-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-upload {
  background: var(--primary-gradient);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-upload:hover {
  transform: scale(1.05);
}

.btn-clear-favicon {
  background: rgba(244, 63, 94, 0.1);
  color: var(--accent-color);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-clear-favicon:hover {
  transform: scale(1.05);
}

.favicon-uploader {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.favicon-upload-area {
  position: relative;
  width: 120px;
  height: 120px;
  border: 2px dashed rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

.favicon-upload-area:hover {
  border-color: var(--primary-color);
  background: rgba(255, 255, 255, 0.8);
}

.favicon-upload-area.has-preview {
  border-style: solid;
  border-color: rgba(99, 102, 241, 0.5);
}

.favicon-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
}

.favicon-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--gray-color);
  text-align: center;
  padding: 0 0.5rem;
}

.favicon-empty-state i {
  font-size: 2rem;
  opacity: 0.7;
  margin-bottom: 0.5rem;
}

.favicon-empty-state span {
  font-size: 0.9rem;
  font-weight: 500;
}

/* 中央显示上传按钮 */
.favicon-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.favicon-upload-area:hover .favicon-actions {
  opacity: 1;
}

/* 通用按钮样式 */
.favicon-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.favicon-action-btn i {
  font-size: 1.2rem;
}

.favicon-action-btn:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.3);
}

/* 上传按钮样式 */
.upload-btn:hover {
  background: rgba(99, 102, 241, 0.5);
}

/* 删除按钮样式 - 右上角定位 */
.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 20;
  background: rgba(244, 63, 94, 0.7);
  opacity: 1;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: rgba(244, 63, 94, 1);
  transform: scale(1.15);
}

.hidden-upload {
  display: none;
}

/* About页面设置相关样式 */
.subsection-title {
  font-size: 1.1rem;
  margin: 1.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--dark-color);
}

.subsection-title i {
  color: var(--primary-color);
}

.mt-4 {
  margin-top: 1.5rem;
}

.description-field textarea {
  min-height: 80px;
}

.description-field .form-text {
  font-size: 0.8rem;
  margin-top: 0.25rem;
  color: var(--gray-color);
}

.description-field code {
  background: rgba(0, 0, 0, 0.05);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.85em;
}
</style> 
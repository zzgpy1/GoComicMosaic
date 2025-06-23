import axios from 'axios';

/**
 * 文章服务类，处理与文章相关的API请求
 */
class PostService {
  /**
   * 获取所有文章
   * @returns {Promise} 包含文章列表的Promise
   */
  getAllPosts() {
    return axios.get('/api/posts/').then(response => response.data);
  }

  /**
   * 通过ID获取文章
   * @param {string} id 文章ID
   * @returns {Promise} 包含文章详情的Promise
   */
  getPostById(id) {
    return axios.get(`/api/posts/id/${id}`).then(response => response.data);
  }

  /**
   * 通过Slug获取文章
   * @param {string} slug 文章Slug
   * @returns {Promise} 包含文章详情的Promise
   */
  getPostBySlug(slug) {
    return axios.get(`/api/posts/slug/${slug}`).then(response => response.data);
  }

  /**
   * 搜索文章
   * @param {string} query 搜索关键词
   * @returns {Promise} 包含搜索结果的Promise
   */
  searchPosts(query) {
    return axios.get(`/api/posts/search?q=${encodeURIComponent(query)}`).then(response => response.data);
  }

  /**
   * 获取认证头
   * @returns {Object} 包含认证头的对象
   * @private
   */
  _getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  /**
   * 创建新文章
   * @param {Object} post 文章数据
   * @returns {Promise} 包含创建结果的Promise
   */
  createPost(post) {
    return axios.post('/api/posts/admin/', post, this._getAuthHeaders())
      .then(response => response.data);
  }

  /**
   * 更新文章
   * @param {string} id 文章ID
   * @param {Object} post 文章数据
   * @returns {Promise} 包含更新结果的Promise
   */
  updatePost(id, post) {
    console.log(`准备更新文章，ID: ${id}`);
    console.log('请求URL:', `/api/posts/admin/${id}`);
    console.log('请求数据:', post);
    console.log('认证头:', this._getAuthHeaders());
    
    return axios.put(`/api/posts/admin/${id}`, post, this._getAuthHeaders())
      .then(response => {
        console.log('更新文章成功:', response.data);
        return response.data;
      })
      .catch(error => {
        console.error('更新文章失败:', error);
        if (error.response) {
          console.error('错误状态码:', error.response.status);
          console.error('错误响应数据:', error.response.data);
          console.error('错误响应头:', error.response.headers);
        } else if (error.request) {
          console.error('未收到响应:', error.request);
        } else {
          console.error('请求配置错误:', error.message);
        }
        console.error('请求配置:', error.config);
        throw error;
      });
  }

  /**
   * 删除文章
   * @param {string} id 文章ID
   * @returns {Promise} 包含删除结果的Promise
   */
  deletePost(id) {
    return axios.delete(`/api/posts/admin/${id}`, this._getAuthHeaders())
      .then(response => response.data);
  }

  /**
   * 上传文章图片
   * @param {File} file 图片文件
   * @param {string} title 文章标题，用于子目录
   * @returns {Promise} 包含上传结果的Promise
   */
  uploadImage(file, title = '') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title);
    
    const config = {
      ...this._getAuthHeaders(),
      headers: {
        ...this._getAuthHeaders().headers,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    return axios.post('/api/posts/admin/upload/image', formData, config)
      .then(response => response.data);
  }

  /**
   * 上传文章附件
   * @param {File} file 附件文件
   * @param {string} title 文章标题，用于子目录
   * @returns {Promise} 包含上传结果的Promise
   */
  uploadFile(file, title = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    
    const config = {
      ...this._getAuthHeaders(),
      headers: {
        ...this._getAuthHeaders().headers,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    return axios.post('/api/posts/admin/upload/file', formData, config)
      .then(response => response.data);
  }
}

export default new PostService(); 
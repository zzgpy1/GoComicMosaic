package handlers

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"dongman/internal/models"
	"dongman/internal/utils"
)

// TMDBSearchRequest TMDB搜索请求
type TMDBSearchRequest struct {
	Query string `json:"query" binding:"required"`
}

// SearchTMDB 搜索TMDB API
// @Summary 搜索TMDB API
// @Description 根据查询字符串搜索TMDB API获取动画信息
// @Tags TMDB
// @Accept json
// @Produce json
// @Param query query string true "搜索关键词"
// @Success 200 {object} utils.TMDBResource
// @Failure 400 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /api/tmdb/search [get]
func SearchTMDB(c *gin.Context) {
	// 从URL查询参数获取查询字符串
	query := c.Query("query")

	// 检查查询字符串是否为空
	if strings.TrimSpace(query) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "查询字符串不能为空"})
		return
	}

	// 使用TMDB工具搜索
	resource, err := utils.SearchTMDB(query)
	if err != nil {
		log.Printf("TMDB搜索失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resource)
}

// CreateResourceFromTMDB 从TMDB搜索结果创建资源
// @Summary 从TMDB创建资源
// @Description 根据TMDB搜索结果创建新的资源
// @Tags TMDB
// @Accept json
// @Produce json
// @Param request body TMDBSearchRequest true "搜索请求"
// @Success 200 {object} models.Resource
// @Failure 400 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /api/tmdb/create [post]
func CreateResourceFromTMDB(c *gin.Context) {

	var req TMDBSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("解析请求失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数"})
		return
	}

	// 检查查询字符串是否为空
	if strings.TrimSpace(req.Query) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "查询字符串不能为空"})
		return
	}

	// 使用TMDB工具搜索
	tmdbResource, err := utils.SearchTMDB(req.Query)
	if err != nil {
		log.Printf("TMDB搜索失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 转换为需要插入数据库的资源
	now := time.Now()
	defaultStatus := models.ResourceStatusPending
	
	// 确保PosterImage不为空
	posterImage := tmdbResource.PosterImage
	
	// 创建资源对象
	resource := &models.Resource{
		Title:        tmdbResource.Title,
		TitleEn:      tmdbResource.TitleEn,
		Description:  tmdbResource.Description,
		ResourceType: tmdbResource.ResourceType,
		PosterImage:  &posterImage,
		Images:       tmdbResource.Images,
		Links:        models.JsonMap(tmdbResource.Links),
		Status:       defaultStatus,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// 执行SQL插入
	result, err := models.DB.NamedExec(`
		INSERT INTO resources (
			title, title_en, description, resource_type, poster_image, 
			images, links, status, created_at, updated_at
		) VALUES (
			:title, :title_en, :description, :resource_type, :poster_image, 
			:images, :links, :status, :created_at, :updated_at
		)
	`, resource)

	if err != nil {
		log.Printf("插入资源失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建资源失败"})
		return
	}

	// 获取新插入记录的ID
	id, err := result.LastInsertId()
	if err != nil {
		log.Printf("获取插入ID失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取新资源ID失败"})
		return
	}
	
	// 设置返回资源的ID
	resource.ID = int(id)

	c.JSON(http.StatusOK, resource)
} 
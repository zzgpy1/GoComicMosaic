package handlers

import (
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置API路由
func SetupRoutes(router *gin.Engine) {
	// 加载TMDB配置
	LoadTMDBConfig()
	
	// API路由组
	api := router.Group("/api")
	
	// CORS代理路由 - 无需认证
	api.GET("/proxy", ProxyHandler)
	
	// 直接添加一个不带/api前缀的代理路由，适用于Vite代理重写后的路径
	router.GET("/proxy", ProxyHandler)
	
	// 认证路由
	auth := api.Group("/auth")
	{
		auth.POST("/token", Login)
		auth.GET("/me", JWTAuthMiddleware(), GetCurrentUserInfo)
		auth.POST("/change-password", JWTAuthMiddleware(), UpdatePassword)
	}
	
	// 网站设置路由
	settings := api.Group("/settings")
	{
		// 获取设置 - 公开API
		settings.GET("/:key", GetSiteSettings)
		settings.GET("/", GetAllSiteSettings)
		
		// 更新设置 - 需要管理员权限
		settings.PUT("/:key", JWTAuthMiddleware(), AdminAuthMiddleware(), UpdateSiteSettings)
	}
	
	// 管理员路由
	admin := api.Group("/admin", JWTAuthMiddleware(), AdminAuthMiddleware())
	{
		// 网站图标上传
		admin.POST("/upload/favicon", UploadFavicon)
		
		// TMDB配置
		admin.GET("/tmdb/config", GetTMDBConfig)
		admin.PUT("/tmdb/config", UpdateTMDBConfig)
	}
	
	// TMDB API路由
	tmdb := api.Group("/tmdb")
	{
		tmdb.GET("/search", SearchTMDB)
		tmdb.POST("/create", CreateResourceFromTMDB)
	}
	
	// 资源路由 - 需要认证
	resources := api.Group("/resources")
	{
		// 公开API - 无需认证
		resources.GET("/public", GetPublicResources)
		resources.GET("/:id", GetResourceByID)
		resources.POST("/:id/like", LikeResource)
		resources.POST("/:id/unlike", UnlikeResource)
		resources.PUT("/:id/supplement", SupplementResource)
		
		resources.POST("/", CreateResource)

		// 图片上传API - 处理不同URL路径格式
		resources.POST("/upload-images", UploadImage)
		resources.POST("/upload-images/", UploadImage)  // 添加带斜杠版本的路由
		resources.GET("/upload-images", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "upload API ready"})
		})
		resources.GET("/upload-images/", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "upload API ready"})
		})

		// 需要认证的API
		authResources := resources.Group("/", JWTAuthMiddleware())
		{
			authResources.GET("/", GetResources)
			// authResources.POST("/", CreateResource)
		}
		
		// 仅管理员可访问的API
		adminResources := resources.Group("/", JWTAuthMiddleware(), AdminAuthMiddleware())
		{
			adminResources.GET("/pending", GetPendingResources)
			adminResources.GET("/pending-supplements", GetPendingSupplementResources)
			adminResources.GET("/:id/supplement", GetResourceSupplement)
			adminResources.PUT("/:id", UpdateResource)
			adminResources.PUT("/:id/approve", ApproveResource)
			adminResources.DELETE("/:id", DeleteResource)
			adminResources.DELETE("/:id/record", DeleteApprovalRecord)
			adminResources.DELETE("/batch-delete-records", DeleteApprovalRecords)
			adminResources.GET("/approval-records", GetApprovalRecords)
			adminResources.GET("/:id/approval-records", GetResourceApprovalRecords)
		}
	}
} 
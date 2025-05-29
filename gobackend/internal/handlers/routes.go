package handlers

import (
	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置API路由
func SetupRoutes(router *gin.Engine) {
	// API路由组
	api := router.Group("/api")
	
	// 认证路由
	auth := api.Group("/auth")
	{
		auth.POST("/token", Login)
		auth.GET("/me", JWTAuthMiddleware(), GetCurrentUserInfo)
		auth.POST("/change-password", JWTAuthMiddleware(), UpdatePassword)
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
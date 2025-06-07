package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"dongman/internal/handlers"
	"dongman/internal/models"
	"dongman/internal/config"
)

func main() {
	// 设置日志
	log.Println("启动动漫资源共享平台API服务...")

	// 初始化数据库
	db, err := models.InitDB()
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer db.Close()

	// 创建初始管理员账号
	if err := models.CreateInitialAdmin(); err != nil {
		log.Printf("创建初始管理员账号失败: %v", err)
	}

	// 初始化网站设置
	if err := models.InitSiteSettings(); err != nil {
		log.Printf("初始化网站设置失败: %v", err)
	}

	// 创建Gin应用
	router := gin.Default()

	// 配置CORS中间件
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 配置静态文件服务
	router.Static("/assets", config.AssetPath)
	router.Static("/public", filepath.Join(config.AssetPath, "public"))

	// 设置路由
	handlers.SetupRoutes(router)

	// 定义根路径处理
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "欢迎使用动漫资源共享平台API",
		})
	})

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	
	log.Printf("服务器监听在 http://0.0.0.0:%s", port)
	if err := router.Run(fmt.Sprintf("0.0.0.0:%s", port)); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}


package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"dongman/internal/handlers"
	"dongman/internal/models"
	"dongman/internal/config"
	"dongman/internal/utils"
)

func main() {
	// 设置日志
	log.Println("启动动漫资源共享平台API服务...")
	
	// 检查数据库文件
	dbPath := utils.GetDbPath()
	log.Printf("数据库文件路径: %s", dbPath)
	
	// 检查主数据库文件是否存在
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		log.Printf("警告: 数据库文件不存在，将创建新的数据库")
	} else {
		// 检查WAL文件是否存在
		walPath := dbPath + "-wal"
		if _, err := os.Stat(walPath); os.IsNotExist(err) {
			log.Printf("注意: WAL文件不存在，这可能是正常的（如果是首次启动或数据库被正常关闭）")
		} else {
			log.Printf("检测到WAL文件: %s", walPath)
		}
		
		// 检查SHM文件是否存在
		shmPath := dbPath + "-shm"
		if _, err := os.Stat(shmPath); os.IsNotExist(err) {
			log.Printf("注意: SHM文件不存在")
		} else {
			log.Printf("检测到SHM文件: %s", shmPath)
		}
	}

	// 初始化数据库
	db, err := models.InitDB()
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	// 不再使用defer db.Close()，我们会在收到信号时手动关闭
	
	// 执行WAL检查点，确保启动时数据已同步
	log.Println("执行启动时数据库检查点...")
	_, err = db.Exec("PRAGMA wal_checkpoint(RESTART);")
	if err != nil {
		log.Printf("启动时执行检查点失败: %v", err)
	} else {
		log.Println("启动时检查点执行成功")
	}
	
	// 设置WAL自动检查点阈值（页数）
	_, err = db.Exec("PRAGMA wal_autocheckpoint=500;")
	if err != nil {
		log.Printf("设置WAL自动检查点阈值失败: %v", err)
	} else {
		log.Println("WAL自动检查点阈值设置成功")
	}

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

	// 创建HTTP服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	srv := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%s", port),
		Handler: router,
	}

	// 启动服务器（在后台）
	go func() {
		log.Printf("服务器监听在 http://0.0.0.0:%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("服务器启动失败: %v", err)
		}
	}()

	// 等待中断信号以优雅关闭服务器
	quit := make(chan os.Signal, 1)
	// 监听SIGINT（Ctrl+C）和SIGTERM信号
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("正在关闭服务器...")

	// 创建带有超时的上下文，用于优雅关闭
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 首先安全关闭HTTP服务器，不接收新的请求
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("服务器强制关闭: %v", err)
	}

	// 安全关闭数据库连接，确保WAL数据被写入主数据库
	if err := models.CloseDB(); err != nil {
		log.Printf("数据库关闭错误: %v", err)
	}

	log.Println("服务器已成功关闭")
}


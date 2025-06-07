package config

import (
	"log"
	"os"
	"path/filepath"
)

var AssetPath string

func init() {
	// 优先读取环境变量指定的资源目录
	if envPath := os.Getenv("ASSETS_PATH"); envPath != "" {
		AssetPath = envPath
		log.Printf("使用环境变量指定的资源目录: %s", AssetPath)
	} else {
		// 获取当前工作目录
		workDir, err := os.Getwd()
		if err != nil {
			log.Printf("获取工作目录失败: %v，使用默认路径", err)
			workDir = "."
		}
		
		// 使用默认资源目录路径
		AssetPath = filepath.Join(workDir, "..", "assets")
		log.Printf("使用默认资源目录: %s", AssetPath)
	}

	// 如果目录不存在，尝试创建
	if _, err := os.Stat(AssetPath); os.IsNotExist(err) {
		if err := os.MkdirAll(AssetPath, 0755); err != nil {
			log.Printf("无法创建资源目录: %v", err)
		}
	}

	// 确保public子目录存在
	publicDir := filepath.Join(AssetPath, "public")
	if _, err := os.Stat(publicDir); os.IsNotExist(err) {
		if err := os.MkdirAll(publicDir, 0755); err != nil {
			log.Printf("无法创建public目录: %v", err)
		}
	}
}
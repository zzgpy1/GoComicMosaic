package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	
	"dongman/internal/models"
	"dongman/internal/utils"
)

func main() {
	// 初始化数据库连接，以确保可以正常使用utils包
	db, err := models.InitDB()
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer db.Close()
	
	log.Println("WebP转换工具测试")
	
	// 示例图片路径 - 如果该路径不存在，请替换为实际存在的图片路径
	testImgPath := "imgs/1/test.jpg" 
	
	// 获取工作目录，构建assets目录路径
	workDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("获取工作目录失败: %v", err)
	}
	
	// 构建测试目录
	assetsDir := filepath.Join(workDir, "..", "..", "assets")
	testDir := filepath.Join(assetsDir, "imgs", "1")
	
	// 确保测试目录存在
	if err := os.MkdirAll(testDir, 0755); err != nil {
		log.Fatalf("创建测试目录失败: %v", err)
	}
	
	// 将测试图片从实例目录复制到测试目录 - 请确保原图片存在
	srcImagePath := filepath.Join(workDir, "..", "..", "assets", "uploads")
	files, err := filepath.Glob(filepath.Join(srcImagePath, "*", "*.jpg"))
	if err != nil || len(files) == 0 {
		log.Fatalf("未找到测试图片: %v", err)
	}
	
	// 使用找到的第一张图片
	testSrcPath := files[0]
	testDstPath := filepath.Join(testDir, "test.jpg")
	
	// 复制测试图片
	if err := utils.CopyFile(testSrcPath, testDstPath); err != nil {
		log.Fatalf("复制测试图片失败: %v", err)
	}
	
	log.Printf("已复制测试图片: %s -> %s", testSrcPath, testDstPath)
	
	// 测试固定尺寸的转换
	log.Println("测试1: 固定尺寸转换(600x900)")
	webpPath, err := utils.ConvertToWebP(testImgPath)
	if err != nil {
		log.Fatalf("WebP转换失败: %v", err)
	}
	log.Printf("转换成功! WebP文件路径: %s", webpPath)
	
	// 测试保持宽高比的转换
	log.Println("测试2: 保持宽高比转换(最大600x900)")
	webpRatioPath, err := utils.ConvertToWebPWithRatio(testImgPath, 600, 900, true)
	if err != nil {
		log.Fatalf("保持宽高比的WebP转换失败: %v", err)
	}
	log.Printf("转换成功! 保持宽高比的WebP文件路径: %s", webpRatioPath)
	
	// 测试完整路径转换
	log.Println("测试3: 完整路径转换")
	fullPath := filepath.Join(assetsDir, testImgPath)
	webpFullPath, err := utils.ConvertToWebPFromPath(fullPath)
	if err != nil {
		log.Fatalf("完整路径的WebP转换失败: %v", err)
	}
	log.Printf("转换成功! 完整路径的WebP文件: %s", webpFullPath)
	
	fmt.Println("所有测试完成!")
} 
package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// 获取当前工作目录
	wd, err := os.Getwd()
	if err != nil {
		log.Fatalf("获取工作目录失败: %v", err)
	}
	log.Printf("当前工作目录: %s", wd)

	// 构建数据库路径 - 尝试在多个位置查找
	possiblePaths := []string{
		"./resource_hub.db",                      // 当前目录
		"../../resource_hub.db",                  // 项目根目录
		filepath.Join(wd, "resource_hub.db"),     // 绝对路径
		filepath.Join(wd, "../../resource_hub.db"), // 绝对路径到项目根目录
	}

	var db *sql.DB
	var dbPath string

	// 尝试打开数据库
	for _, path := range possiblePaths {
		log.Printf("尝试打开数据库: %s", path)
		if _, err := os.Stat(path); err == nil {
			log.Printf("找到数据库文件: %s", path)
			db, err = sql.Open("sqlite3", path)
			if err == nil {
				dbPath = path
				log.Printf("成功打开数据库: %s", path)
				break
			} else {
				log.Printf("打开数据库失败: %v", err)
			}
		} else {
			log.Printf("数据库文件不存在: %s", path)
		}
	}

	if db == nil {
		log.Fatalf("未能找到或打开任何数据库文件")
	}
	
	log.Printf("使用数据库文件: %s", dbPath)

	// 测试数据库连接
	if err := db.Ping(); err != nil {
		log.Fatalf("数据库连接测试失败: %v", err)
	}
	log.Printf("数据库连接测试成功")

	// 检查资源表结构
	log.Println("检查资源表结构:")
	rows, err := db.Query("PRAGMA table_info(resources)")
	if err != nil {
		log.Fatalf("查询表结构失败: %v", err)
	}
	defer rows.Close()

	var (
		cid        int
		name       string
		dataType   string
		notNull    int
		dfltValue  interface{}
		primaryKey int
	)

	for rows.Next() {
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &dfltValue, &primaryKey); err != nil {
			log.Fatalf("扫描表结构数据失败: %v", err)
		}
		log.Printf("列: %s, 类型: %s, 非空: %d, 默认值: %v, 主键: %d", name, dataType, notNull, dfltValue, primaryKey)
	}

	// 统计资源数量
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM resources").Scan(&count); err != nil {
		log.Fatalf("统计资源失败: %v", err)
	}
	log.Printf("资源总数: %d", count)

	// 查询已批准的资源数量
	if err := db.QueryRow("SELECT COUNT(*) FROM resources WHERE status = 'APPROVED'").Scan(&count); err != nil {
		log.Fatalf("统计已批准资源失败: %v", err)
	}
	log.Printf("已批准资源数: %d", count)

	// 检查ID为1的资源记录
	log.Println("查询ID为1的资源记录:")
	rows, err = db.Query("SELECT id, title, title_en, description, resource_type, status FROM resources WHERE id = 1")
	if err != nil {
		log.Fatalf("查询资源失败: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var title, titleEn, description, resourceType, status string
		if err := rows.Scan(&id, &title, &titleEn, &description, &resourceType, &status); err != nil {
			log.Fatalf("扫描资源数据失败: %v", err)
		}
		log.Printf("资源ID: %d, 标题: %s, 英文标题: %s, 类型: %s, 状态: %s", id, title, titleEn, resourceType, status)
		log.Printf("描述: %s", description)
	}

	fmt.Println("SQLite 数据库测试完成")
} 
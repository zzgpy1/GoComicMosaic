package models

import (
	"encoding/json"
	"fmt"
	"log"
	"path/filepath"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
	"dongman/internal/utils"
)

// DB 是全局数据库连接
var DB *sqlx.DB

// 初始化数据库表的SQL语句
const initSQL = `
CREATE TABLE IF NOT EXISTS resources (
	id INTEGER NOT NULL, 
	title VARCHAR, 
	title_en VARCHAR, 
	description TEXT, 
	images JSON, 
	poster_image VARCHAR, 
	resource_type VARCHAR, 
	status VARCHAR(8), 
	hidden_from_admin BOOLEAN, 
	created_at DATETIME, 
	updated_at DATETIME, 
	links JSON, 
	original_resource_id INTEGER, 
	supplement JSON, 
	approval_history JSON, 
	is_supplement_approval BOOLEAN DEFAULT 'False', 
	likes_count INTEGER DEFAULT '0' NOT NULL, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_resources_id ON resources (id);
CREATE INDEX IF NOT EXISTS ix_resources_title ON resources (title);
CREATE INDEX IF NOT EXISTS ix_resources_title_en ON resources (title_en);

CREATE TABLE IF NOT EXISTS approval_records (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	resource_id INTEGER NOT NULL,
	status VARCHAR(8) NOT NULL,
	field_approvals JSON,
	field_rejections JSON,
	approved_images JSON,
	rejected_images JSON,
	poster_image VARCHAR,
	notes TEXT,
	approved_links JSON,
	rejected_links JSON,
	is_supplement_approval BOOLEAN DEFAULT 'False',
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_approval_records_resource_id ON approval_records(resource_id);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
`

// InitDB 初始化数据库连接
func InitDB() (*sqlx.DB, error) {
	// 从utils包获取数据库路径
	dbPath := utils.GetDbPath()
	log.Printf("连接数据库: %s", dbPath)
	
	// 连接SQLite数据库
	db, err := sqlx.Connect("sqlite3", fmt.Sprintf("file:%s?_journal=WAL&_foreign_keys=on", dbPath))
	if err != nil {
		return nil, fmt.Errorf("连接数据库失败: %w", err)
	}

	// 设置连接池参数
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Minute * 30)

	// 初始化表结构
	if _, err = db.Exec(initSQL); err != nil {
		return nil, fmt.Errorf("初始化数据库表失败: %w", err)
	}

	// 设置自定义类型映射
	db.MapperFunc(func(s string) string { return s })

	// 保存全局数据库连接
	DB = db

	return db, nil
}

// GetDB 获取数据库连接
func GetDB() *sqlx.DB {
	return DB
}

// CreateInitialAdmin 创建初始管理员账号
func CreateInitialAdmin() error {
	// 检查是否已经有用户
	var count int
	if err := DB.Get(&count, "SELECT COUNT(*) FROM users"); err != nil {
		return fmt.Errorf("检查用户数量失败: %w", err)
	}

	// 如果已经有用户，不再创建管理员
	if count > 0 {
		return nil
	}

	// 默认管理员信息
	const (
		defaultUsername = "admin"
		defaultPassword = "admin123"
	)

	// 创建密码哈希
	hashedPassword, err := generatePasswordHash(defaultPassword)
	if err != nil {
		return fmt.Errorf("生成密码哈希失败: %w", err)
	}

	// 插入管理员记录
	_, err = DB.Exec(
		"INSERT INTO users (username, hashed_password, is_admin) VALUES (?, ?, ?)",
		defaultUsername, hashedPassword, true,
	)
	if err != nil {
		return fmt.Errorf("创建管理员账号失败: %w", err)
	}

	log.Printf("已创建初始管理员账号: %s，默认密码: %s", defaultUsername, defaultPassword)
	return nil
}

// RestoreImagesPath 检查并恢复图片路径
func RestoreImagesPath() error {
	// 查询所有资源
	resources := []Resource{}
	if err := DB.Select(&resources, "SELECT * FROM resources"); err != nil {
		return fmt.Errorf("查询资源失败: %w", err)
	}

	// 获取资源目录
	assetsDir := utils.GetAssetsDir()
	log.Printf("资源目录: %s", assetsDir)

	// 扫描所有图片文件
	allImages := make(map[string]string)
	uploadPatterns := filepath.Join(assetsDir, "uploads", "*", "*.*")
	approvedPatterns := filepath.Join(assetsDir, "imgs", "*", "*.*")

	// 收集上传目录的图片
	uploadFiles, _ := filepath.Glob(uploadPatterns)
	for _, path := range uploadFiles {
		relativePath := filepath.Join("/assets", path[len(assetsDir):])
		filename := filepath.Base(path)
		allImages[filename] = relativePath
	}

	// 收集已审批的图片
	approvedFiles, _ := filepath.Glob(approvedPatterns)
	for _, path := range approvedFiles {
		relativePath := filepath.Join("/assets", path[len(assetsDir):])
		filename := filepath.Base(path)
		allImages[filename] = relativePath
	}

	log.Printf("找到 %d 个图片文件", len(allImages))

	// 检查每个资源的图片路径
	updatedCount := 0
	for _, resource := range resources {
		updated := false

		// 处理图片列表
		if len(resource.Images) > 0 {
			newImages := make([]string, 0, len(resource.Images))
			for _, imgPath := range resource.Images {
				if imgPath == "" || imgPath[:7] != "/assets" {
					continue
				}

				filename := filepath.Base(imgPath)
				if newPath, exists := allImages[filename]; exists {
					newImages = append(newImages, newPath)
					updated = true
				} else {
					newImages = append(newImages, imgPath) // 保持原路径
				}
			}

			if updated {
				resource.Images = newImages
			}
		}

		// 处理海报图片
		if resource.PosterImage != nil && *resource.PosterImage != "" {
			posterFilename := filepath.Base(*resource.PosterImage)
			if newPath, exists := allImages[posterFilename]; exists {
				*resource.PosterImage = newPath
				updated = true
			}
		}

		// 如果有更新，保存到数据库
		if updated {
			// 将Images转换为JSON字符串
			imagesJSON, err := resource.Images.Value()
			if err != nil {
				log.Printf("资源 %d 的图片列表序列化失败: %v", resource.ID, err)
				continue
			}

			// 更新数据库
			_, err = DB.Exec(
				"UPDATE resources SET images = ?, poster_image = ? WHERE id = ?",
				imagesJSON, resource.PosterImage, resource.ID,
			)
			if err != nil {
				log.Printf("更新资源 %d 失败: %v", resource.ID, err)
				continue
			}

			updatedCount++
		}
	}

	if updatedCount > 0 {
		log.Printf("已恢复 %d 个资源的图片路径", updatedCount)
	} else {
		log.Print("无需恢复图片路径")
	}

	return nil
}

// generatePasswordHash 生成密码哈希
func generatePasswordHash(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("生成密码哈希失败: %w", err)
	}
	return string(hashedBytes), nil
}


// isValidJson 检查字节数组是否是有效的JSON
func isValidJson(data []byte) bool {
	if data == nil || len(data) == 0 {
		return true // 空数据视为有效
	}
	
	var js interface{}
	return json.Unmarshal(data, &js) == nil
}

// ConvertJsonFieldsToText 将JSON字段从BLOB格式转换为TEXT格式
func ConvertJsonFieldsToText() error {
	log.Printf("开始修复数据库中的JSON字段...")

	// 查询所有资源
	var resources []Resource
	err := DB.Select(&resources, "SELECT * FROM resources")
	if err != nil {
		return fmt.Errorf("查询资源失败: %w", err)
	}

	log.Printf("找到 %d 条资源记录需要处理", len(resources))
	fixed := 0

	// 对每个资源进行处理
	for _, resource := range resources {
		// 使用UPDATE语句重新保存资源，这会触发Value()方法，以正确的格式存储JSON
		_, err := DB.Exec(`
			UPDATE resources 
			SET 
				images = ?,
				links = ?,
				supplement = ?,
				approval_history = ?
			WHERE id = ?
		`, resource.Images, resource.Links, resource.Supplement, resource.ApprovalHistory, resource.ID)

		if err != nil {
			log.Printf("更新资源ID=%d的JSON字段失败: %v", resource.ID, err)
		} else {
			fixed++
			if fixed % 10 == 0 { // 每10条记录输出一次日志
				log.Printf("已修复 %d/%d 条记录", fixed, len(resources))
			}
		}
	}

	log.Printf("JSON字段修复完成: 总共%d条记录, 成功修复%d条", len(resources), fixed)
	return nil
}

// InitSiteSettings 初始化网站设置
func InitSiteSettings() error {
	// 默认的页脚设置
	footerSettings := JsonMap{
		"links": []map[string]interface{}{
			{"text": "关于我们", "url": "/about", "type": "internal"},
			{"text": "Telegram", "url": "https://t.me/xueximeng", "icon": "bi-telegram", "type": "external"},
			{"text": "GitHub", "url": "https://github.com/fish2018/GoComicMosaic", "icon": "bi-github", "type": "external"},
			{"text": "在线点播", "url": "/streams", "type": "internal"},
			{"text": "漫迪小站", "url": "https://mdsub.top/", "type": "external"},
			{"text": "三次元成瘾者康复中心", "url": "https://www.kangfuzhongx.in/", "type": "external"},
		},
		"copyright": "© 2025 美漫资源共建. 保留所有权利",
		"show_visitor_count": true,
	}
	
	// 将设置转为JSON
	footerJSON, err := json.Marshal(footerSettings)
	if err != nil {
		return fmt.Errorf("序列化页脚设置失败: %w", err)
	}
	
	// 插入或更新页脚设置
	_, err = DB.Exec(`
		INSERT INTO site_settings (setting_key, setting_value, created_at, updated_at) 
		VALUES ('footer', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT(setting_key) DO UPDATE SET 
		setting_value = ?, 
		updated_at = CURRENT_TIMESTAMP
	`, string(footerJSON), string(footerJSON))
	
	if err != nil {
		return fmt.Errorf("保存页脚设置失败: %w", err)
	}

	// 插入或更新info设置
	_, err = DB.Exec(`
		INSERT INTO site_settings (setting_key, setting_value, created_at, updated_at) 
		VALUES ('info', '{"title": "动漫资源平台", "description": "分享优质动漫资源", "logoText": "动漫资源", "keywords": "动漫,资源,分享", "show_visitor_count": true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		ON CONFLICT(setting_key) DO UPDATE SET 
		setting_value = EXCLUDED.setting_value,
		updated_at = CURRENT_TIMESTAMP
	`)
	
	if err != nil {
		return fmt.Errorf("保存info设置失败: %w", err)
	}
	
	log.Printf("网站设置初始化完成")
	return nil
} 
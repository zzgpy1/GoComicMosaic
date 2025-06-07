package handlers

import (
	"net/http"
	"time"
	"log"
	"github.com/gin-gonic/gin"
	"dongman/internal/models"
	"io"
	"bytes"
	"os"
	"path/filepath"
	"dongman/internal/config"
)

// GetSiteSettings 获取指定key的网站设置
func GetSiteSettings(c *gin.Context) {
	settingKey := c.Param("key")
	if settingKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少setting_key参数"})
		return
	}

	var settings models.SiteSettings
	err := models.GetDB().Get(&settings, "SELECT * FROM site_settings WHERE setting_key = ?", settingKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "未找到指定设置",
			"key":   settingKey,
		})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// GetAllSiteSettings 获取所有网站设置
func GetAllSiteSettings(c *gin.Context) {
	var settings []models.SiteSettings
	err := models.GetDB().Select(&settings, "SELECT * FROM site_settings")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取设置失败"})
		return
	}

	if len(settings) == 0 {
		c.JSON(http.StatusOK, []models.SiteSettings{})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateSiteSettings 更新网站设置
func UpdateSiteSettings(c *gin.Context) {
	// 打印请求头信息
	log.Printf("===== 更新设置请求 =====")
	log.Printf("请求方法: %s", c.Request.Method)
	log.Printf("请求路径: %s", c.Request.URL.Path)
	log.Printf("认证头: %s", c.GetHeader("Authorization"))
	log.Printf("Content-Type: %s", c.GetHeader("Content-Type"))
	
	// 获取原始请求体
	data, err := c.GetRawData()
	if err != nil {
		log.Printf("获取请求体失败: %v", err)
	} else {
		log.Printf("原始请求数据: %s", string(data))
	}
	// 重新设置请求体，否则后续ShouldBindJSON会读取失败
	c.Request.Body = originalBody(data)
	
	settingKey := c.Param("key")
	log.Printf("设置键名: %v", settingKey)
	if settingKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少setting_key参数"})
		return
	}

	var update models.SiteSettingsUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		log.Printf("解析JSON数据失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求数据", "details": err.Error()})
		return
	}
	
	// 打印解析后的数据
	settingValue, err := update.SettingValue.Value()
	if err != nil {
		log.Printf("获取设置值失败: %v", err)
	} else {
		// 根据实际类型进行处理
		switch v := settingValue.(type) {
		case []byte:
			log.Printf("设置值([]byte): %v", string(v))
		case string:
			log.Printf("设置值(string): %v", v)
		default:
			log.Printf("设置值(其他类型): %v", v)
		}
	}

	db := models.GetDB()
	
	// 检查设置是否存在
	var settingExists int
	err = db.Get(&settingExists, "SELECT COUNT(*) FROM site_settings WHERE setting_key = ?", settingKey)
	if err != nil {
		log.Printf("查询设置是否存在失败: %v", err)
	}
	log.Printf("设置是否存在: %v (count=%d)", settingExists > 0, settingExists)
	
	if err != nil || settingExists == 0 {
		// 创建新设置
		settingValue, err := update.SettingValue.Value()
		if err != nil {
			log.Printf("序列化设置值失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "序列化设置值失败"})
			return
		}
		
		result, err := db.Exec(
			"INSERT INTO site_settings (setting_key, setting_value, created_at, updated_at) VALUES (?, ?, ?, ?)",
			settingKey, settingValue, time.Now(), time.Now(),
		)
		if err != nil {
			log.Printf("保存设置失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "保存设置失败", "details": err.Error()})
			return
		}
		id, _ := result.LastInsertId()
		log.Printf("创建新设置成功，ID: %d", id)
	} else {
		// 更新现有设置
		settingValue, err := update.SettingValue.Value()
		if err != nil {
			log.Printf("序列化设置值失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "序列化设置值失败"})
			return
		}
		
		result, err := db.Exec(
			"UPDATE site_settings SET setting_value = ?, updated_at = ? WHERE setting_key = ?",
			settingValue, time.Now(), settingKey,
		)
		if err != nil {
			log.Printf("更新设置失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新设置失败", "details": err.Error()})
			return
		}
		rows, _ := result.RowsAffected()
		log.Printf("更新设置成功，影响行数: %d", rows)
	}

	// 返回更新后的设置
	var settings models.SiteSettings
	err = models.GetDB().Get(&settings, "SELECT * FROM site_settings WHERE setting_key = ?", settingKey)
	if err != nil {
		log.Printf("读取更新后的设置失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "读取更新后的设置失败"})
		return
	}

	log.Printf("更新设置完成，返回结果: %+v", settings)
	c.JSON(http.StatusOK, settings)
}

// originalBody 创建一个可重复读取的请求体
func originalBody(data []byte) io.ReadCloser {
	return io.NopCloser(bytes.NewBuffer(data))
}

// UploadFavicon 处理网站图标上传
func UploadFavicon(c *gin.Context) {
	// 获取上传的文件
	file, err := c.FormFile("favicon")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文件上传"})
		return
	}

	// 确保目录存在
	publicDir := filepath.Join(config.AssetPath, "public")
	if err := os.MkdirAll(publicDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建目录失败"})
		return
	}

	// 保存favicon.ico
	faviconPath := filepath.Join(publicDir, "favicon.ico")
	
	// 保存上传的文件
	if err := c.SaveUploadedFile(file, faviconPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存文件失败"})
		return
	}

	// 增加日志输出
	log.Printf("网站图标已更新，保存路径: %s", faviconPath)
	
	// 确保返回正确的路径
	c.JSON(http.StatusOK, gin.H{
		"message": "网站图标已更新", 
		"faviconPath": "/assets/public/favicon.ico",
	})
}
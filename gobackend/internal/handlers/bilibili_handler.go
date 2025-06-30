package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// BilibiliCookiesHandler 获取B站cookies并返回给前端
func BilibiliCookiesHandler(c *gin.Context) {
	// 创建HTTP客户端
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// 创建请求
	req, err := http.NewRequest("GET", "https://www.bilibili.com/?spm_id_from=333.337.0.0", nil)
	if err != nil {
		log.Printf("创建请求失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建请求失败",
			"data": nil,
		})
		return
	}

	// 设置请求头
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")

	// 执行请求
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("请求B站主页失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "请求B站主页失败",
			"data": nil,
		})
		return
	}
	defer resp.Body.Close()

	// 提取所有cookies
	cookies := make(map[string]string)
	log.Printf("111111111111111111111111111 resp.Cookies() = %+v", resp.Cookies())
	for _, cookie := range resp.Cookies() {
		cookies[cookie.Name] = cookie.Value
		log.Printf("获取到B站Cookie: %s = %s", cookie.Name, cookie.Value)
	}

	// 检查是否获取到了buvid3
	if _, ok := cookies["buvid3"]; !ok {
		log.Printf("警告: 未获取到buvid3 cookie")
	}

	// 将cookies转换为JSON字符串，用于响应头
	cookiesJSON, err := json.Marshal(cookies)
	if err != nil {
		log.Printf("序列化cookies失败: %v", err)
	} else {
		// 在响应头中添加cookies
		c.Header("X-Bilibili-Cookies", string(cookiesJSON))
	}

	// 返回cookies给前端
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "获取B站cookies成功",
		"data": cookies,
	})
} 
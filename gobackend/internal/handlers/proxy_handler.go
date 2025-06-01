package handlers

import (
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ProxyHandler 处理跨域API代理请求
func ProxyHandler(c *gin.Context) {
	// 从查询参数中获取目标URL
	targetURL := c.Query("url")
	if targetURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "缺少url参数",
		})
		return
	}

	// 创建HTTP客户端
	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	// 创建请求
	req, err := http.NewRequest(http.MethodGet, targetURL, nil)
	if err != nil {
		log.Printf("创建请求失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建请求失败",
		})
		return
	}

	// 设置请求头
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "*/*")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9")
	req.Header.Set("Referer", "https://heimuer.xyz/")

	// 执行请求
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("请求目标URL失败: %v, URL: %s", err, targetURL)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "请求目标URL失败",
		})
		return
	}
	defer resp.Body.Close()

	// 设置响应头
	contentType := resp.Header.Get("Content-Type")
	if contentType != "" {
		c.Header("Content-Type", contentType)
	} else {
		c.Header("Content-Type", "application/json")
	}

	// 设置响应状态码
	c.Status(resp.StatusCode)

	// 复制响应体到客户端
	_, err = io.Copy(c.Writer, resp.Body)
	if err != nil {
		log.Printf("复制响应内容失败: %v", err)
	}
} 
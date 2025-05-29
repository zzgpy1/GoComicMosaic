package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"dongman/internal/models"
)

func main() {
	log.Println("开始数据库诊断...")

	// 初始化数据库
	db, err := models.InitDB()
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}
	defer db.Close()

	// 检查数据库位置
	workDir, err := os.Getwd()
	if err != nil {
		log.Fatalf("获取工作目录失败: %v", err)
	}
	log.Printf("当前工作目录: %s", workDir)

	// 检查表结构
	log.Println("\n===== 检查数据库表结构 =====")
	pragmaRows, err := db.Query("PRAGMA table_info(resources)")
	if err != nil {
		log.Fatalf("查询表结构失败: %v", err)
	}
	defer pragmaRows.Close()

	fmt.Println("资源表结构:")
	fmt.Printf("%-4s %-20s %-10s %-8s %-10s\n", "序号", "字段名", "类型", "可空", "默认值")
	fmt.Println(strings.Repeat("-", 60))

	for pragmaRows.Next() {
		var cid int
		var name, type_ string
		var notnull, dfltValue, pk interface{}
		pragmaRows.Scan(&cid, &name, &type_, &notnull, &dfltValue, &pk)
		fmt.Printf("%-4d %-20s %-10s %-8v %-10v\n", cid, name, type_, notnull, dfltValue)
	}
	fmt.Println()

	// 检查资源数量
	log.Println("\n===== 检查资源数量 =====")
	var totalCount int
	err = db.Get(&totalCount, "SELECT COUNT(*) FROM resources")
	if err != nil {
		log.Fatalf("查询资源总数失败: %v", err)
	}
	log.Printf("数据库中总共有 %d 条资源记录", totalCount)

	// 检查资源状态分布
	log.Println("\n===== 检查资源状态分布 =====")
	rows, err := db.Query("SELECT status, COUNT(*) FROM resources GROUP BY status")
	if err != nil {
		log.Fatalf("查询资源状态分布失败: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		rows.Scan(&status, &count)
		log.Printf("状态 [%s]: %d 条记录", status, count)
	}

	// 检查是否存在approved且非supplement的资源
	log.Println("\n===== 检查已批准的非补充资源 =====")
	var approvedCount int
	err = db.Get(&approvedCount, 
		"SELECT COUNT(*) FROM resources WHERE status = ? AND is_supplement_approval = 0", 
		"APPROVED")
	if err != nil {
		log.Fatalf("查询已批准的非补充资源数量失败: %v", err)
	}
	log.Printf("已批准的非补充资源数量: %d", approvedCount)

	// 显示几条样例资源
	log.Println("\n===== 样例资源数据 =====")
	var sampleResources []struct {
		ID                 int       `db:"id"`
		Title              string    `db:"title"`
		Status             string    `db:"status"`
		IsSupplementApproval bool     `db:"is_supplement_approval"`
		LikesCount         int       `db:"likes_count"`
		CreatedAt          time.Time `db:"created_at"`
	}
	err = db.Select(&sampleResources, "SELECT id, title, status, is_supplement_approval, likes_count, created_at FROM resources LIMIT 3")
	if err != nil {
		log.Fatalf("查询样例资源失败: %v", err)
	}

	for i, resource := range sampleResources {
		log.Printf("样例 #%d:", i+1)
		log.Printf("  ID: %d", resource.ID)
		log.Printf("  标题: %s", resource.Title)
		log.Printf("  状态: %s", resource.Status)
		log.Printf("  是否补充批准: %v", resource.IsSupplementApproval)
		log.Printf("  点赞数: %d", resource.LikesCount)
		log.Printf("  创建时间: %v", resource.CreatedAt)
	}

	// 尝试执行前端请求的查询
	log.Println("\n===== 测试前端查询 =====")
	var frontendResources []struct {
		ID         int    `db:"id"`
		Title      string `db:"title"`
		LikesCount int    `db:"likes_count"`
	}
	query := `SELECT id, title, likes_count FROM resources WHERE status = ? ORDER BY likes_count DESC LIMIT ? OFFSET ?`
	args := []interface{}{"APPROVED", 4, 0}

	err = db.Select(&frontendResources, query, args...)
	if err != nil {
		log.Fatalf("执行前端查询失败: %v", err)
	}

	log.Printf("前端查询找到 %d 条资源", len(frontendResources))
	for i, resource := range frontendResources {
		log.Printf("结果 #%d: [ID: %d] %s (点赞: %d)",
			i+1, resource.ID, resource.Title, resource.LikesCount)
	}

	log.Println("\n===== 检查users表结构 =====")
	userPragmaRows, err := db.Query("PRAGMA table_info(users)")
	if err != nil {
		log.Fatalf("查询users表结构失败: %v", err)
	}
	defer userPragmaRows.Close()

	fmt.Println("用户表结构:")
	fmt.Printf("%-4s %-20s %-10s %-8s %-10s\n", "序号", "字段名", "类型", "可空", "默认值")
	fmt.Println(strings.Repeat("-", 60))

	for userPragmaRows.Next() {
		var cid int
		var name, type_ string
		var notnull, dfltValue, pk interface{}
		userPragmaRows.Scan(&cid, &name, &type_, &notnull, &dfltValue, &pk)
		fmt.Printf("%-4d %-20s %-10s %-8v %-10v\n", cid, name, type_, notnull, dfltValue)
	}
	fmt.Println()

	// 检查是否有用户
	log.Println("\n===== 检查用户数量 =====")
	var userCount int
	err = db.Get(&userCount, "SELECT COUNT(*) FROM users")
	if err != nil {
		log.Fatalf("查询用户总数失败: %v", err)
	}
	log.Printf("数据库中总共有 %d 个用户", userCount)
	
	// 如果有用户，显示第一个用户信息（不显示密码）
	if userCount > 0 {
		var users []struct {
			ID       int       `db:"id"`
			Username string    `db:"username"`
			IsAdmin  bool      `db:"is_admin"`
			CreatedAt time.Time `db:"created_at"`
		}
		err = db.Select(&users, "SELECT id, username, is_admin, created_at FROM users LIMIT 3")
		if err != nil {
			log.Fatalf("查询用户信息失败: %v", err)
		}
		
		for i, user := range users {
			log.Printf("用户 #%d:", i+1)
			log.Printf("  ID: %d", user.ID)
			log.Printf("  用户名: %s", user.Username)
			log.Printf("  是否管理员: %v", user.IsAdmin)
			log.Printf("  创建时间: %v", user.CreatedAt)
		}
	}
	
	// 尝试获取admin用户信息
	log.Println("\n===== 检查admin用户 =====")
	
	// 分开获取admin用户信息和密码
	var adminUser struct {
		ID       int       `db:"id"`
		Username string    `db:"username"`
		IsAdmin  bool      `db:"is_admin"`
		CreatedAt time.Time `db:"created_at"`
	}
	
	err = db.Get(&adminUser, "SELECT id, username, is_admin, created_at FROM users WHERE username = ?", "admin")
	if err != nil {
		log.Printf("查询admin用户失败: %v", err)
	} else {
		// 单独获取密码哈希长度
		var hashedPassword string
		err = db.Get(&hashedPassword, "SELECT hashed_password FROM users WHERE username = ?", "admin")
		if err != nil {
			log.Printf("获取admin密码哈希失败: %v", err)
		}
		
		log.Printf("找到admin用户:")
		log.Printf("  ID: %d", adminUser.ID)
		log.Printf("  用户名: %s", adminUser.Username)
		log.Printf("  密码哈希长度: %d", len(hashedPassword))
		log.Printf("  是否管理员: %v", adminUser.IsAdmin)
		log.Printf("  创建时间: %v", adminUser.CreatedAt)
	}
	
	// 查询前端请求的表单
	log.Println("\n===== 前端登录请求格式参考 =====")
	log.Printf(`请确保前端发送的登录请求格式如下:
{
  "username": "admin",
  "password": "admin123"
}

登录API地址: POST /api/auth/token`)

	// 测试登录请求
	log.Println("\n===== 测试登录API =====")
	log.Printf("现在将使用默认账号 admin/admin123 测试登录API")
	
	// 创建测试HTTP客户端
	log.Printf("请确保API服务器正在运行，测试将向 http://localhost:8000/api/auth/token 发送请求")
	log.Printf("请求头: Content-Type: application/json")
	log.Printf("请求体: {\"username\":\"admin\",\"password\":\"admin123\"}")
	
	// 构建请求体
	loginReq := struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}{
		Username: "admin",
		Password: "admin123",
	}
	
	loginReqJSON, err := json.Marshal(loginReq)
	if err != nil {
		log.Printf("序列化登录请求失败: %v", err)
	} else {
		// 发送HTTP请求
		resp, err := http.Post(
			"http://localhost:8000/api/auth/token",
			"application/json",
			bytes.NewBuffer(loginReqJSON),
		)
		
		if err != nil {
			log.Printf("发送登录请求失败: %v", err)
			log.Printf("这可能是因为API服务器未运行，请确保服务器已启动")
		} else {
			defer resp.Body.Close()
			
			// 读取响应
			var respBody map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&respBody)
			
			log.Printf("HTTP状态码: %d", resp.StatusCode)
			if err != nil {
				log.Printf("解析响应失败: %v", err)
				
				// 尝试读取原始响应
				buf := new(bytes.Buffer)
				buf.ReadFrom(resp.Body)
				log.Printf("原始响应: %s", buf.String())
			} else {
				log.Printf("响应体: %v", respBody)
				
				if resp.StatusCode == 200 {
					log.Printf("登录成功！获取到令牌")
				} else {
					log.Printf("登录失败，请检查用户名和密码")
				}
			}
		}
	}
	
	log.Printf(`要在命令行测试登录，请执行以下命令:
curl -X POST http://localhost:8000/api/auth/token \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'`)
     
	log.Printf(`如果前端使用fetch或axios发送请求，请确保格式如下:
fetch('http://localhost:8000/api/auth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})`)

	log.Println("\n诊断完成!")
}

func resetResourceData() error {
	// 删除所有现有资源
	_, err := models.DB.Exec("DELETE FROM resources")
	if err != nil {
		return fmt.Errorf("清空资源表失败: %w", err)
	}
	
	// 重置自增ID
	_, err = models.DB.Exec("DELETE FROM sqlite_sequence WHERE name='resources'")
	if err != nil {
		log.Printf("重置资源表自增ID失败 (非致命错误): %v", err)
	}
	
	// 创建新的示例数据
	return createSampleResources()
}

func createSampleResources() error {
	sampleResources := []models.Resource{
		{
			Title:                "进击的巨人",
			TitleEn:              "Attack on Titan",
			Description:          "人类与巨人的生存之战",
			ResourceType:         "anime",
			Status:               models.ResourceStatusApproved,
			Images:               []string{"/assets/imgs/1/sample1.jpg"},
			Links:                models.JsonMap{"官网": "https://example.com/aot"},
			LikesCount:           120,
			IsSupplementApproval: false,
			CreatedAt:            time.Now(),
			UpdatedAt:            time.Now(),
		},
		{
			Title:                "鬼灭之刃",
			TitleEn:              "Demon Slayer",
			Description:          "少年与恶魔的战斗故事",
			ResourceType:         "anime",
			Status:               models.ResourceStatusApproved,
			Images:               []string{"/assets/imgs/2/sample2.jpg"},
			Links:                models.JsonMap{"官网": "https://example.com/ds"},
			LikesCount:           150,
			IsSupplementApproval: false,
			CreatedAt:            time.Now(),
			UpdatedAt:            time.Now(),
		},
		{
			Title:                "海贼王",
			TitleEn:              "One Piece",
			Description:          "寻找传说中的大秘宝「ONE PIECE」的海洋冒险故事",
			ResourceType:         "anime",
			Status:               models.ResourceStatusApproved,
			Images:               []string{"/assets/imgs/3/sample3.jpg"},
			Links:                models.JsonMap{"官网": "https://example.com/op"},
			LikesCount:           200,
			IsSupplementApproval: false,
			CreatedAt:            time.Now(),
			UpdatedAt:            time.Now(),
		},
	}

	// 插入示例数据
	for _, resource := range sampleResources {
		_, err := models.DB.Exec(
			`INSERT INTO resources (
				title, title_en, description, resource_type, images, links,
				status, likes_count, is_supplement_approval, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			resource.Title, resource.TitleEn, resource.Description, resource.ResourceType,
			resource.Images, resource.Links, resource.Status, resource.LikesCount,
			resource.IsSupplementApproval, resource.CreatedAt, resource.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("插入示例资源失败: %w", err)
		}
	}

	return nil
} 
package main

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/urfave/cli/v2"
)

// 配置结构体
type Config struct {
	BaseURL           string   // 网站基础URL
	OutputDir         string   // 输出目录
	APIBaseURL        string   // API基础URL
	TestMode          bool     // 是否为测试模式
	BatchSize         int      // 每次API请求的资源数量限制
	ConcurrentRequests int     // 并发请求数量
	RequestDelay      int      // 并发请求间隔时间(毫秒)
	MaxURLsPerSitemap int      // 每个sitemap文件中的最大URL数量
	CreateSitemapIndex bool    // 是否创建sitemap索引
	StaticRoutes      []Route  // 静态路由
}

// 路由结构体
type Route struct {
	Path       string  // 路径
	Changefreq string  // 更新频率
	Priority   float64 // 优先级
}

// Sitemap结构体
type URLSet struct {
	XMLName xml.Name `xml:"urlset"`
	Xmlns   string   `xml:"xmlns,attr"`
	URLs    []URL    `xml:"url"`
}

// URL结构体
type URL struct {
	Loc        string `xml:"loc"`
	LastMod    string `xml:"lastmod,omitempty"`
	ChangeFreq string `xml:"changefreq,omitempty"`
	Priority   string `xml:"priority,omitempty"`
}

// Sitemap索引结构体
type SitemapIndex struct {
	XMLName xml.Name `xml:"sitemapindex"`
	Xmlns   string   `xml:"xmlns,attr"`
	Sitemaps []Sitemap `xml:"sitemap"`
}

// Sitemap引用结构体
type Sitemap struct {
	Loc     string `xml:"loc"`
	LastMod string `xml:"lastmod"`
}

// Resource 资源结构体
type Resource struct {
	ID        interface{} `json:"id"`
	ResourceID interface{} `json:"resourceId"`
	Title     string      `json:"title"`
	UpdatedAt interface{} `json:"updated_at"`
	CreatedAt interface{} `json:"created_at"`
	UpdateTime interface{} `json:"updateTime"`
	CreateTime interface{} `json:"createTime"`
	TotalCount interface{} `json:"total_count,omitempty"` // 总数计数，仅在第一个资源中可能存在
}

// API响应结构体
type APIResponse struct {
	Resources []Resource `json:"resources"`
	Data      []Resource `json:"data"`
	Total     int        `json:"total"`
}

// 测试资源
var testResources = []Resource{
	{ID: 1, Title: "测试资源1", UpdatedAt: time.Now().Format(time.RFC3339)},
	{ID: 2, Title: "测试资源2", UpdatedAt: time.Now().Format(time.RFC3339)},
	{ID: 3, Title: "测试资源3", UpdatedAt: time.Now().Format(time.RFC3339)},
	{ID: 4, Title: "测试资源4", UpdatedAt: time.Now().Format(time.RFC3339)},
	{ID: 5, Title: "测试资源5", UpdatedAt: time.Now().Format(time.RFC3339)},
}

func main() {
	app := &cli.App{
		Name:  "sitemap-generator",
		Usage: "生成动漫资源网站的sitemap.xml文件",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "baseurl",
				Aliases: []string{"b"},
				Value:   "https://example.com",
				Usage:   "设置站点域名",
				EnvVars: []string{"BASE_URL"},
			},
			&cli.StringFlag{
				Name:    "api",
				Aliases: []string{"a"},
				Value:   "",
				Usage:   "设置API基础URL (默认为baseurl/api或http://localhost:8000/api)",
			},
			&cli.StringFlag{
				Name:    "output",
				Aliases: []string{"o"},
				Value:   "public",
				Usage:   "输出目录路径",
			},
			&cli.BoolFlag{
				Name:    "test",
				Aliases: []string{"t"},
				Value:   false,
				Usage:   "使用测试模式",
			},
			&cli.IntFlag{
				Name:  "batch-size",
				Value: 100,
				Usage: "每次API请求的资源数量限制",
			},
			&cli.IntFlag{
				Name:  "concurrent",
				Value: 10,
				Usage: "并发请求数量",
			},
			&cli.IntFlag{
				Name:  "delay",
				Value: 100,
				Usage: "并发请求间隔时间(毫秒)",
			},
			&cli.IntFlag{
				Name:  "max-urls",
				Value: 50000,
				Usage: "每个sitemap文件中的最大URL数量",
			},
			&cli.BoolFlag{
				Name:  "create-index",
				Value: true,
				Usage: "是否创建sitemap索引",
			},
		},
		Action: func(c *cli.Context) error {
			baseURL := c.String("baseurl")
			apiBaseURL := c.String("api")
			outputDir := c.String("output")
			
			// 确保baseURL不以/结尾
			baseURL = strings.TrimSuffix(baseURL, "/")
			
			// 如果未指定API URL，则使用默认值
			if apiBaseURL == "" {
				apiBaseURL = baseURL + "/api"
				// 如果baseURL是默认值，使用本地开发URL
				if baseURL == "https://example.com" {
					apiBaseURL = "http://localhost:8000/api"
				}
			}
			
			// 确保apiBaseURL不以/结尾
			apiBaseURL = strings.TrimSuffix(apiBaseURL, "/")
			
			config := Config{
				BaseURL:           baseURL,
				OutputDir:         outputDir,
				APIBaseURL:        apiBaseURL,
				TestMode:          c.Bool("test"),
				BatchSize:         c.Int("batch-size"),
				ConcurrentRequests: c.Int("concurrent"),
				RequestDelay:      c.Int("delay"),
				MaxURLsPerSitemap: c.Int("max-urls"),
				CreateSitemapIndex: c.Bool("create-index"),
				StaticRoutes: []Route{
					{Path: "/", Changefreq: "daily", Priority: 1.0},
					{Path: "/submit", Changefreq: "weekly", Priority: 0.8},
					{Path: "/about", Changefreq: "monthly", Priority: 0.7},
				},
			}
			
			log.Println("站点地图生成器启动")
			log.Printf("使用API基础URL: %s", config.APIBaseURL)
			log.Printf("输出目录: %s", config.OutputDir)
			log.Printf("测试模式: %v", config.TestMode)
			
			return generateSitemap(config)
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}

// 生成站点地图
func generateSitemap(config Config) error {
	// 确保输出目录存在
	if err := os.MkdirAll(config.OutputDir, 0755); err != nil {
		return fmt.Errorf("创建输出目录失败: %w", err)
	}

	log.Println("开始生成站点地图...")

	// 生成静态URL
	staticURLs := generateStaticURLs(config)

	// 尝试生成动态URL
	dynamicURLs, err := generateDynamicURLs(config)
	if err != nil {
		log.Printf("无法获取动态URL，只生成静态站点地图: %v", err)
		dynamicURLs = []URL{}
	}

	// 计算总URL数量
	totalURLs := len(staticURLs) + len(dynamicURLs)
	log.Printf("站点地图包含: %d 个静态URL + %d 个动态URL = 共 %d 个URL", 
		len(staticURLs), len(dynamicURLs), totalURLs)

	// 所有URLs
	allURLs := append(staticURLs, dynamicURLs...)

	// 如果URL数量较少，直接生成单个sitemap文件
	if totalURLs <= config.MaxURLsPerSitemap {
		urlset := URLSet{
			Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
			URLs:  allURLs,
		}

		// 写入文件
		outputPath := filepath.Join(config.OutputDir, "sitemap.xml")
		if err := writeSitemapToFile(urlset, outputPath); err != nil {
			return fmt.Errorf("写入sitemap文件失败: %w", err)
		}

		log.Printf("站点地图已生成: %s", outputPath)
	} else {
		// 如果URL数量较多，需要分割sitemap
		log.Printf("URL数量(%d)超过每个sitemap的最大限制(%d)，将分割生成多个sitemap文件",
			totalURLs, config.MaxURLsPerSitemap)

		sitemapFiles := []struct {
			FileName string
			Count    int
		}{}

		// 分批生成sitemap文件
		batchCount := (totalURLs + config.MaxURLsPerSitemap - 1) / config.MaxURLsPerSitemap
		log.Printf("需要生成 %d 个sitemap文件", batchCount)

		for i := 0; i < batchCount; i++ {
			startIndex := i * config.MaxURLsPerSitemap
			endIndex := (i + 1) * config.MaxURLsPerSitemap
			if endIndex > totalURLs {
				endIndex = totalURLs
			}

			batchURLs := allURLs[startIndex:endIndex]

			urlset := URLSet{
				Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
				URLs:  batchURLs,
			}

			// 文件名格式: sitemap-1.xml, sitemap-2.xml, ...
			sitemapFileName := fmt.Sprintf("sitemap-%d.xml", i+1)
			outputPath := filepath.Join(config.OutputDir, sitemapFileName)

			if err := writeSitemapToFile(urlset, outputPath); err != nil {
				return fmt.Errorf("写入分割sitemap文件失败: %w", err)
			}

			sitemapFiles = append(sitemapFiles, struct {
				FileName string
				Count    int
			}{
				FileName: sitemapFileName,
				Count:    len(batchURLs),
			})

			log.Printf("生成sitemap文件 %d/%d: %s (包含 %d 个URL)",
				i+1, batchCount, outputPath, len(batchURLs))
		}

		// 如果需要创建sitemap索引文件
		if config.CreateSitemapIndex {
			today := time.Now().Format("2006-01-02")
			sitemaps := make([]Sitemap, len(sitemapFiles))

			for i, file := range sitemapFiles {
				sitemaps[i] = Sitemap{
					Loc:     fmt.Sprintf("%s/%s", config.BaseURL, file.FileName),
					LastMod: today,
				}
			}

			sitemapIndex := SitemapIndex{
				Xmlns:    "http://www.sitemaps.org/schemas/sitemap/0.9",
				Sitemaps: sitemaps,
			}

			indexPath := filepath.Join(config.OutputDir, "sitemap.xml")
			if err := writeSitemapIndexToFile(sitemapIndex, indexPath); err != nil {
				return fmt.Errorf("写入sitemap索引文件失败: %w", err)
			}

			log.Printf("生成sitemap索引文件: %s (引用 %d 个sitemap文件)",
				indexPath, len(sitemapFiles))
		}
	}

	log.Println("站点地图生成完成！")
	return nil
}

// 生成静态URL
func generateStaticURLs(config Config) []URL {
	today := time.Now().Format("2006-01-02")
	urls := make([]URL, len(config.StaticRoutes))

	for i, route := range config.StaticRoutes {
		urls[i] = URL{
			Loc:        fmt.Sprintf("%s%s", config.BaseURL, route.Path),
			LastMod:    today,
			ChangeFreq: route.Changefreq,
			Priority:   fmt.Sprintf("%.1f", route.Priority),
		}
	}

	return urls
}

// 获取单个批次的资源
func fetchResourceBatch(apiBaseURL string, skip, limit int, sortBy, sortOrder string) ([]Resource, int, error) {
	apiUrl := fmt.Sprintf("%s/resources/public?skip=%d&limit=%d&sort_by=%s&sort_order=%s",
		apiBaseURL, skip, limit, sortBy, sortOrder)
	log.Printf("请求资源数据: skip=%d, limit=%d", skip, limit)

	resp, err := http.Get(apiUrl)
	if err != nil {
		return nil, 0, fmt.Errorf("API请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, 0, fmt.Errorf("API返回非200状态码: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, 0, fmt.Errorf("读取响应体失败: %w", err)
	}

	// 首先尝试解析为资源数组（新的API返回格式）
	var resources []Resource
	if err := json.Unmarshal(body, &resources); err == nil {
		// 成功解析为数组
		log.Printf("成功解析为资源数组，获取到资源(skip=%d): %d条", skip, len(resources))
		
		// 从第一个资源的TotalCount字段获取总数
		total := 0
		if len(resources) > 0 && resources[0].TotalCount != nil {
			// 尝试转换TotalCount为整数
			switch v := resources[0].TotalCount.(type) {
			case float64:
				total = int(v)
			case int:
				total = v
			case int64:
				total = int(v)
			case string:
				if t, err := strconv.Atoi(v); err == nil {
					total = t
				}
			}
			log.Printf("从第一个资源TotalCount字段获取总数: %d", total)
		}
		
		// 如果无法从TotalCount获取，则使用资源数组长度作为总数
		if total == 0 {
			total = len(resources)
			log.Printf("无法获取总数信息，使用资源数组长度作为总数: %d", total)
		}
		
		return resources, total, nil
	}
	
	// 如果解析为数组失败，尝试旧的对象格式
	var apiResp APIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		// 尝试不同的响应结构
		var rawResp map[string]interface{}
		if jsonErr := json.Unmarshal(body, &rawResp); jsonErr != nil {
			return nil, 0, fmt.Errorf("解析JSON失败: %w", err)
		}
		
		// 检查不同可能的数据结构
		resources := []Resource{}
		total := 0
		
		// 尝试从resources字段获取
		if resourcesData, ok := rawResp["resources"].([]interface{}); ok {
			for _, r := range resourcesData {
				if resourceMap, ok := r.(map[string]interface{}); ok {
					resources = append(resources, mapToResource(resourceMap))
				}
			}
		}
		
		// 尝试从data字段获取
		if resourcesData, ok := rawResp["data"].([]interface{}); ok && len(resources) == 0 {
			for _, r := range resourcesData {
				if resourceMap, ok := r.(map[string]interface{}); ok {
					resources = append(resources, mapToResource(resourceMap))
				}
			}
		}
		
		// 获取总数
		if totalValue, ok := rawResp["total"].(float64); ok {
			total = int(totalValue)
		}
		
		log.Printf("获取到资源(skip=%d): %d条", skip, len(resources))
		return resources, total, nil
	}
	
	// 从标准响应结构获取资源
	resultResources := []Resource{}
	if len(apiResp.Resources) > 0 {
		resultResources = apiResp.Resources
	} else if len(apiResp.Data) > 0 {
		resultResources = apiResp.Data
	}
	
	log.Printf("获取到资源(skip=%d): %d条", skip, len(resultResources))
	return resultResources, apiResp.Total, nil
}

// 将map转换为Resource结构体
func mapToResource(m map[string]interface{}) Resource {
	return Resource{
		ID:         m["id"],
		ResourceID: m["resourceId"],
		Title:      toString(m["title"]),
		UpdatedAt:  m["updated_at"],
		CreatedAt:  m["created_at"],
		UpdateTime: m["updateTime"],
		CreateTime: m["createTime"],
	}
}

// 将任意值转换为字符串
func toString(v interface{}) string {
	if v == nil {
		return ""
	}
	return fmt.Sprintf("%v", v)
}

// 生成动态URL
func generateDynamicURLs(config Config) ([]URL, error) {
	// 如果是测试模式，使用测试数据
	if config.TestMode {
		log.Println("使用测试模式，生成测试资源URL")
		urls := make([]URL, len(testResources))

		for i, resource := range testResources {
			updatedAt := ""
			if str, ok := resource.UpdatedAt.(string); ok {
				updatedAt = strings.Split(str, "T")[0]
			} else {
				updatedAt = time.Now().Format("2006-01-02")
			}

			urls[i] = URL{
				Loc:        fmt.Sprintf("%s/resource/%v", config.BaseURL, resource.ID),
				LastMod:    updatedAt,
				ChangeFreq: "weekly",
				Priority:   "0.9",
			}
		}

		return urls, nil
	}

	try := func() ([]URL, error) {
		// 分批次获取所有资源
		log.Println("开始获取所有资源数据...")

		// 发送第一个请求获取第一批数据
		log.Println("发送首次请求获取数据...")
		firstBatchSize := config.BatchSize
		firstBatch, total, err := fetchResourceBatch(config.APIBaseURL, 0, firstBatchSize, "likes_count", "desc")
		if err != nil {
			return nil, fmt.Errorf("获取第一批数据失败: %w", err)
		}

		// 如果第一批数据已经不足批次大小，则表明数据已全部获取
		if len(firstBatch) < firstBatchSize {
			log.Printf("首次请求获取 %d 条数据，少于批次大小 %d，表明已获取全部数据",
				len(firstBatch), firstBatchSize)

			return resourcesAsURLs(firstBatch, config.BaseURL), nil
		}

		// 如果还需要更多数据，继续并发请求
		log.Printf("首次请求获取 %d 条数据，达到批次大小，需要继续获取更多数据", len(firstBatch))
		allResources := firstBatch

		// 估计总数量
		totalCount := total
		if totalCount == 0 {
			// 如果API没有返回总数，则推测总数
			totalCount = max(1000, len(firstBatch)*2)
		}
		log.Printf("估计总资源数量: %d", totalCount)

		// 计算需要的批次数
		batchSize := config.BatchSize
		remainingBatches := (totalCount - len(firstBatch) + batchSize - 1) / batchSize
		log.Printf("已获取第一批 %d 条，预计还需要 %d 个批次请求", len(firstBatch), remainingBatches)

		// 准备剩余的请求
		remainingRequests := make([]struct {
			Skip  int
			Limit int
		}, remainingBatches)

		for i := 0; i < remainingBatches; i++ {
			skip := firstBatchSize + i*batchSize
			remainingRequests[i] = struct {
				Skip  int
				Limit int
			}{
				Skip:  skip,
				Limit: batchSize,
			}
		}

		// 如果没有剩余请求，直接返回第一批数据
		if len(remainingRequests) == 0 {
			log.Println("无需进一步请求，已获取所有数据")
			return resourcesAsURLs(allResources, config.BaseURL), nil
		}

		// 分组进行并发请求
		concurrentBatchSize := config.ConcurrentRequests
		dataCompletelyFetched := false

		// 按并发数量分组处理请求
		for batchIndex := 0; batchIndex < len(remainingRequests) && !dataCompletelyFetched; batchIndex += concurrentBatchSize {
			endIndex := batchIndex + concurrentBatchSize
			if endIndex > len(remainingRequests) {
				endIndex = len(remainingRequests)
			}
			
			currentBatchRequests := remainingRequests[batchIndex:endIndex]
			log.Printf("处理并发批次 %d/%d, 包含%d个请求",
				batchIndex/concurrentBatchSize+1,
				(len(remainingRequests)+concurrentBatchSize-1)/concurrentBatchSize,
				len(currentBatchRequests))

			// 并发执行当前批次的所有请求
			var wg sync.WaitGroup
			resultsChan := make(chan struct {
				Resources []Resource
				Index     int
				Complete  bool
			}, len(currentBatchRequests))

			for i, req := range currentBatchRequests {
				wg.Add(1)
				go func(i int, skip, limit int) {
					defer wg.Done()
					resources, _, err := fetchResourceBatch(config.APIBaseURL, skip, limit, "likes_count", "desc")
					
					complete := false
					if err != nil {
						log.Printf("请求失败(skip=%d): %v", skip, err)
					} else if len(resources) < limit {
						// 返回数据少于请求数量，表示已到达数据末尾
						complete = true
					}
					
					resultsChan <- struct {
						Resources []Resource
						Index     int
						Complete  bool
					}{
						Resources: resources,
						Index:     i,
						Complete:  complete,
					}
				}(i, req.Skip, req.Limit)
			}

			// 等待所有goroutine完成
			go func() {
				wg.Wait()
				close(resultsChan)
			}()

			// 收集结果
			resourcesInBatch := 0
			for result := range resultsChan {
				if len(result.Resources) > 0 {
					allResources = append(allResources, result.Resources...)
					resourcesInBatch += len(result.Resources)

					if result.Complete {
						log.Printf("请求 %d/%d 返回数据不足 %d 条，表明已到达数据末尾",
							currentBatchRequests[result.Index].Skip,
							currentBatchRequests[result.Index].Limit,
							batchSize)
						dataCompletelyFetched = true
					}
				}
			}

			log.Printf("当前批次获取到%d条资源，累计%d条", resourcesInBatch, len(allResources))

			// 如果当前批次获取的资源数量小于预期，很可能已经获取了所有数据
			expectedResourcesInBatch := min(
				len(currentBatchRequests)*batchSize,
				totalCount-batchIndex*batchSize,
			)

			if resourcesInBatch < expectedResourcesInBatch {
				log.Printf("资源数量小于预期(%d < %d)，标记为已获取全部数据",
					resourcesInBatch, expectedResourcesInBatch)
				dataCompletelyFetched = true
			}

			// 添加延迟，避免请求过于频繁
			if !dataCompletelyFetched && batchIndex+concurrentBatchSize < len(remainingRequests) {
				log.Printf("等待%d毫秒后继续下一批请求...", config.RequestDelay)
				time.Sleep(time.Duration(config.RequestDelay) * time.Millisecond)
			}
		}

		log.Printf("成功获取所有资源，共%d条", len(allResources))

		// 如果未获取到任何资源，使用测试数据
		if len(allResources) == 0 {
			log.Println("未获取到任何资源数据，将使用测试数据")
			return generateDynamicURLs(Config{
				BaseURL:  config.BaseURL,
				TestMode: true,
			})
		}

		// 对资源进行去重
		uniqueResources := []Resource{}
		resourceIDs := make(map[string]bool)

		for _, resource := range allResources {
			id := getResourceID(resource)
			if id != "" && !resourceIDs[id] {
				resourceIDs[id] = true
				uniqueResources = append(uniqueResources, resource)
			}
		}

		log.Printf("去重后资源数量: %d", len(uniqueResources))

		// 将资源转换为URL
		return resourcesAsURLs(uniqueResources, config.BaseURL), nil
	}
	
	urls, err := try()
	if err != nil {
		log.Printf("获取动态资源失败: %v", err)
		log.Println("由于API请求失败，使用测试数据生成资源URL")
		return generateDynamicURLs(Config{
			BaseURL:  config.BaseURL,
			TestMode: true,
		})
	}
	
	return urls, nil
}

// 获取资源ID
func getResourceID(resource Resource) string {
	if resource.ID != nil {
		return fmt.Sprintf("%v", resource.ID)
	}
	if resource.ResourceID != nil {
		return fmt.Sprintf("%v", resource.ResourceID)
	}
	return ""
}

// 将资源转换为URL
func resourcesAsURLs(resources []Resource, baseURL string) []URL {
	urls := make([]URL, 0, len(resources))

	for _, resource := range resources {
		id := getResourceID(resource)
		if id == "" {
			continue
		}

		lastmod := getLastModifiedDate(resource)
		
		urls = append(urls, URL{
			Loc:        fmt.Sprintf("%s/resource/%s", baseURL, id),
			LastMod:    lastmod,
			ChangeFreq: "weekly",
			Priority:   "0.9",
		})
	}

	return urls
}

// 获取最后修改日期
func getLastModifiedDate(resource Resource) string {
	// 尝试多种可能的日期字段
	for _, field := range []interface{}{
		resource.UpdatedAt, 
		resource.UpdateTime,
		resource.CreatedAt,
		resource.CreateTime,
	} {
		if field == nil {
			continue
		}
		
		// 如果是字符串，尝试解析
		if dateStr, ok := field.(string); ok && dateStr != "" {
			if t, err := time.Parse(time.RFC3339, dateStr); err == nil {
				return t.Format("2006-01-02")
			}
			
			// 可能是其他格式的日期字符串，截取前10个字符
			if len(dateStr) >= 10 {
				return dateStr[:10]
			}
			
			return dateStr
		}
		
		// 如果是数字（Unix时间戳）
		if timestamp, ok := field.(float64); ok {
			return time.Unix(int64(timestamp), 0).Format("2006-01-02")
		}
		
		// 如果是整数时间戳
		if timestamp, ok := field.(int64); ok {
			return time.Unix(timestamp, 0).Format("2006-01-02")
		}
	}
	
	// 如果都没有找到，使用当前日期
	return time.Now().Format("2006-01-02")
}

// 写入sitemap文件
func writeSitemapToFile(urlset URLSet, outputPath string) error {
	// 创建输出文件
	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("创建输出文件失败: %w", err)
	}
	defer file.Close()

	// 写入XML头
	file.WriteString(xml.Header)

	// 编码并写入XML
	encoder := xml.NewEncoder(file)
	encoder.Indent("", "  ")
	if err := encoder.Encode(urlset); err != nil {
		return fmt.Errorf("XML编码失败: %w", err)
	}

	return nil
}

// 写入sitemap索引文件
func writeSitemapIndexToFile(index SitemapIndex, outputPath string) error {
	// 创建输出文件
	file, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("创建输出文件失败: %w", err)
	}
	defer file.Close()

	// 写入XML头
	file.WriteString(xml.Header)

	// 编码并写入XML
	encoder := xml.NewEncoder(file)
	encoder.Indent("", "  ")
	if err := encoder.Encode(index); err != nil {
		return fmt.Errorf("XML编码失败: %w", err)
	}

	return nil
}

// min returns the smaller of x or y.
func min(x, y int) int {
	if x < y {
		return x
	}
	return y
}

// max returns the larger of x or y.
func max(x, y int) int {
	if x > y {
		return x
	}
	return y
} 
package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"dongman/internal/models"
	"dongman/internal/utils"
)

// GetResources 获取资源列表 - 认证用户可获取，管理员可看到全部，普通用户仅能看到已批准的资源
func GetResources(c *gin.Context) {
	// 解析查询参数
	skip, _ := strconv.Atoi(c.DefaultQuery("skip", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	includeHistory := c.DefaultQuery("include_history", "false") == "true"

	// 获取当前用户
	user, _ := GetCurrentUser(c)
	isAdmin := user != nil && user.IsAdmin

	var resources []models.Resource
	var err error

	// 构建查询
	query := `SELECT * FROM resources`
	var args []interface{}
	var countQuery string

	if isAdmin {
		query += ` WHERE hidden_from_admin IS NULL OR hidden_from_admin = 0 AND approval_history IS NOT NULL`
		countQuery = `SELECT COUNT(*) FROM resources WHERE hidden_from_admin IS NULL OR hidden_from_admin = 0`
	} else {
		query += ` WHERE status = ?`
		args = append(args, models.ResourceStatusApproved)
		countQuery = `SELECT COUNT(*) FROM resources WHERE status = ?`
	}

	// 添加分页
	query += ` LIMIT ? OFFSET ?`
	args = append(args, limit, skip)

	log.Printf("query : %+v    args : %+v", query, args)

	// 执行查询
	err = models.DB.Select(&resources, query, args...)
	if err != nil {
		log.Printf("查询资源失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询资源失败"})
		return
	}

	log.Printf("resources : %+v", resources)

	// 如果不需要包含历史记录，清空approval_history字段
	if !includeHistory {
		for i := range resources {
			resources[i].ApprovalHistory = nil
		}
	}

	// 获取总计数
	var totalCount int
	if len(resources) > 0 {
		countArgs := args[:len(args)-2] // 去掉分页参数
		err = models.DB.Get(&totalCount, countQuery, countArgs...)
		if err != nil {
			log.Printf("计算资源总数失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "计算资源总数失败"})
			return
		}
		resources[0].TotalCount = &totalCount
	}

	c.JSON(http.StatusOK, resources)
}


// GetPendingResources 获取待审批的资源 - 仅管理员可访问
func GetPendingResources(c *gin.Context) {
	// 解析查询参数
	skip, _ := strconv.Atoi(c.DefaultQuery("skip", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	log.Printf("获取待审批资源: skip=%d, limit=%d", skip, limit)

	// 存储最终结果的切片
	var allPendingResources []models.Resource
	
	// 查询初始待审批资源
	var pendingResources []models.Resource
	err := models.DB.Select(&pendingResources, 
		`SELECT * FROM resources WHERE status = ?`, models.ResourceStatusPending)
	if err != nil {
		log.Printf("查询待审批资源失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询待审批资源失败"})
		return
	}
	
	// 添加初始待审批资源到结果集
	if pendingResources != nil {
		log.Printf("找到 %d 个初始待审批资源", len(pendingResources))
		allPendingResources = append(allPendingResources, pendingResources...)
	}

	// 记录已添加的资源ID，避免重复
	addedResourceIDs := make(map[int]bool)
	for _, resource := range allPendingResources {
		addedResourceIDs[resource.ID] = true
	}

	// 查询补充待审批资源
	var supplementResources []models.Resource
	err = models.DB.Select(&supplementResources, 
		`SELECT * FROM resources WHERE supplement IS NOT NULL AND (is_supplement_approval = 0 OR is_supplement_approval = 'False')`)
	if err != nil {
		log.Printf("查询待审批补充资源失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询待审批补充资源失败"})
		return
	}
	
	if supplementResources != nil {
		log.Printf("找到 %d 个可能有补充内容的资源", len(supplementResources))
		
		// 筛选待审批的补充内容资源
		for _, resource := range supplementResources {
			// 如果该资源ID已经在结果集中，跳过
			if addedResourceIDs[resource.ID] {
				continue
			}
			
			log.Printf("处理资源ID=%d的补充内容", resource.ID)
			
			if resource.Supplement == nil || len(resource.Supplement) == 0 {
				log.Printf("资源ID=%d的补充内容为空", resource.ID)
				continue
			}

			log.Printf("资源ID=%d的补充内容: %v", resource.ID, resource.Supplement)

			status, ok := resource.Supplement["status"]
			if !ok {
				log.Printf("资源ID=%d的补充内容没有status字段", resource.ID)
				continue
			}

			// 安全地转换status到字符串
			var statusStr string
			switch s := status.(type) {
			case string:
				statusStr = strings.ToLower(s) // 转换为小写以便比较
			case float64:
				log.Printf("警告：资源ID=%d的status字段是数字: %f", resource.ID, s)
				continue
			default:
				log.Printf("警告：资源ID=%d的status字段类型不支持: %T", resource.ID, status)
				continue
			}

			// 不区分大小写比较
			if strings.ToLower(string(models.ResourceStatusPending)) == statusStr {
				log.Printf("资源ID=%d有待审批的补充内容", resource.ID)
				resource.HasPendingSupplement = true
				allPendingResources = append(allPendingResources, resource)
				addedResourceIDs[resource.ID] = true
			} else {
				log.Printf("资源ID=%d的补充内容状态不是待审批: %s", resource.ID, statusStr)
			}
		}
	}
	
	log.Printf("总共找到 %d 个待审批资源（初始审批+补充审批）", len(allPendingResources))
	
	// 应用分页
	startIndex := skip
	endIndex := skip + limit
	
	if startIndex >= len(allPendingResources) {
		// 如果起始索引超出范围，返回空数组
		c.JSON(http.StatusOK, []models.Resource{})
		return
	}
	
	if endIndex > len(allPendingResources) {
		endIndex = len(allPendingResources)
	}
	
	pagedResources := allPendingResources[startIndex:endIndex]
	
	// 返回结果
	c.JSON(http.StatusOK, pagedResources)
}



// GetPublicResources 获取公开资源列表
func GetPublicResources(c *gin.Context) {
	// 获取查询参数
	var params struct {
		Skip      int    `form:"skip" binding:"min=0"`
		Limit     int    `form:"limit" binding:"omitempty,min=1,max=100"`
		Search    string `form:"search"`
		SortBy    string `form:"sort_by" binding:"omitempty,oneof=created_at updated_at likes_count"`
		SortOrder string `form:"sort_order" binding:"omitempty,oneof=asc desc"`
		CountOnly bool   `form:"count_only"`
	}

	if err := c.ShouldBindQuery(&params); err != nil {
		log.Printf("参数绑定错误: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的查询参数"})
		return
	}

	// 设置默认值
	if params.Limit <= 0 {
		params.Limit = 24 // 设置默认显示数量为24条
	}

	// 打印请求参数用于调试
	log.Printf("获取公开资源：skip=%d, limit=%d, search=%s, sortBy=%s, sortOrder=%s, countOnly=%v",
		params.Skip, params.Limit, params.Search, params.SortBy, params.SortOrder, params.CountOnly)

	// 设置默认排序
	if params.SortBy == "" {
		params.SortBy = "updated_at"
	}
	if params.SortOrder == "" {
		params.SortOrder = "desc"
	}

	// 构建查询
	countQuery := "SELECT COUNT(*) FROM resources WHERE status = 'APPROVED' "
	queryParams := []interface{}{}

	// 添加搜索条件
	if params.Search != "" {
		searchTerm := "%" + params.Search + "%"
		countQuery += " AND (title LIKE ? OR title_en LIKE ?)"
		queryParams = append(queryParams, searchTerm, searchTerm)
	}

	// 获取总数
	var count int
	if err := models.DB.Get(&count, countQuery, queryParams...); err != nil {
		log.Printf("计算资源总数失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "计算资源总数失败"})
		return
	}
	log.Printf("符合条件的资源总数: %d", count)

	// 如果只需要计数，直接返回
	if params.CountOnly {
		c.JSON(http.StatusOK, gin.H{"count": count})
		return
	}

	// 如果没有记录，返回空数组
	if count == 0 {
		log.Printf("数据库中没有符合条件的记录")
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	// 构建查询SQL
	query := "SELECT * FROM resources WHERE status = 'APPROVED' "
	
	// 添加搜索条件
	if params.Search != "" {
		query += " AND (title LIKE ? OR title_en LIKE ?)"
	}
	
	// 添加排序
	query += " ORDER BY "
	switch params.SortBy {
	case "likes_count":
		query += "likes_count"
	case "created_at":
		query += "created_at"
	default:
		query += "updated_at"
	}
	
	if params.SortOrder == "asc" {
		query += " ASC"
	} else {
		query += " DESC"
	}
	
	// 添加分页
	query += " LIMIT ? OFFSET ?"
	queryParams = append(queryParams, params.Limit, params.Skip)

	// 执行查询
	rows, err := models.DB.Queryx(query, queryParams...)
	if err != nil {
		log.Printf("查询失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询资源列表失败"})
		return
	}
	defer rows.Close()

	// 准备结果集
	var resources []models.Resource
	for rows.Next() {
		var resource models.Resource
		if err := rows.StructScan(&resource); err != nil {
			log.Printf("扫描记录失败: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "处理查询结果失败"})
			return
		}
		resources = append(resources, resource)
	}

	if err := rows.Err(); err != nil {
		log.Printf("遍历结果集失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询资源列表失败"})
		return
	}

	// 如果有结果，在第一个资源中添加总数
	if len(resources) > 0 {
		// 将总数添加到响应中
		resources[0].TotalCount = &count
	}

	log.Printf("查询成功，返回 %d 条记录", len(resources))
	
	// 返回结果
	c.JSON(http.StatusOK, resources)
}

// GetResourceByID 获取单个资源
func GetResourceByID(c *gin.Context) {
	// 获取路径参数
	resourceID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		log.Printf("无效的资源ID参数: %s, 错误: %v", c.Param("id"), err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的资源ID"})
		return
	}
	
	log.Printf("尝试获取资源ID: %d", resourceID)

	isAdminView := c.DefaultQuery("is_admin_view", "false") == "true"
	
	// 检查数据库连接
	if models.DB == nil {
		log.Printf("数据库连接为空")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接错误"})
		return
	}
	
	// 尝试直接执行简单查询
	var count int
	err = models.DB.Get(&count, "SELECT COUNT(*) FROM resources WHERE id = ?", resourceID)
	if err != nil {
		log.Printf("检查资源ID: %d 是否存在时出错: %v", resourceID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "检查资源是否存在失败"})
		return
	}
	
	log.Printf("资源ID: %d 存在性检查结果: %d", resourceID, count)
	
	if count == 0 {
		log.Printf("资源ID: %d 不存在", resourceID)
		c.JSON(http.StatusNotFound, gin.H{"error": "资源未找到"})
		return
	}

	// 查询资源
	var resource models.Resource
	log.Printf("执行查询: SELECT * FROM resources WHERE id = %d", resourceID)
	err = models.DB.Get(&resource, `SELECT * FROM resources WHERE id = ?`, resourceID)
	if err != nil {
		log.Printf("查询资源ID: %d 失败: %v", resourceID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "资源未找到"})
		return
	}

	log.Printf("成功获取资源ID: %d, 标题: %s, 状态: %s", resource.ID, resource.Title, resource.Status)

	// 只有在公开页面访问时（非管理页面），才重定向补充审批记录到原始资源
	if !isAdminView && resource.IsSupplementApproval && resource.OriginalResourceID != nil {
		var originalResource models.Resource
		err = models.DB.Get(&originalResource, `SELECT * FROM resources WHERE id = ?`, *resource.OriginalResourceID)
		if err == nil {
			resource = originalResource
		}
	}

	// 确保审批通过的资源不会显示被拒绝的链接
	if resource.Status == models.ResourceStatusApproved && resource.Links != nil {
		// TODO: 过滤被拒绝的链接
	}

	c.JSON(http.StatusOK, resource)
}

// CreateResource 创建资源
func CreateResource(c *gin.Context) {
	// 解析请求
	var resourceReq models.ResourceCreate
	if err := c.ShouldBindJSON(&resourceReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数"})
		return
	}

	// 创建资源记录
	resource := models.Resource{
		Title:        resourceReq.Title,
		TitleEn:      resourceReq.TitleEn,
		Description:  resourceReq.Description,
		ResourceType: resourceReq.ResourceType,
		Status:       models.ResourceStatusPending,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
		LikesCount:   0,
	}

	log.Printf("resourceReq: %+v", resourceReq)

	// 设置图片和链接
	if len(resourceReq.Images) > 0 {
		resource.Images = resourceReq.Images
	}

	if resourceReq.PosterImage != "" {
		resource.PosterImage = &resourceReq.PosterImage
	}

	if resourceReq.Links != nil {
		resource.Links = resourceReq.Links
	}

	// 插入记录
	result, err := models.DB.Exec(
		`INSERT INTO resources (
			title, title_en, description, resource_type, images, poster_image, links,
			status, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		resource.Title, resource.TitleEn, resource.Description, resource.ResourceType,
		resource.Images, resource.PosterImage, resource.Links,
		resource.Status, resource.CreatedAt, resource.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("创建资源失败: %v", err)})
		return
	}

	// 获取插入的ID
	id, _ := result.LastInsertId()
	resource.ID = int(id)

	c.JSON(http.StatusCreated, resource)
}

// 添加一个辅助函数，用于转换资源的所有图片为WebP格式
func convertResourceImagesToWebP(images []string, resourceID int) ([]string, error) {
	if len(images) == 0 {
		return images, nil
	}
	
	webpImages := make([]string, 0, len(images))
	
	for _, imgPath := range images {
		// 只处理JPG和PNG图片
		ext := strings.ToLower(filepath.Ext(imgPath))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			// 不是支持的格式，保持原样
			webpImages = append(webpImages, imgPath)
			continue
		}
		
		// 转换为WebP，保持宽高比，最大尺寸600x900
		webpPath, err := utils.ConvertToWebPWithRatio(imgPath[7:], 600, 900, true)  // 去掉"/assets"前缀
		if err != nil {
			log.Printf("将图片 %s 转换为WebP失败: %v", imgPath, err)
			// 如果转换失败，保留原始图片
			webpImages = append(webpImages, imgPath)
		} else {
			// 转换成功，使用WebP图片路径
			webpImages = append(webpImages, "/assets/"+webpPath)
			log.Printf("成功将图片 %s 转换为WebP: %s", imgPath, "/assets/"+webpPath)
		}
	}
	
	return webpImages, nil
}

// UpdateResource 更新资源 - 仅管理员可访问
func UpdateResource(c *gin.Context) {
	// 获取路径参数
	resourceID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的资源ID"})
		return
	}

	log.Printf("开始更新资源ID: %d", resourceID)

	// 解析请求
	var resourceUpdate models.ResourceUpdate
	if err := c.ShouldBindJSON(&resourceUpdate); err != nil {
		log.Printf("请求参数解析失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的请求参数"})
		return
	}

	log.Printf("接收到资源更新请求: %+v", resourceUpdate)
	if resourceUpdate.PosterImage != nil {
		log.Printf("海报图片路径: %s", *resourceUpdate.PosterImage)
	} else {
		log.Printf("未设置海报图片")
	}

	// 检查资源是否存在
	var resource models.Resource
	err = models.DB.Get(&resource, `SELECT * FROM resources WHERE id = ?`, resourceID)
	if err != nil {
		log.Printf("无法找到资源: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "资源未找到"})
		return
	}

	log.Printf("已找到资源: %+v", resource)

	// 更新资源字段
	updated := false

	if resourceUpdate.Title != nil {
		resource.Title = *resourceUpdate.Title
		updated = true
	}

	if resourceUpdate.TitleEn != nil {
		resource.TitleEn = *resourceUpdate.TitleEn
		updated = true
	}

	if resourceUpdate.Description != nil {
		resource.Description = *resourceUpdate.Description
		updated = true
	}

	if resourceUpdate.ResourceType != nil {
		resource.ResourceType = *resourceUpdate.ResourceType
		updated = true
	}

	// 处理图片更新
	if len(resourceUpdate.Images) > 0 {
		log.Printf("处理图片更新，收到 %d 张图片", len(resourceUpdate.Images))
		// 检查图片是否在临时目录中，如果是则移动到永久目录
		imagesToMove := make([]string, 0)
		var posterImageInUpload bool
		var posterImageOriginalPath string
		
		// 检查海报图片是否在待上传图片中
		if resourceUpdate.PosterImage != nil && *resourceUpdate.PosterImage != "" && 
		   strings.Contains(*resourceUpdate.PosterImage, "/assets/uploads/") {
			posterImageInUpload = true
			posterImageOriginalPath = *resourceUpdate.PosterImage
			log.Printf("海报图片在上传图片中: %s", posterImageOriginalPath)
		}
		
		for _, img := range resourceUpdate.Images {
			// 检查图片是否在uploads目录中
			if strings.Contains(img, "/assets/uploads/") {
				log.Printf("图片需要移动: %s", img)
				imagesToMove = append(imagesToMove, img)
			}
		}
		
		// 如果有需要移动的图片，则进行移动
		if len(imagesToMove) > 0 {
			log.Printf("开始移动 %d 张图片", len(imagesToMove))
			newImagePaths, err := utils.MoveApprovedImages(resourceID, imagesToMove)
			if err != nil {
				log.Printf("移动图片失败: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("移动图片失败: %v", err)})
				return
			}
			log.Printf("图片移动完成，新路径: %v", newImagePaths)
			
			// 如果海报图片在待移动图片中，更新其路径
			if posterImageInUpload {
				// 在移动后的图片中查找对应海报的新路径
				for i, oldPath := range imagesToMove {
					if oldPath == posterImageOriginalPath {
						if i < len(newImagePaths) {
							newPosterPath := newImagePaths[i]
							log.Printf("更新海报图片路径: %s -> %s", posterImageOriginalPath, newPosterPath)
							resource.PosterImage = &newPosterPath
						}
						break
					}
				}
			}
			
			// 更新图片路径（保留不需要移动的图片）
			finalImages := make([]string, 0)
			
			for _, img := range resourceUpdate.Images {
				if !strings.Contains(img, "/assets/uploads/") {
					finalImages = append(finalImages, img)
				}
			}
			
			// 添加移动后的图片路径
			finalImages = append(finalImages, newImagePaths...)
			
			// 尝试将图片转换为WebP格式
			webpImages, err := convertResourceImagesToWebP(finalImages, resourceID)
			if err != nil {
				log.Printf("转换图片为WebP格式时出错: %v", err)
				// 发生错误时继续使用原始图片
			} else {
				finalImages = webpImages
				
				// 如果海报图片被转换为WebP，也需要更新海报路径
				if posterImageInUpload && resource.PosterImage != nil {
					originalPosterPath := *resource.PosterImage
					for i, oldPath := range finalImages {
						if oldPath == originalPosterPath && i < len(webpImages) {
							webpPosterPath := webpImages[i]
							log.Printf("更新海报图片WebP路径: %s -> %s", originalPosterPath, webpPosterPath)
							resource.PosterImage = &webpPosterPath
							break
						}
					}
				}
			}
			
			resource.Images = finalImages
			updated = true
		} else {
			// 如果没有需要移动的图片，直接尝试转换为WebP
			webpImages, err := convertResourceImagesToWebP(resourceUpdate.Images, resourceID)
			if err != nil {
				log.Printf("转换图片为WebP格式时出错: %v", err)
				// 发生错误时继续使用原始图片
				resource.Images = resourceUpdate.Images
			} else {
				resource.Images = webpImages
			}
			updated = true
		}
	}

	// 处理海报图片更新，但仅当它不是来自上述已处理的上传图片
	if resourceUpdate.PosterImage != nil && !strings.Contains(*resourceUpdate.PosterImage, "/assets/uploads/") {
		log.Printf("处理海报图片更新: %s", *resourceUpdate.PosterImage)
		if *resourceUpdate.PosterImage != "" {
			// 无需再次移动已经处理过的上传图片
			resource.PosterImage = resourceUpdate.PosterImage
		} else {
			log.Printf("清除海报图片设置")
			resource.PosterImage = resourceUpdate.PosterImage
		}
		updated = true
	} else {
		log.Printf("海报图片已在图片处理逻辑中处理或未更新")
	}

	if resourceUpdate.Links != nil {
		resource.Links = resourceUpdate.Links
		updated = true
	}

	if !updated {
		log.Printf("无字段更新")
		c.JSON(http.StatusBadRequest, gin.H{"error": "无任何字段需要更新"})
		return
	}

	// 更新时间戳
	resource.UpdatedAt = time.Now()

	// 更新记录
	_, err = models.DB.Exec(
		`UPDATE resources SET 
			title = ?, title_en = ?, description = ?, resource_type = ?,
			images = ?, poster_image = ?, links = ?, updated_at = ?
		WHERE id = ?`,
		resource.Title, resource.TitleEn, resource.Description, resource.ResourceType,
		resource.Images, resource.PosterImage, resource.Links, resource.UpdatedAt,
		resource.ID,
	)

	if err != nil {
		log.Printf("更新资源失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("更新资源失败: %v", err)})
		return
	}

	log.Printf("资源更新成功: ID=%d", resourceID)
	c.JSON(http.StatusOK, resource)
}

// DeleteResource 删除资源 - 仅管理员可访问
func DeleteResource(c *gin.Context) {
	// 获取路径参数
	resourceID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的资源ID"})
		return
	}

	// 检查资源是否存在
	var count int
	err = models.DB.Get(&count, `SELECT COUNT(*) FROM resources WHERE id = ?`, resourceID)
	if err != nil || count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "资源未找到"})
		return
	}

	// 删除资源
	_, err = models.DB.Exec(`DELETE FROM resources WHERE id = ?`, resourceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除资源失败"})
		return
	}

	c.Status(http.StatusNoContent)
}
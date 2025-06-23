package models

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"
)

// Post 表示一篇完整的文章
type Post struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Content     string    `json:"content"`
	Author      string    `json:"author"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	IsMarkdown  bool      `json:"is_markdown"`
	Tags        []string  `json:"tags"`
	Cover       string    `json:"cover"`
	IsPublished bool      `json:"is_published"`
	Path        string    `json:"path"` // 文章路径，相对于 posts 目录
}

// PostSummary 表示文章的摘要信息
type PostSummary struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Author      string    `json:"author"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	IsMarkdown  bool      `json:"is_markdown"`
	Tags        []string  `json:"tags"`
	Cover       string    `json:"cover"`
	IsPublished bool      `json:"is_published"`
	Path        string    `json:"path"`
}

// min 返回两个整数中的较小值
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GenerateSlug 从标题生成slug
func GenerateSlug(title string) string {
	// 检查是否包含中文字符
	if containsChineseChar(title) {
		// 对于中文标题，直接使用原标题，但替换不能作为文件名的字符
		slug := title
		// 替换不能作为文件名的字符
		slug = replaceInvalidFileNameChars(slug)
		// 删除开头和结尾的连字符或空格
		slug = strings.Trim(slug, "- ")
		if slug == "" {
			return fmt.Sprintf("post-%d", time.Now().Unix())
		}
		return slug
	}
	
	// 非中文标题使用原来的转换逻辑
	// 将标题转换为小写
	slug := strings.ToLower(title)
	
	// 替换非字母数字字符为连字符
	reg := regexp.MustCompile("[^a-z0-9]+")
	slug = reg.ReplaceAllString(slug, "-")
	
	// 删除开头和结尾的连字符
	slug = strings.Trim(slug, "-")
	
	// 确保不为空
	if slug == "" {
		return fmt.Sprintf("post-%d", time.Now().Unix())
	}
	
	return slug
}

// containsChineseChar 检查字符串是否包含中文字符
func containsChineseChar(str string) bool {
	for _, r := range str {
		if unicode.Is(unicode.Han, r) {
			return true
		}
	}
	return false
}

// replaceInvalidFileNameChars 替换文件名中的非法字符
func replaceInvalidFileNameChars(str string) string {
	// 替换Windows和Unix系统中的非法字符
	invalidChars := []string{"\\", "/", ":", "*", "?", "\"", "<", ">", "|"}
	result := str
	for _, char := range invalidChars {
		result = strings.ReplaceAll(result, char, "-")
	}
	return result
}

// SavePost 保存文章（创建或更新）
func SavePost(post *Post, basePath string) error {
	postsDir := filepath.Join(basePath, "posts")
	
	// 确保目录存在
	if err := os.MkdirAll(postsDir, 0755); err != nil {
		return err
	}
	
	// 确保有标题和slug
	if post.Title == "" {
		post.Title = fmt.Sprintf("新文章 - %s", time.Now().Format("2006-01-02"))
	}
	
	// 如果slug为空，从标题生成
	if post.Slug == "" {
		post.Slug = GenerateSlug(post.Title)
	}
	
	// 构建保存路径
	var targetDir string
	var fileName string
	
	// 如果指定了路径，则使用该路径
	if post.Path != "" {
		// 提取目录部分（去掉文件名）
		targetDir = filepath.Dir(filepath.Join(postsDir, post.Path))
		fileName = filepath.Base(post.Path)
	} else {
		targetDir = postsDir
		fileName = fmt.Sprintf("%s.md", post.Slug)
	}
	
	// 确保目标目录存在
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}
	
	// 文件已存在的情况（更新现有文章）
	if !post.CreatedAt.IsZero() {
		post.UpdatedAt = time.Now()
		
		// 如果路径变更，需要找到旧文件并删除
		if post.Path != "" {
			oldFilePath := filepath.Join(postsDir, post.Path)
			if _, err := os.Stat(oldFilePath); err == nil {
				// 文件存在，路径没变，直接使用现有路径
				fileName = filepath.Base(post.Path)
			} else {
				// 文件不存在或路径变更，需要查找并删除旧文件
				var oldPath string
				err := filepath.Walk(postsDir, func(path string, info os.FileInfo, err error) error {
					if err != nil {
						return nil // 继续处理其他文件
					}
					
					// 只处理markdown文件
					if info.IsDir() || (!strings.HasSuffix(info.Name(), ".md") && !strings.HasSuffix(info.Name(), ".markdown")) {
						return nil
					}
					
					// 计算ID
					hasher := md5.New()
					hasher.Write([]byte(path))
					fileID := hex.EncodeToString(hasher.Sum(nil))
					
					// 如果ID匹配，找到了旧文件
					if fileID == post.ID {
						oldPath = path
						return filepath.SkipAll
					}
					
					return nil
				})
				
				if err == nil && oldPath != "" && oldPath != filepath.Join(targetDir, fileName) {
					// 删除旧文件
					os.Remove(oldPath)
				}
			}
		}
	} else {
		// 新文章
		post.CreatedAt = time.Now()
		post.UpdatedAt = time.Now()
	}
	
	// 构建完整的文件路径
	filePath := filepath.Join(targetDir, fileName)
	
	// 生成稳定的ID，基于文件路径
	hasher := md5.New()
	hasher.Write([]byte(filePath))
	post.ID = hex.EncodeToString(hasher.Sum(nil))
	
	// 从文件路径提取相对路径作为Path属性
	relPath, err := filepath.Rel(postsDir, filePath)
	if err == nil {
		post.Path = filepath.ToSlash(relPath)
	}
	
	// 构建Markdown内容，包括元数据
	var contentBuilder strings.Builder
	
	// 添加元数据
	contentBuilder.WriteString(fmt.Sprintf("# %s\n\n", post.Title))
	
	if post.Author != "" {
		contentBuilder.WriteString(fmt.Sprintf("作者: %s\n", post.Author))
	}
	
	if len(post.Tags) > 0 {
		contentBuilder.WriteString(fmt.Sprintf("标签: %s\n", strings.Join(post.Tags, ", ")))
	}
	
	if post.Cover != "" {
		contentBuilder.WriteString(fmt.Sprintf("封面: %s\n", post.Cover))
	}
	
	contentBuilder.WriteString("\n")
	
	// 添加正文内容（如果内容不是以标题开始，则保留原内容）
	content := post.Content
	if strings.HasPrefix(strings.TrimSpace(content), "# ") {
		// 内容已经包含标题，移除第一个标题行及其后的元数据
		lines := strings.Split(content, "\n")
		startIndex := 0
		for i, line := range lines {
			if strings.TrimSpace(line) == "" && i > 0 {
				startIndex = i + 1
				break
			}
		}
		if startIndex > 0 && startIndex < len(lines) {
			content = strings.Join(lines[startIndex:], "\n")
		}
	}
	
	contentBuilder.WriteString(content)
	
	// 写入文件
	return ioutil.WriteFile(filePath, []byte(contentBuilder.String()), 0644)
}

// GetAllPosts 获取所有文章的摘要信息
func GetAllPosts(basePath string) ([]PostSummary, error) {
	postsDir := filepath.Join(basePath, "posts")
	
	// 初始化一个空数组，确保即使没有文章也返回空数组而不是null
	var posts []PostSummary = []PostSummary{}
	
	// 检查目录是否存在
	if _, err := os.Stat(postsDir); os.IsNotExist(err) {
		// 如果目录不存在，创建它
		if err := os.MkdirAll(postsDir, 0755); err != nil {
			return posts, err
		}
		return posts, nil
	}
	
	// 递归处理目录
	err := filepath.Walk(postsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		
		// 如果是目录，跳过（不直接处理目录）
		if info.IsDir() {
			return nil
		}
		
		// 只处理markdown文件
		if strings.HasSuffix(info.Name(), ".md") || strings.HasSuffix(info.Name(), ".markdown") {
			fileName := info.Name()
			fileNameWithoutExt := strings.TrimSuffix(fileName, filepath.Ext(fileName))
			
			// 计算文件相对于posts目录的相对路径
			relPath, err := filepath.Rel(postsDir, path)
			if err != nil {
				return nil // 跳过这个文件
			}
			
			// 获取父目录作为分类
			dirPath := filepath.Dir(relPath)
			if dirPath == "." {
				dirPath = "" // 根目录
			}
			
			// 读取文件内容
			content, err := ioutil.ReadFile(path)
			if err != nil {
				return nil // 跳过这个文件
			}
			
			// 默认使用文件名作为标题和slug
			title := fileNameWithoutExt
			slug := fileNameWithoutExt
			createdAt := info.ModTime()
			
			// 尝试从文件名提取日期和标题（如果是日期-标题格式）
			datePattern := regexp.MustCompile(`^(\d{4}-\d{2}-\d{2})-(.+)$`)
			matches := datePattern.FindStringSubmatch(fileNameWithoutExt)
			if len(matches) == 3 {
				// 如果文件名符合日期-标题格式
				dateStr := matches[1]
				titleFromFileName := matches[2]
				parsedDate, err := time.Parse("2006-01-02", dateStr)
				if err == nil {
					// 如果成功解析日期
					createdAt = parsedDate
					title = titleFromFileName
					slug = titleFromFileName // 使用标题部分作为slug
				}
			}
			
			// 尝试从内容中提取H1标题作为文章标题
			contentLines := strings.Split(string(content), "\n")
			for _, line := range contentLines[:min(5, len(contentLines))] {
				line = strings.TrimSpace(line)
				if strings.HasPrefix(line, "# ") {
					// 找到H1标题，使用它作为文章标题
					extractedTitle := strings.TrimSpace(strings.TrimPrefix(line, "# "))
					if extractedTitle != "" {
						title = extractedTitle
					}
					break
				}
			}
			
			// 生成稳定的ID，基于文件路径
			hasher := md5.New()
			hasher.Write([]byte(path))
			id := hex.EncodeToString(hasher.Sum(nil))
			
			// 创建文章摘要对象
			post := PostSummary{
				ID:          id,
				Title:       title,
				Slug:        slug,
				Author:      "", // 从Markdown内容中提取作者信息（如果有）
				CreatedAt:   createdAt,
				UpdatedAt:   info.ModTime(),
				IsMarkdown:  true,
				Tags:        []string{}, // 从Markdown内容中提取标签信息（如果有）
				Cover:       "", // 从Markdown内容中提取封面图片（如果有）
				IsPublished: true,
				Path:        filepath.ToSlash(relPath), // 设置文章路径
			}
			
			// 尝试从内容中提取更多元数据（作者、标签等）
			for _, line := range contentLines[:min(20, len(contentLines))] {
				line = strings.TrimSpace(line)
				
				// 提取作者信息
				if strings.HasPrefix(line, "作者:") || strings.HasPrefix(line, "Author:") {
					post.Author = strings.TrimSpace(strings.Split(line, ":")[1])
				}
				
				// 提取标签信息
				if strings.HasPrefix(line, "标签:") || strings.HasPrefix(line, "Tags:") {
					tagsPart := strings.TrimSpace(strings.Split(line, ":")[1])
					tags := strings.Split(tagsPart, ",")
					for i, tag := range tags {
						tags[i] = strings.TrimSpace(tag)
					}
					post.Tags = tags
				}
				
				// 提取封面图片
				if strings.HasPrefix(line, "封面:") || strings.HasPrefix(line, "Cover:") {
					post.Cover = strings.TrimSpace(strings.Split(line, ":")[1])
				}
			}
			
			posts = append(posts, post)
		}
		
		return nil
	})
	
	if err != nil {
		return posts, err
	}
	
	return posts, nil
}

// GetPostByID 通过ID获取文章详情
func GetPostByID(id string, basePath string) (*Post, error) {
	// 由于我们现在完全依赖Markdown文件，而不是JSON文件
	// 我们需要先获取所有文章，然后根据ID查找
	posts, err := GetAllPosts(basePath)
	if err != nil {
		return nil, err
	}
	
	// 查找匹配ID的文章
	for _, postSummary := range posts {
		if postSummary.ID == id {
			// 找到匹配的文章，通过slug获取完整内容
			return GetPostBySlug(postSummary.Slug, basePath)
		}
	}
	
	return nil, fmt.Errorf("post with ID '%s' not found", id)
}

// GetPostBySlug 通过slug获取文章详情
func GetPostBySlug(slug string, basePath string) (*Post, error) {
	postsDir := filepath.Join(basePath, "posts")
	var foundPost *Post
	
	// 递归查找文件
	err := filepath.Walk(postsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // 继续处理其他文件
		}
		
		// 只处理文件
		if info.IsDir() {
			return nil
		}
		
		// 只处理markdown文件
		if !strings.HasSuffix(info.Name(), ".md") && !strings.HasSuffix(info.Name(), ".markdown") {
			return nil
		}
		
		fileName := info.Name()
		fileNameWithoutExt := strings.TrimSuffix(fileName, filepath.Ext(fileName))
		
		// 如果slug匹配文件名（不包含扩展名）或者是文件名的一部分
		if fileNameWithoutExt == slug || strings.Contains(fileNameWithoutExt, slug) {
			content, err := ioutil.ReadFile(path)
			if err != nil {
				return nil // 继续处理其他文件
			}
			
			// 计算文件相对于posts目录的相对路径
			relPath, err := filepath.Rel(postsDir, path)
			if err != nil {
				return nil
			}
			
			// 默认使用文件名作为标题和slug
			title := fileNameWithoutExt
			fileSlug := fileNameWithoutExt
			createdAt := info.ModTime()
			
			// 尝试从文件名提取日期和标题（如果是日期-标题格式）
			datePattern := regexp.MustCompile(`^(\d{4}-\d{2}-\d{2})-(.+)$`)
			matches := datePattern.FindStringSubmatch(fileNameWithoutExt)
			if len(matches) == 3 {
				// 如果文件名符合日期-标题格式
				dateStr := matches[1]
				titleFromFileName := matches[2]
				parsedDate, err := time.Parse("2006-01-02", dateStr)
				if err == nil {
					// 如果成功解析日期
					createdAt = parsedDate
					title = titleFromFileName
					fileSlug = titleFromFileName
				}
			}
			
			// 尝试从内容中提取H1标题作为文章标题
			contentLines := strings.Split(string(content), "\n")
			for _, line := range contentLines[:min(5, len(contentLines))] {
				line = strings.TrimSpace(line)
				if strings.HasPrefix(line, "# ") {
					// 找到H1标题，使用它作为文章标题
					extractedTitle := strings.TrimSpace(strings.TrimPrefix(line, "# "))
					if extractedTitle != "" {
						title = extractedTitle
					}
					break
				}
			}
			
			// 生成稳定的ID，基于文件路径
			hasher := md5.New()
			hasher.Write([]byte(path))
			id := hex.EncodeToString(hasher.Sum(nil))
			
			// 创建文章对象
			post := &Post{
				ID:          id,
				Title:       title,
				Slug:        fileSlug,
				Content:     string(content),
				Author:      "", // 从内容中提取
				CreatedAt:   createdAt,
				UpdatedAt:   info.ModTime(),
				IsMarkdown:  true,
				Tags:        []string{}, // 从内容中提取
				Cover:       "", // 从内容中提取
				IsPublished: true,
				Path:        filepath.ToSlash(relPath),
			}
			
			// 尝试从内容中提取更多元数据（作者、标签等）
			for _, line := range contentLines[:min(20, len(contentLines))] {
				line = strings.TrimSpace(line)
				
				// 提取作者信息
				if strings.HasPrefix(line, "作者:") || strings.HasPrefix(line, "Author:") {
					post.Author = strings.TrimSpace(strings.Split(line, ":")[1])
				}
				
				// 提取标签信息
				if strings.HasPrefix(line, "标签:") || strings.HasPrefix(line, "Tags:") {
					tagsPart := strings.TrimSpace(strings.Split(line, ":")[1])
					tags := strings.Split(tagsPart, ",")
					for i, tag := range tags {
						tags[i] = strings.TrimSpace(tag)
					}
					post.Tags = tags
				}
				
				// 提取封面图片
				if strings.HasPrefix(line, "封面:") || strings.HasPrefix(line, "Cover:") {
					post.Cover = strings.TrimSpace(strings.Split(line, ":")[1])
				}
			}
			
			foundPost = post
			return filepath.SkipAll // 找到了，停止遍历
		}
		
		return nil
	})
	
	if err != nil && err != filepath.SkipAll {
		return nil, err
	}
	
	if foundPost == nil {
		return nil, fmt.Errorf("post with slug '%s' not found", slug)
	}
	
	return foundPost, nil
}

// DeletePost 删除文章
func DeletePost(id string, basePath string) error {
	// 获取所有文章
	posts, err := GetAllPosts(basePath)
	if err != nil {
		return err
	}
	
	// 查找匹配ID的文章
	var targetSlug string
	var targetPath string
	for _, post := range posts {
		if post.ID == id {
			targetSlug = post.Slug
			targetPath = post.Path // 使用Path来精确定位文件
			break
		}
	}
	
	if targetSlug == "" {
		return fmt.Errorf("post with ID '%s' not found", id)
	}
	
	// 如果有Path，直接使用完整路径删除
	if targetPath != "" {
		fullPath := filepath.Join(basePath, "posts", targetPath)
		if _, err := os.Stat(fullPath); err == nil {
			return os.Remove(fullPath)
		}
	}
	
	// 否则，递归查找并删除文件
	postsDir := filepath.Join(basePath, "posts")
	var fileToDelete string
	
	err = filepath.Walk(postsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // 继续处理其他文件
		}
		
		// 只处理文件
		if info.IsDir() {
			return nil
		}
		
		// 只处理markdown文件
		if !strings.HasSuffix(info.Name(), ".md") && !strings.HasSuffix(info.Name(), ".markdown") {
			return nil
		}
		
		fileNameWithoutExt := strings.TrimSuffix(info.Name(), filepath.Ext(info.Name()))
		if strings.Contains(fileNameWithoutExt, targetSlug) {
			fileToDelete = path
			return filepath.SkipAll // 找到了，停止遍历
		}
		
		return nil
	})
	
	if err != nil && err != filepath.SkipAll {
		return err
	}
	
	if fileToDelete != "" {
		return os.Remove(fileToDelete)
	}
	
	return fmt.Errorf("markdown file for post with ID '%s' not found", id)
}

// SearchPosts 搜索文章
func SearchPosts(query string, basePath string) ([]PostSummary, error) {
	// 初始化一个空数组，确保即使没有匹配的文章也返回空数组而不是null
	var results []PostSummary = []PostSummary{}
	
	// 获取所有文章
	posts, err := GetAllPosts(basePath)
	if err != nil {
		return results, err
	}
	
	// 如果查询为空，返回所有文章
	if query == "" {
		return posts, nil
	}
	
	// 将查询转换为小写以进行不区分大小写的搜索
	query = strings.ToLower(query)
	
	// 搜索匹配的文章
	for _, post := range posts {
		// 在标题、描述、作者和标签中搜索
		if strings.Contains(strings.ToLower(post.Title), query) ||
			strings.Contains(strings.ToLower(post.Author), query) {
			results = append(results, post)
			continue
		}
		
		// 在标签中搜索
		for _, tag := range post.Tags {
			if strings.Contains(strings.ToLower(tag), query) {
				results = append(results, post)
				break
			}
		}
	}
	
	return results, nil
} 
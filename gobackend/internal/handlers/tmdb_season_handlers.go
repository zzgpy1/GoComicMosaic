package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"dongman/internal/utils"
	"dongman/internal/models"
)

// GetTMDBSeasons 获取动漫季节信息
// @Summary 获取动漫的所有季信息
// @Description 根据TMDB ID获取动漫的所有季信息
// @Tags TMDB
// @Accept json
// @Produce json
// @Param series_id path int true "TMDB 系列ID"
// @Success 200 {object} utils.AnimeInfo
// @Failure 400 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /api/tmdb/seasons/{series_id} [get]
func GetTMDBSeasons(c *gin.Context) {
	// 获取路径参数
	seriesIDStr := c.Param("series_id")
	seriesID, err := strconv.Atoi(seriesIDStr)
	if err != nil {
		log.Printf("解析系列ID失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的系列ID"})
		return
	}

	// 获取季节信息
	animeInfo, err := utils.GetAnimeSeasons(seriesID)
	if err != nil {
		log.Printf("获取季节信息失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, animeInfo)
}

// GetTMDBEpisodes 获取季的所有集详情
// @Summary 获取某季的所有集详情
// @Description 根据TMDB ID和季号获取季的所有集详情
// @Tags TMDB
// @Accept json
// @Produce json
// @Param series_id path int true "TMDB 系列ID"
// @Param season_number path int true "季号"
// @Success 200 {object} utils.SeasonDetailsResponse
// @Failure 400 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /api/tmdb/seasons/{series_id}/{season_number} [get]
func GetTMDBEpisodes(c *gin.Context) {
	// 获取路径参数
	seriesIDStr := c.Param("series_id")
	seriesID, err := strconv.Atoi(seriesIDStr)
	if err != nil {
		log.Printf("解析系列ID失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的系列ID"})
		return
	}

	seasonNumberStr := c.Param("season_number")
	seasonNumber, err := strconv.Atoi(seasonNumberStr)
	if err != nil {
		log.Printf("解析季号失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的季号"})
		return
	}

	// 获取集详情
	seasonDetails, err := utils.GetEpisodeDetails(seriesID, seasonNumber)
	if err != nil {
		log.Printf("获取集详情失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, seasonDetails)
}

// GetTMDBEpisodeImages 获取某集的剧照
// @Summary 获取某集的所有剧照
// @Description 根据TMDB ID、季号和集号获取剧集的剧照
// @Tags TMDB
// @Accept json
// @Produce json
// @Param series_id path int true "TMDB 系列ID"
// @Param season_number path int true "季号"
// @Param episode_number path int true "集号"
// @Success 200 {array} string
// @Failure 400 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /api/tmdb/seasons/{series_id}/{season_number}/{episode_number}/images [get]
func GetTMDBEpisodeImages(c *gin.Context) {
	// 获取路径参数
	seriesIDStr := c.Param("series_id")
	seriesID, err := strconv.Atoi(seriesIDStr)
	if err != nil {
		log.Printf("解析系列ID失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的系列ID"})
		return
	}

	seasonNumberStr := c.Param("season_number")
	seasonNumber, err := strconv.Atoi(seasonNumberStr)
	if err != nil {
		log.Printf("解析季号失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的季号"})
		return
	}

	episodeNumberStr := c.Param("episode_number")
	episodeNumber, err := strconv.Atoi(episodeNumberStr)
	if err != nil {
		log.Printf("解析集号失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的集号"})
		return
	}

	// 获取剧照
	imageURLs, err := utils.GetEpisodeImages(seriesID, seasonNumber, episodeNumber)
	if err != nil {
		log.Printf("获取剧照失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"images": imageURLs})
}

// GetTMDBEpisodeCredits 获取某集的演员信息
// @Summary 获取某集的演员信息
// @Description 根据TMDB ID、季号和集号获取剧集的演员信息
// @Tags TMDB
// @Accept json
// @Produce json
// @Param series_id path int true "TMDB 系列ID"
// @Param season_number path int true "季号"
// @Param episode_number path int true "集号"
// @Success 200 {object} utils.CreditsResponse
// @Failure 400 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /api/tmdb/seasons/{series_id}/{season_number}/{episode_number}/credits [get]
func GetTMDBEpisodeCredits(c *gin.Context) {
	// 获取路径参数
	seriesIDStr := c.Param("series_id")
	seriesID, err := strconv.Atoi(seriesIDStr)
	if err != nil {
		log.Printf("解析系列ID失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的系列ID"})
		return
	}

	seasonNumberStr := c.Param("season_number")
	seasonNumber, err := strconv.Atoi(seasonNumberStr)
	if err != nil {
		log.Printf("解析季号失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的季号"})
		return
	}

	episodeNumberStr := c.Param("episode_number")
	episodeNumber, err := strconv.Atoi(episodeNumberStr)
	if err != nil {
		log.Printf("解析集号失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的集号"})
		return
	}

	// 获取演员信息
	credits, err := utils.GetEpisodeCredits(seriesID, seasonNumber, episodeNumber)
	if err != nil {
		log.Printf("获取演员信息失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, credits)
}

// GetEpisodeInfo 获取单集详细信息
// @Summary 获取单集的详细信息(包括剧照和演员)
// @Description 获取指定剧集的详细信息，包括基本信息、剧照和演员信息
// @Tags TMDB
// @Accept json
// @Produce json
// @Param series_id path int true "TMDB 系列ID"
// @Param season_number path int true "季号"
// @Param episode_number path int true "集号"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /api/tmdb/episode/{series_id}/{season_number}/{episode_number} [get]
func GetEpisodeInfo(c *gin.Context) {
	// 获取路径参数
	seriesIDStr := c.Param("series_id")
	seriesID, err := strconv.Atoi(seriesIDStr)
	if err != nil {
		log.Printf("解析系列ID失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的系列ID"})
		return
	}

	seasonNumberStr := c.Param("season_number")
	seasonNumber, err := strconv.Atoi(seasonNumberStr)
	if err != nil {
		log.Printf("解析季号失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的季号"})
		return
	}

	episodeNumberStr := c.Param("episode_number")
	episodeNumber, err := strconv.Atoi(episodeNumberStr)
	if err != nil {
		log.Printf("解析集号失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的集号"})
		return
	}

	// 获取剧集详情
	seasonDetails, err := utils.GetEpisodeDetails(seriesID, seasonNumber)
	if err != nil {
		log.Printf("获取季详情失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 找到对应的集
	var targetEpisode *utils.Episode
	for i := range seasonDetails.Episodes {
		if seasonDetails.Episodes[i].EpisodeNumber == episodeNumber {
			targetEpisode = &seasonDetails.Episodes[i]
			break
		}
	}

	if targetEpisode == nil {
		log.Printf("未找到对应的集: 第%d季第%d集", seasonNumber, episodeNumber)
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到对应的集"})
		return
	}

	// 获取剧照
	images, err := utils.GetEpisodeImages(seriesID, seasonNumber, episodeNumber)
	if err != nil {
		log.Printf("获取剧照失败: %v", err)
		// 即使获取剧照失败也继续
	}

	// 获取演员信息
	credits, err := utils.GetEpisodeCredits(seriesID, seasonNumber, episodeNumber)
	if err != nil {
		log.Printf("获取演员信息失败: %v", err)
		// 即使获取演员信息失败也继续
	}

	// 组装返回数据
	var castResult []utils.Actor
	var guestStarsResult []utils.Actor
	
	if credits != nil {
		if len(credits.Cast) > 0 {
			castResult = credits.Cast
		} else {
			castResult = []utils.Actor{}
		}
		
		if len(credits.GuestStars) > 0 {
			guestStarsResult = credits.GuestStars
		} else {
			guestStarsResult = []utils.Actor{}
		}
	} else {
		castResult = []utils.Actor{}
		guestStarsResult = []utils.Actor{}
	}

	result := gin.H{
		"episode":      targetEpisode,
		"images":       images,
		"cast":         castResult,
		"guest_stars":  guestStarsResult,
		"season_name":  seasonDetails.Name,
		"season_id":    seasonDetails.ID,
	}

	c.JSON(http.StatusOK, result)
}

// GetResourceByTMDBID 通过TMDB ID查找本地资源
// @Summary 通过TMDB ID查找本地资源
// @Description 根据TMDB ID查找本地已导入的资源
// @Tags TMDB
// @Accept json
// @Produce json
// @Param tmdb_id path int true "TMDB ID"
// @Success 200 {object} models.Resource
// @Failure 400 {object} gin.H
// @Failure 404 {object} gin.H
// @Failure 500 {object} gin.H
// @Router /api/tmdb/resource/{tmdb_id} [get]
func GetResourceByTMDBID(c *gin.Context) {
	// 获取路径参数
	tmdbIDStr := c.Param("tmdb_id")
	tmdbID, err := strconv.Atoi(tmdbIDStr)
	if err != nil {
		log.Printf("解析TMDB ID失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的TMDB ID"})
		return
	}

	// 查询数据库
	var resource models.Resource
	err = models.DB.Get(&resource, `
		SELECT * FROM resources WHERE tmdb_id = ? LIMIT 1
	`, tmdbID)
	
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "未找到对应的资源"})
			return
		}
		log.Printf("查询资源失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询资源失败"})
		return
	}

	c.JSON(http.StatusOK, resource)
} 
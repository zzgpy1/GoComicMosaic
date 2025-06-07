// 网站设置相关路由
siteSettings := api.Group("/site-settings")
{
    siteSettings.GET("/:key", handlers.GetSiteSetting)
    siteSettings.GET("", handlers.GetAllSiteSettings)
    siteSettings.PUT("/:key", auth.AdminAuthMiddleware(), handlers.UpdateSiteSetting)
    siteSettings.POST("/favicon", auth.AdminAuthMiddleware(), handlers.UploadFavicon) // 新增图标上传路由
} 
/* ======================================================== */
/* 修复首页右侧推荐卡片 (Header/Hero) 在浅色模式下的黑底问题 */
/* ======================================================== */

/* 1. 浅色模式下：移除黑色渐变遮罩 */
#theme-hexo .header-cover::before {
  background: none !important;
  display: none !important;
}

/* 2. 浅色模式下：强制背景变为透明或白色 (取决于图片) */
#theme-hexo .header-cover {
  background-color: transparent !important; 
  /* 如果你的图片是透明PNG，想让底色变白，就用 white */
  /* background-color: white !important; */
}

/* 3. 浅色模式下：文字颜色改为黑色 (否则白底白字看不见) */
#theme-hexo .header-cover h1,
#theme-hexo .header-cover .text-white,
#theme-hexo .header-cover div {
  color: #000 !important;
  text-shadow: none !important; /* 去掉文字阴影 */
}

/* 4. 保持深色模式 (Dark Mode) 依旧是酷炫黑底白字 */
.dark #theme-hexo .header-cover::before {
  display: block !important;
  /* 恢复默认的渐变遮罩 */
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.2), rgba(0,0,0,0.8)) !important;
}

.dark #theme-hexo .header-cover {
  background-color: #000 !important;
  color: #fff !important;
}

.dark #theme-hexo .header-cover h1,
.dark #theme-hexo .header-cover .text-white,
.dark #theme-hexo .header-cover div {
  color: #fff !important;
}

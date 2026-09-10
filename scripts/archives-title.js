'use strict'

// 覆盖 Butterfly 主题的 findArchivesTitle（themes/butterfly/scripts/helpers/page.js）。
//
// 主题原逻辑：在 theme.menu 中查找链接包含 /archives/ 的菜单项，并返回该菜单项的
// 标签（key）作为归档页标题（themes/butterfly/layout/includes/head.pug 第 2 行会用它
// 覆盖 page.title）。这导致「菜单项标签」与「归档页标题」被强制同步，无法分别使用
// 简体 / 繁体。
//
// 本覆盖改为：
//   - 年 / 月归档页（page.year 存在）：沿用主题的日期格式化标题；
//   - 主归档页：读取 theme.config.archives_title（在 _config.butterfly.yml 配置），
//     不再跟随菜单标签，从而与菜单项（简体）解耦。
//
// 注意：Hexo 先加载站点 scripts/、后加载主题 scripts/，直接在脚本顶层 register 会被
// 主题实现覆盖。这里改在 after_init（所有脚本加载完成之后）注册，确保生效。
const archivesTitle = function (page, menu, date) {
  if (page.year) {
    const dateStr = page.month ? `${page.year}-${page.month}` : `${page.year}`
    const dateFormat = page.month ? hexo.theme.config.aside.card_archives.format : 'YYYY'
    return date(dateStr, dateFormat)
  }

  return hexo.theme.config.archives_title || page.title || this._p('page.archives')
}

hexo.extend.filter.register('after_init', function () {
  hexo.extend.helper.register('findArchivesTitle', archivesTitle)
})

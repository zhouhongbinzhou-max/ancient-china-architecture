# 中国古代建筑成就 AI 探索平台

## 项目简介

本项目是为辽宁省计算机设计竞赛开发的 Web 应用，属于软件应用与开发大类，Web 应用开发小类。项目聚焦于中国古代建筑成就，利用人工智能技术解决实际具体问题，促进中国建筑文化在海外的传播，促进中外建筑文化交流。

## 项目目标

- 展示中国古代建筑的伟大成就和文化内涵
- 利用 AI 技术提供智能建筑识别与分析功能
- 为用户提供交互式的古代建筑知识问答系统
- 促进中国古代建筑文化的传播和传承
- 支持多语言翻译，助力跨文化交流

## 核心功能

### 1. AI 智能功能

#### AI 问答系统
- 支持用户输入关于中国古代建筑的问题
- 基于火山引擎 Doubao 模型的智能回答
- 涵盖建筑历史、文化、技术等方面
- 支持上下文对话，提供专业、精准的解答

#### 图片识别与分析
- **单图识别**：上传单张建筑图片，AI 自动识别建筑类型、年代和特征
- **多图分析**：支持同时上传多张图片进行对比分析
- **智能解读**：提供详细的历史文化背景和技术特点分析
- **实时反馈**：带有详细的调试日志，方便问题排查

### 2. 智能翻译系统

#### 翻译功能特性
- **多语言支持**：支持中文、英语、日语、韩语、法语、西班牙语、德语、俄语等 8 种语言
- **智能翻译**：基于火山引擎 Doubao-Seed-Translation API 的高质量翻译
- **双向翻译**：支持任意语言对之间的互译
- **语言切换检测**：自动检测语言变化并清除翻译标记，确保翻译准确性
- **TreeWalker 技术**：递归提取所有文本节点，确保翻译完整性
- **进度显示**：实时显示翻译进度条
- **错误处理**：完善的错误提示和重试机制

#### 可拖动悬浮小部件
- **悬浮按钮拖动**：
  - 支持鼠标拖动（桌面端）
  - 支持触摸拖动（移动端）
  - 智能识别点击/拖动操作（移动距离 > 5px 判定为拖动）
  - 拖动时视觉反馈（cursor: grabbing）
  - 防止文本选择干扰（user-select: none）
  
- **翻译面板拖动**：
  - 通过面板头部（header）进行拖动
  - 排除关闭按钮区域，避免误操作
  - 支持鼠标和触摸双模式
  - 拖动完成后自动调整 transform-origin
  
- **位置持久化**：
  - 使用 localStorage 保存拖动后的位置
  - 页面刷新后自动恢复上次保存的位置
  - 支持独立保存按钮和面板位置
  - 容错处理（JSON 解析失败不影响使用）

- **CSS 样式优化**：
  ```css
  /* 防止拖动时选中文本 */
  user-select: none;
  -webkit-user-select: none;
  
  /* 拖动光标状态 */
  cursor: grab;        /* 可拖动状态 */
  cursor: grabbing;    /* 拖动中状态 */
  
  /* 拖动时的视觉反馈 */
  .dragging {
      cursor: grabbing;
  }
  
  /* 确保图标不干扰拖动事件 */
  pointer-events: none;
  ```

- **JavaScript 拖动逻辑**：
  ```javascript
  // 鼠标拖动
  toggle.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      // 记录初始位置
      const rect = widget.getBoundingClientRect();
      initialRight = window.innerWidth - rect.right;
      initialBottom = window.innerHeight - rect.bottom;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
  });
  
  // 触摸拖动（移动端）
  toggle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      // 触摸拖动逻辑
  });
  
  // 位置保存
  localStorage.setItem('translator_widget_position', 
      JSON.stringify({ right, bottom }));
  ```

- **技术亮点**：
  - TreeWalker API 递归遍历 DOM
  - MutationObserver 监听动态内容
  - LocalStorage 缓存用户偏好和位置
  - 进度条实时显示翻译状态
  - 智能点击/拖动识别
  - 跨设备兼容（鼠标 + 触摸）

### 3. 建筑文化展示

#### 著名建筑展示
- **代表建筑**：展示中国各历史时期的代表性建筑
- **宫殿建筑**：故宫、天坛等皇家建筑群
- **宗教建筑**：寺庙、道观、教堂等宗教建筑
- **园林建筑**：苏州园林、皇家园林等古典园林
- **民居建筑**：各地特色民居，如土楼、吊脚楼等
- **防御建筑**：长城、关隘等军事防御建筑

#### 文化专题
- **建筑文化**：天人合一哲学思想、礼制文化、装饰艺术、风水文化
- **建筑技法**：斗拱技术、木构架、榫卯结构、砖石工艺
- **建筑风格**：园林建筑、宗教建筑、宫殿建筑、民居建筑风格解析

### 4. 其他功能模块

- **文化名城**：展示中国历史文化名城
- **数据可视化**：建筑数据统计和可视化展示
- **旅游攻略**：建筑文化旅游路线推荐
- **国际交流**：促进中外建筑文化交流
- **论坛社区**：用户交流和讨论平台
- **关于我们**：项目介绍和团队信息
- **联系我们**：联系方式和反馈渠道
- **加入我们**：招募志同道合的伙伴

## 技术架构

### 前端技术栈
- **核心技术**：HTML5、CSS3、JavaScript (ES6+)
- **UI 设计**：
  - 响应式设计，适配 PC 端和移动端
  - 木质风格配色，体现中国古代建筑特色
  - 毛玻璃效果（backdrop-filter）增强视觉体验
  - 固定背景图（background-attachment: fixed）实现沉浸式体验
- **动画效果**：CSS3 动画和过渡效果
- **DOM 操作**：原生 JavaScript，TreeWalker API 用于文本提取

### 后端技术栈
- **运行环境**：Node.js
- **Web 框架**：Express.js
- **文件上传**：Multer（支持多图上传，10MB 限制）
- **跨域处理**：CORS 中间件
- **API 集成**：
  - 火山引擎 Doubao 模型（AI 问答和图片分析）
  - 火山引擎 Doubao-Seed-Translation API（智能翻译）

### AI 服务
- **AI 模型**：火山引擎 Doubao 多模态模型
- **接入方式**：自定义接入点（Endpoint ID）
- **功能支持**：
  - 文本对话（/api/v3/chat/completions）
  - 图片分析（/api/v3/chat/completions，支持多图）
  - 智能翻译（/api/v3/responses）

## 项目结构

```
Computer_Design/
├── index.html                    # 首页
├── about.html                    # 关于我们
├── contact.html                  # 联系我们
├── join.html                     # 加入我们
├── forum.html                    # 论坛社区
├── sitemap.html                  # 网站地图
├── terms.html                    # 服务条款
├── privacy.html                  # 隐私政策
├── translator.html               # 翻译器页面
│
├── test-ai.html                  # AI 问答测试页面（支持多图上传）
├── famous-buildings.html         # 著名建筑展示
├── architecture-culture.html     # 建筑文化专题
├── architecture-technique.html   # 建筑技法专题
├── architecture-style.html       # 建筑风格专题
├── cultural-cities.html          # 文化名城
├── data-visualization.html       # 数据可视化
├── travel-guide.html             # 旅游攻略
├── international-exchange.html   # 国际交流
│
├── server.js                     # Node.js 后端服务器
├── translator-widget.js          # 翻译器小部件核心代码
├── ai-responses.js               # AI 回答模拟（备用）
├── test.js                       # 测试脚本
│
├── package.json                  # 项目依赖配置
├── package-lock.json             # 依赖锁定文件
│
├── 创作素材/                     # 静态资源目录
│   ├── 首页全屏背景图.jpg
│   ├── 代表建筑/
│   │   ├── 代表建筑全屏背景图.jpg
│   │   └── 其他图片...
│   ├── 宫殿建筑/
│   ├── 宗教建筑/
│   ├── 园林建筑/
│   ├── 民居建筑/
│   ├── 防御建筑/
│   ├── 文化专题/
│   │   ├── 建筑文化/
│   │   ├── 建筑技法/
│   │   ├── 建筑风格/
│   │   └── 文化专题全屏背景图/
│   ├── ai 问答全屏背景图.jpg
│   ├── 关于我们动画图 1.jpg
│   └── 其他素材...
│
├── MULTI_IMAGE_ANALYSIS_FIX.md   # 多图分析修复文档
├── TRANSLATOR_INTEGRATION_GUIDE.md # 翻译器集成指南
└── README.md                     # 项目说明文档
```

## 安装与运行

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装步骤

1. **克隆或下载项目**
   ```bash
   cd Computer_Design
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动服务器**
   ```bash
   npm start
   ```
   或直接运行：
   ```bash
   node server.js
   ```

4. **访问应用**
   - 打开浏览器访问：`http://localhost:3001`
   - AI 问答页面：`http://localhost:3001/test-ai.html`
   - 翻译器页面：`http://localhost:3001/translator.html`

### API 端点

- `GET /` - 首页
- `POST /api/ask` - AI 问答接口
- `POST /api/analyze-image` - 图片分析接口（支持多图）
- `POST /api/translate` - 智能翻译接口
- `GET /创作素材/*` - 静态资源访问

## 功能特性详解

### 1. 多图上传与分析

**前端实现**（test-ai.html）：
- 支持拖拽上传和点击选择
- 图片预览和删除功能
- Base64 编码转换
- 数组形式发送所有图片

**后端实现**（server.js）：
- 接收图片数组
- 构建多模态 API 请求
- 支持最多 10MB 单文件
- 完善的错误处理和重试机制

**使用示例**：
1. 打开 AI 问答页面
2. 点击"上传图片"按钮
3. 选择一张或多张图片
4. 输入分析问题
5. 点击"发送"获取 AI 分析

### 2. 智能翻译系统

**翻译流程**：
1. 用户选择源语言和目标语言
2. 点击"开始翻译"
3. TreeWalker 递归提取所有文本节点
4. 批量发送文本到翻译 API
5. 接收翻译结果并替换原文本
6. 标记已翻译节点，避免重复翻译

**语言切换处理**：
- 自动检测语言配置变化
- 清除所有翻译标记
- 重新翻译为目标语言

**技术亮点**：
- TreeWalker API 递归遍历 DOM
- MutationObserver 监听动态内容
- LocalStorage 缓存用户偏好
- 进度条实时显示翻译状态

### 3. 毛玻璃视觉效果

**应用页面**：
- AI 问答页面聊天区域
- 主对话框容器
- 侧边栏

**CSS 实现**：
```css
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
background: rgba(255, 255, 255, 0.5);
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
```

**效果特点**：
- 20px 模糊强度
- 180% 色彩饱和度增强
- 半透明背景
- 柔和阴影增强层次感
- 无遮罩层，保持界面清爽

### 4. 全屏背景图

**实现方式**：
```css
background-image: url('创作素材/xxx.jpg');
background-size: cover;
background-position: center;
background-repeat: no-repeat;
background-attachment: fixed;
min-height: 100vh;
```

**应用页面**：
- 首页
- 著名建筑
- 文化专题（文化、技法、风格）
- AI 问答
- 其他所有页面

## 项目特色

1. **文化价值**：聚焦中国古代建筑成就，传播传统文化
2. **技术创新**：结合 AI 技术，提供智能交互体验
3. **用户友好**：直观的界面设计，易于操作和使用
   - 可拖动悬浮翻译器，自由定位
   - 智能点击/拖动识别，操作流畅
   - 位置记忆功能，个性化布局
4. **教育意义**：为用户提供了解中国古代建筑的平台
5. **国际化**：多语言翻译支持，促进跨文化交流
   - 8 种语言互译
   - 全站实时翻译
   - 语言自动检测
6. **性能优化**：
   - 前端资源懒加载
   - 后端 API 重试机制
   - LocalStorage 位置缓存
   - 动态内容监听
7. **可维护性**：模块化代码结构，完善的调试日志
8. **跨平台兼容**：
   - 鼠标操作（桌面端）
   - 触摸操作（移动端）
   - 响应式设计

## 参赛信息

- **竞赛类别**：辽宁省计算机设计竞赛
- **大类**：软件应用与开发
- **小类**：Web 应用开发
- **主题**：中国古代建筑成就
- **技术亮点**：
  - 人工智能技术在文化遗产保护和传播中的应用
  - 多模态 AI 模型支持图文识别
  - 火山引擎 API 深度集成
  - 全站智能翻译系统（8 种语言）
  - 可拖动悬浮小部件，支持位置记忆
  - 智能点击/拖动识别技术
  - 跨平台兼容（鼠标 + 触摸）
  - 毛玻璃视觉效果优化

## 技术难点与解决方案

### 1. 多图上传识别
**问题**：一次性上传多张图片时 AI 只识别第一张
**解决**：
- 前端修改为发送整个图片数组而非单张图片
- 后端构建支持多图片的 API 请求格式
- API 响应解析优化

### 2. 翻译完整性
**问题**：部分文本节点未被翻译
**解决**：
- 使用 TreeWalker API 递归提取所有文本节点
- 过滤空白节点和脚本样式内容
- 实现文本节点与 DOM 元素的精确映射

### 3. 双向翻译冲突
**问题**：中文→英文成功后，英文→中文无反应
**解决**：
- 添加语言变化检测机制
- 切换语言时清除所有翻译标记
- 使用 LocalStorage 记录当前翻译状态

### 4. 翻译 API 集成
**问题**：API 路径和请求格式不匹配
**解决**：
- 使用官方指定的 /api/v3/responses 路径
- 采用 input 数组格式而非 messages
- 配置 translation_options 参数

### 5. 可拖动功能实现
**问题**：翻译器小部件无法拖动，用户体验不佳
**解决**：
- **点击/拖动智能识别**：
  - 监听 mousedown/touchstart 事件
  - 记录初始位置和移动距离
  - 移动距离 > 5px 判定为拖动，否则为点击
  - 拖动时不触发点击事件

- **跨平台兼容**：
  - 桌面端：使用 mousedown + mousemove + mouseup
  - 移动端：使用 touchstart + touchmove + touchend
  - 触摸事件设置 passive: false 阻止默认滚动

- **位置持久化**：
  - 拖动完成后计算相对于视口的位置
  - 使用 localStorage 保存 right 和 bottom 值
  - 页面加载时读取并恢复保存的位置
  - JSON 解析失败时不影响正常使用

- **视觉反馈**：
  - CSS cursor 属性：grab（可拖动）/ grabbing（拖动中）
  - 添加 .dragging 类提供实时反馈
  - user-select: none 防止拖动时选中文本
  - pointer-events: none 确保子元素不拦截事件

- **面板拖动优化**：
  - 仅在面板头部（header）区域响应拖动
  - 排除关闭按钮，避免误操作
  - 动态调整 transform-origin 保持动画自然

### 6. 毛玻璃效果性能优化
**问题**：backdrop-filter 在某些设备上性能较差
**解决**：
- 同时使用 backdrop-filter 和 -webkit-backdrop-filter
- 合理设置 blur 值（15-20px）平衡效果和性能
- 添加 saturate(180%) 增强色彩表现
- 使用 box-shadow 增强层次感，减少对模糊的依赖

## 未来扩展

- [ ] 接入更多 AI 模型，提升识别准确率
- [ ] 增加 3D 建筑模型展示
- [ ] 开发建筑风格演变的可视化时间轴
- [ ] 添加 VR/AR 虚拟游览功能
- [ ] 支持更多语言版本
- [ ] 用户评论和收藏功能
- [ ] 建筑地图导航
- [ ] 离线模式支持
- [ ] PWA 渐进式 Web 应用
- [ ] 小程序版本开发
- [ ] 翻译器拖动轨迹优化（惯性滑动）
- [ ] 多翻译器实例支持（同时放置多个翻译器）
- [ ] 翻译器主题自定义（颜色、大小、样式）
- [ ] 拖动边界限制（防止拖出屏幕）
- [ ] 位置同步功能（多设备间同步翻译器位置）

## 开发团队

本项目由参赛团队独立开发，旨在通过现代 Web 技术传承和弘扬中国古代建筑文化。

## 技术支持

- **火山引擎 API 文档**：https://www.volcengine.com/docs/
- **Node.js 官方文档**：https://nodejs.org/
- **Express.js 指南**：https://expressjs.com/
- **MDN Web 文档**：https://developer.mozilla.org/

## 许可证

本项目为竞赛作品，版权所有。

## 致谢

感谢火山引擎提供的 AI 技术支持和 API 服务。

---

© 2026 中国古代建筑成就 AI 探索平台 | 辽宁省计算机设计竞赛

**最后更新**：2026-03-27
